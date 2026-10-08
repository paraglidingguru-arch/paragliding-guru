import { NextResponse } from "next/server";
import {
	ageInYears,
	countPhoneDigits,
	EMAIL_REGEX,
	FITNESS_LEVELS as fitnessLevels,
	emailRow as row,
	sanitize,
} from "@/lib/applications/shared";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CoursePayload = {
	title?: string;
	duration?: string;
	venue?: string;
	cost?: string;
};

type ApplicationPayload = {
	fullName?: string;
	dob?: string;
	email?: string;
	phone?: string;
	nationality?: string;
	weight?: string;
	batch?: string;
	education?: string;
	fitnessLevel?: string;
	sportsHistory?: string;
	coordinationActivities?: string;
	fearHandling?: string;
	motivation?: string;
};

type RequestBody = {
	course?: CoursePayload;
	application?: ApplicationPayload;
};

export async function POST(request: Request) {
	let body: RequestBody;
	try {
		body = (await request.json()) as RequestBody;
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Invalid JSON payload" },
			{ status: 400 },
		);
	}

	const course = {
		title: sanitize(body.course?.title, 200),
		duration: sanitize(body.course?.duration, 100),
		venue: sanitize(body.course?.venue, 200),
		cost: sanitize(body.course?.cost, 100),
	};

	const app = {
		fullName: sanitize(body.application?.fullName, 200),
		dob: sanitize(body.application?.dob, 50),
		email: sanitize(body.application?.email, 200),
		phone: sanitize(body.application?.phone, 50),
		nationality: sanitize(body.application?.nationality, 100),
		weight: sanitize(body.application?.weight, 20),
		batch: sanitize(body.application?.batch, 200),
		education: sanitize(body.application?.education, 300),
		fitnessLevel: sanitize(body.application?.fitnessLevel, 100),
		sportsHistory: sanitize(body.application?.sportsHistory),
		coordinationActivities: sanitize(body.application?.coordinationActivities),
		fearHandling: sanitize(body.application?.fearHandling, 300),
		motivation: sanitize(body.application?.motivation),
	};

	if (!course.title) {
		return NextResponse.json(
			{ ok: false, error: "Course details are missing." },
			{ status: 400 },
		);
	}

	const fearHandlingOptions = [
		"I stay calm under pressure",
		"I manage fear well after some time",
		"I'm cautious but willing to push through",
		"I struggle with fear — looking to improve",
	] as const;

	if (
		!app.fullName ||
		app.fullName.length < 2 ||
		!app.dob ||
		!app.email ||
		!app.phone ||
		!app.nationality ||
		app.nationality.length < 2 ||
		!app.weight ||
		!app.batch ||
		!app.education ||
		app.education.length < 2 ||
		!app.fitnessLevel ||
		!app.fearHandling ||
		!app.motivation ||
		!app.sportsHistory ||
		!app.coordinationActivities
	) {
		return NextResponse.json(
			{ ok: false, error: "Please fill in all required fields correctly." },
			{ status: 400 },
		);
	}

	if (!fitnessLevels.includes(app.fitnessLevel as (typeof fitnessLevels)[number])) {
		return NextResponse.json(
			{ ok: false, error: "Invalid fitness level." },
			{ status: 400 },
		);
	}

	if (!fearHandlingOptions.includes(app.fearHandling as (typeof fearHandlingOptions)[number])) {
		return NextResponse.json(
			{ ok: false, error: "Invalid fear handling response." },
			{ status: 400 },
		);
	}

	const age = ageInYears(app.dob);
	if (age === null) {
		return NextResponse.json(
			{ ok: false, error: "Please provide a valid date of birth." },
			{ status: 400 },
		);
	}
	if (age < 10 || age > 100) {
		return NextResponse.json(
			{ ok: false, error: "Date of birth is not valid for application." },
			{ status: 400 },
		);
	}

	const digits = countPhoneDigits(app.phone);
	if (digits < 8 || digits > 15) {
		return NextResponse.json(
			{ ok: false, error: "Please provide a valid phone number." },
			{ status: 400 },
		);
	}

	const weightNum = Number.parseFloat(app.weight.replace(",", "."));
	if (Number.isNaN(weightNum) || weightNum < 25 || weightNum > 250) {
		return NextResponse.json(
			{ ok: false, error: "Please provide a valid weight between 25 and 250 kg." },
			{ status: 400 },
		);
	}

	if (app.sportsHistory.length < 4 || app.coordinationActivities.length < 4) {
		return NextResponse.json(
			{ ok: false, error: "Please provide at least 4 characters in each text response where required." },
			{ status: 400 },
		);
	}

	if (app.motivation.length < 15) {
		return NextResponse.json(
			{ ok: false, error: "Please write at least 15 characters for your motivation." },
			{ status: 400 },
		);
	}

	if (!EMAIL_REGEX.test(app.email)) {
		return NextResponse.json(
			{ ok: false, error: "Please provide a valid email address." },
			{ status: 400 },
		);
	}

	const subject = `Course Application — ${course.title} — ${app.fullName}`;

	const textLines = [
		`Course: ${course.title}`,
		`Duration: ${course.duration || "—"}`,
		`Venue: ${course.venue || "—"}`,
		`Cost: ${course.cost || "—"}`,
		"",
		"— Applicant Details —",
		`Full Name: ${app.fullName}`,
		`Date of Birth: ${app.dob}`,
		`Email: ${app.email}`,
		`Phone: ${app.phone}`,
		`Nationality: ${app.nationality}`,
		`Weight (kg): ${app.weight}`,
		`Batch Applying For: ${app.batch}`,
		`Education: ${app.education}`,
		`Fitness Level: ${app.fitnessLevel}`,
		"",
		"Sports / Adventure Sports History:",
		app.sportsHistory || "—",
		"",
		"Coordination Activities (Dance / Yoga / Pilates / etc.):",
		app.coordinationActivities || "—",
		"",
		"How They Handle Fear:",
		app.fearHandling,
		"",
		"Motivation for Paragliding:",
		app.motivation,
	];
	const text = textLines.join("\n");

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 640px;">
			<h2 style="color: #0D5C8F; margin-bottom: 8px;">New course application</h2>
			<p style="color: #5A6370; margin-top: 0;">Submitted via the PG Gurukul website course application form.</p>

			<h3 style="color: #1A1D21; margin-top: 24px; margin-bottom: 8px;">Course</h3>
			<table style="border-collapse: collapse; width: 100%;">
				${row("Course", course.title)}
				${row("Duration", course.duration)}
				${row("Venue", course.venue)}
				${row("Cost", course.cost)}
			</table>

			<h3 style="color: #1A1D21; margin-top: 24px; margin-bottom: 8px;">Applicant</h3>
			<table style="border-collapse: collapse; width: 100%;">
				${row("Full Name", app.fullName)}
				${row("Date of Birth", app.dob)}
				${row("Email", app.email)}
				${row("Phone", app.phone)}
				${row("Nationality", app.nationality)}
				${row("Weight (kg)", app.weight)}
				${row("Batch Applying For", app.batch)}
				${row("Education", app.education)}
				${row("Fitness Level", app.fitnessLevel)}
			</table>

			<h3 style="color: #1A1D21; margin-top: 24px; margin-bottom: 8px;">Responses</h3>
			<table style="border-collapse: collapse; width: 100%;">
				${row("Sports / Adventure Sports History", app.sportsHistory)}
				${row("Coordination Activities", app.coordinationActivities)}
				${row("How They Handle Fear", app.fearHandling)}
				${row("Motivation for Paragliding", app.motivation)}
			</table>
		</div>
	`;

	try {
		await sendMail({ subject, text, html, replyTo: app.email });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[api/apply-course] Failed to send email:", error);
		const configError =
			error instanceof Error && error.message.startsWith("Missing required");
		return NextResponse.json(
			{
				ok: false,
				error: configError
					? "Email service is not configured. Please contact the administrator."
					: "Failed to submit your application. Please try again later.",
			},
			{ status: 500 },
		);
	}
}
