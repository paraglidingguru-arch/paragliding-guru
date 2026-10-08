import { NextResponse } from "next/server";
import {
	matchesFlightLogType,
	safeAttachmentName,
} from "@/lib/applications/flight-logs";
import {
	ageInYears,
	escapeHtml,
	emailRow as row,
	sanitize,
} from "@/lib/applications/shared";
import {
	emptySivApplication,
	FLIGHT_LOG_MAX_TOTAL_BYTES,
	fileExtension,
	formatFileSize,
	isFlightLogExtension,
	isMinor,
	SIV_FIELD_LIMITS,
	type SivTextField,
	validateFlightLogs,
	validateSivApplication,
	withoutHiddenAnswers,
} from "@/lib/applications/siv";
import { batchOptions, findCourseByTitle, usesSivForm } from "@/lib/courses";
import { type MailAttachment, sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Files plus generous room for the text fields; Vercel itself stops at 4.5 MB. */
const MAX_BODY_BYTES = FLIGHT_LOG_MAX_TOTAL_BYTES + 256 * 1024;

type EmailSection = { title: string; rows: [label: string, value: string][] };

function fail(
	error: string,
	status = 400,
	fieldErrors?: Record<string, string>,
) {
	return NextResponse.json(
		{ ok: false, error, ...(fieldErrors ? { fieldErrors } : {}) },
		{ status },
	);
}

export async function POST(request: Request) {
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	if (contentLength > MAX_BODY_BYTES) {
		return fail(
			`Your files are too large. Please keep them under ${formatFileSize(FLIGHT_LOG_MAX_TOTAL_BYTES)} in total.`,
			413,
		);
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return fail("Invalid form submission.");
	}

	// Honeypot: hidden from real visitors, so anything in it means a bot.
	if (sanitize(formData.get("website"))) {
		return NextResponse.json({ ok: true });
	}

	const course = findCourseByTitle(sanitize(formData.get("courseTitle"), 200));
	if (!course || !usesSivForm(course)) {
		return fail("This course doesn't use the SIV application form.");
	}

	const submitted = { ...emptySivApplication };
	for (const key of Object.keys(SIV_FIELD_LIMITS) as SivTextField[]) {
		submitted[key] = sanitize(formData.get(key), SIV_FIELD_LIMITS[key]);
	}
	submitted.guardianConsent = formData.get("guardianConsent") === "true";
	const form = withoutHiddenAnswers(submitted);

	const fieldErrors = validateSivApplication(form);
	if (Object.keys(fieldErrors).length > 0) {
		return fail(
			"Please fill in all required fields correctly.",
			400,
			fieldErrors as Record<string, string>,
		);
	}

	if (!batchOptions(course).includes(form.batch)) {
		return fail(
			"The selected batch is no longer available. Please refresh the page and choose again.",
			400,
			{ batch: "Please choose a batch again." },
		);
	}

	const uploads = formData
		.getAll("flightLogs")
		.filter((entry): entry is File => typeof entry !== "string")
		.filter((file) => file.name !== "" || file.size > 0);

	const fileError = validateFlightLogs(uploads);
	if (fileError) {
		return fail(fileError, 400, { flightLogs: fileError });
	}

	const attachments: MailAttachment[] = [];
	for (const file of uploads) {
		const ext = fileExtension(file.name);
		if (!isFlightLogExtension(ext)) {
			return fail("Unsupported file type.", 400);
		}
		const content = Buffer.from(await file.arrayBuffer());
		if (!matchesFlightLogType(content, ext)) {
			const message = `"${file.name}" doesn't look like a valid ${ext.toUpperCase()} file.`;
			return fail(message, 400, { flightLogs: message });
		}
		attachments.push({ filename: safeAttachmentName(file.name, ext), content });
	}

	const minor = isMinor(form.dob);
	const age = ageInYears(form.dob);

	const sections: EmailSection[] = [
		{
			title: "Course",
			rows: [
				["Course", course.title],
				["Duration", course.duration],
				["Venue", course.venue],
				["Cost", course.cost],
			],
		},
		{
			title: "Applicant",
			rows: [
				["Full Name", form.fullName],
				["Date of Birth", form.dob],
				["Under 18", `${minor ? "Yes" : "No"}${age !== null ? ` (age ${age})` : ""}`],
				["Email", form.email],
				["Phone", form.phone],
				["Nationality", form.nationality],
				["Weight (kg)", form.weight],
				["Batch Applying For", form.batch],
				["Fitness Level", form.fitnessLevel],
			],
		},
		...(minor
			? [
					{
						title: "Parent / Legal Guardian",
						rows: [
							["Name", form.guardianName],
							["Phone", form.guardianPhone],
							["Email", form.guardianEmail],
							["Consent", "Ticked on the form — confirm with the guardian by email"],
						] as EmailSection["rows"],
					},
				]
			: []),
		{
			title: "Flying Experience & Equipment",
			rows: [
				["Pilot Rating / Licence", form.pilotRating],
				["Total Flying Hours", form.flyingHours],
				["Wing (Make / Model / Size)", form.wing],
				["Harness (Make / Model)", form.harness],
				["Reserve (Make / Model)", form.reserve],
				["Reserve Last Repacked", form.reserveRepackDate],
			],
		},
		{
			title: "Safety",
			rows: [
				["SIV Done Before", form.sivBefore],
				...(form.sivBefore === "Yes"
					? ([["SIV When / Where", form.sivBeforeDetails]] as EmailSection["rows"])
					: []),
				["Injury / Limitation / Safety Info", form.hasInjury],
				...(form.hasInjury === "Yes"
					? ([["Details", form.injuryDetails]] as EmailSection["rows"])
					: []),
			],
		},
		{
			title: "Flight Logs",
			rows:
				attachments.length > 0
					? attachments.map((file, index) => [
							`File ${index + 1}`,
							`${file.filename} (${formatFileSize(file.content.length)}) — attached`,
						])
					: [["Files", "None uploaded"]],
		},
	];

	const subject = `Course Application — ${course.title} — ${form.fullName}`;

	const text = sections
		.map((section) =>
			[
				`— ${section.title} —`,
				...section.rows.map(([label, value]) => `${label}: ${value || "—"}`),
			].join("\n"),
		)
		.join("\n\n");

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 640px;">
			<h2 style="color: #0D5C8F; margin-bottom: 8px;">New course application</h2>
			<p style="color: #5A6370; margin-top: 0;">Submitted via the PG Gurukul website course application form.</p>
			${sections
				.map(
					(section) => `
				<h3 style="color: #1A1D21; margin-top: 24px; margin-bottom: 8px;">${escapeHtml(section.title)}</h3>
				<table style="border-collapse: collapse; width: 100%;">
					${section.rows.map(([label, value]) => row(label, value)).join("")}
				</table>
			`,
				)
				.join("")}
		</div>
	`;

	try {
		await sendMail({ subject, text, html, replyTo: form.email, attachments });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[api/apply-course/siv] Failed to send email:", error);
		const configError =
			error instanceof Error && error.message.startsWith("Missing required");
		return fail(
			configError
				? "Email service is not configured. Please contact the administrator."
				: "Failed to submit your application. Please try again later.",
			500,
		);
	}
}
