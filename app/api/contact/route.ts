import { NextResponse } from "next/server";
import { EMAIL_REGEX, escapeHtml, sanitize } from "@/lib/applications/shared";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactPayload = {
	name?: string;
	email?: string;
	phone?: string;
	course?: string;
	message?: string;
};

export async function POST(request: Request) {
	let body: ContactPayload;
	try {
		body = (await request.json()) as ContactPayload;
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Invalid JSON payload" },
			{ status: 400 },
		);
	}

	const name = sanitize(body.name, 200);
	const email = sanitize(body.email, 200);
	const phone = sanitize(body.phone, 50);
	const course = sanitize(body.course, 200);
	const message = sanitize(body.message);

	if (!name || !email || !message) {
		return NextResponse.json(
			{ ok: false, error: "Name, email, and message are required." },
			{ status: 400 },
		);
	}

	if (!EMAIL_REGEX.test(email)) {
		return NextResponse.json(
			{ ok: false, error: "Please provide a valid email address." },
			{ status: 400 },
		);
	}

	const subject = `New contact enquiry from ${name}`;
	const textLines = [
		`Name: ${name}`,
		`Email: ${email}`,
		`Phone: ${phone || "—"}`,
		`Interested Course: ${course || "—"}`,
		"",
		"Message:",
		message,
	];
	const text = textLines.join("\n");

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px;">
			<h2 style="color: #0D5C8F; margin-bottom: 8px;">New contact enquiry</h2>
			<p style="color: #5A6370; margin-top: 0;">Submitted via the PG Gurukul website contact form.</p>
			<table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
				<tr>
					<td style="padding: 8px 12px; font-weight: 600; background: #F8FAFC; width: 160px;">Name</td>
					<td style="padding: 8px 12px;">${escapeHtml(name)}</td>
				</tr>
				<tr>
					<td style="padding: 8px 12px; font-weight: 600; background: #F8FAFC;">Email</td>
					<td style="padding: 8px 12px;">${escapeHtml(email)}</td>
				</tr>
				<tr>
					<td style="padding: 8px 12px; font-weight: 600; background: #F8FAFC;">Phone</td>
					<td style="padding: 8px 12px;">${escapeHtml(phone || "—")}</td>
				</tr>
				<tr>
					<td style="padding: 8px 12px; font-weight: 600; background: #F8FAFC;">Interested Course</td>
					<td style="padding: 8px 12px;">${escapeHtml(course || "—")}</td>
				</tr>
			</table>
			<h3 style="color: #1A1D21; margin-top: 24px;">Message</h3>
			<p style="white-space: pre-wrap; color: #1A1D21; line-height: 1.6;">${escapeHtml(message)}</p>
		</div>
	`;

	try {
		await sendMail({ subject, text, html, replyTo: email });
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[api/contact] Failed to send email:", error);
		const configError =
			error instanceof Error && error.message.startsWith("Missing required");
		return NextResponse.json(
			{
				ok: false,
				error: configError
					? "Email service is not configured. Please contact the administrator."
					: "Failed to send your message. Please try again later.",
			},
			{ status: 500 },
		);
	}
}
