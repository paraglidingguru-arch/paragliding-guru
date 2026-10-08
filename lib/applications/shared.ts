/**
 * Helpers shared by the application/contact forms and their API routes.
 * Pure functions only — this module is imported by client components too.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_LENGTH = 5000;

export const FITNESS_LEVELS = ["Low", "Moderate", "Good", "Excellent"] as const;

export function sanitize(value: unknown, maxLength = MAX_LENGTH): string {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, maxLength);
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function countPhoneDigits(phone: string): number {
	return phone.replace(/\D/g, "").length;
}

/** Parses a `YYYY-MM-DD` date input value; null when it isn't a real date. */
export function parseIsoDate(iso: string): Date | null {
	if (!iso) return null;
	const d = new Date(`${iso}T12:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

/** True when a `YYYY-MM-DD` date is after today (local time). */
export function isFutureDate(iso: string): boolean {
	const d = parseIsoDate(iso);
	if (!d) return false;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const compare = new Date(d);
	compare.setHours(0, 0, 0, 0);
	return compare > today;
}

/** Age in whole years for a `YYYY-MM-DD` date of birth; null if invalid or in the future. */
export function ageInYears(dobIso: string): number | null {
	const d = parseIsoDate(dobIso);
	if (!d || isFutureDate(dobIso)) return null;
	const today = new Date();
	let age = today.getFullYear() - d.getFullYear();
	const monthDiff = today.getMonth() - d.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
		age--;
	}
	return age;
}

/** One label/value row of the HTML email tables. */
export function emailRow(label: string, value: string): string {
	const display = value || "—";
	return `
		<tr>
			<td style="padding: 8px 12px; font-weight: 600; background: #F8FAFC; width: 220px; vertical-align: top;">${escapeHtml(label)}</td>
			<td style="padding: 8px 12px; vertical-align: top; white-space: pre-wrap;">${escapeHtml(display)}</td>
		</tr>
	`;
}
