import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

let cachedTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

function readEnv(name: string): string {
	const value = process.env[name];
	if (!value || value.trim() === "") {
		throw new Error(
			`Missing required environment variable: ${name}. See ENV_SETUP.md.`,
		);
	}
	return value;
}

export function getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
	if (cachedTransporter) return cachedTransporter;

	const host = readEnv("SMTP_HOST");
	const port = Number(readEnv("SMTP_PORT"));
	const user = readEnv("SMTP_USER");
	const pass = readEnv("SMTP_PASSWORD");
	// SMTP_SECURE is optional — defaults to `port === 465`
	const secureEnv = process.env.SMTP_SECURE?.toLowerCase();
	const secure =
		secureEnv === "true" ? true : secureEnv === "false" ? false : port === 465;

	cachedTransporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});

	return cachedTransporter;
}

export type MailAttachment = {
	filename: string;
	content: Buffer;
};

export type SendMailInput = {
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
	attachments?: MailAttachment[];
};

export async function sendMail(input: SendMailInput): Promise<void> {
	const transporter = getTransporter();
	const from = readEnv("MAIL_FROM");
	const to = readEnv("MAIL_TO");

	await transporter.sendMail({
		from,
		to,
		subject: input.subject,
		text: input.text,
		html: input.html,
		replyTo: input.replyTo,
		attachments: input.attachments,
	});
}
