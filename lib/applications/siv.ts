/**
 * SIV course application: field rules shared by the browser form and the
 * `/api/apply-course/siv` route, so both always validate the same way.
 * Pure functions only — this module is imported by client components too.
 */

import {
	ageInYears,
	countPhoneDigits,
	EMAIL_REGEX,
	FITNESS_LEVELS,
	isFutureDate,
	parseIsoDate,
} from "./shared";

export const YES_NO = ["Yes", "No"] as const;

export const FLIGHT_LOG_EXTENSIONS = ["igc", "gpx", "kml", "kmz", "csv"] as const;
export type FlightLogExtension = (typeof FLIGHT_LOG_EXTENSIONS)[number];
export const FLIGHT_LOG_MAX_FILES = 3;
/** Kept under Vercel's 4.5 MB request-body limit for serverless functions. */
export const FLIGHT_LOG_MAX_TOTAL_BYTES = 4 * 1024 * 1024;

export type SivApplicationValues = {
	fullName: string;
	dob: string;
	guardianName: string;
	guardianPhone: string;
	guardianEmail: string;
	guardianConsent: boolean;
	email: string;
	phone: string;
	nationality: string;
	weight: string;
	batch: string;
	fitnessLevel: string;
	pilotRating: string;
	flyingHours: string;
	wing: string;
	harness: string;
	reserve: string;
	reserveRepackDate: string;
	sivBefore: string;
	sivBeforeDetails: string;
	hasInjury: string;
	injuryDetails: string;
};

export type SivTextField = Exclude<keyof SivApplicationValues, "guardianConsent">;

export type SivFieldErrors = Partial<Record<keyof SivApplicationValues, string>>;

/** Maximum stored length per text field (the server truncates to these). */
export const SIV_FIELD_LIMITS: Record<SivTextField, number> = {
	fullName: 200,
	dob: 20,
	guardianName: 200,
	guardianPhone: 50,
	guardianEmail: 200,
	email: 200,
	phone: 50,
	nationality: 100,
	weight: 20,
	batch: 200,
	fitnessLevel: 50,
	pilotRating: 200,
	flyingHours: 20,
	wing: 200,
	harness: 200,
	reserve: 200,
	reserveRepackDate: 20,
	sivBefore: 10,
	sivBeforeDetails: 500,
	hasInjury: 10,
	injuryDetails: 5000,
};

export const emptySivApplication: SivApplicationValues = {
	fullName: "",
	dob: "",
	guardianName: "",
	guardianPhone: "",
	guardianEmail: "",
	guardianConsent: false,
	email: "",
	phone: "",
	nationality: "",
	weight: "",
	batch: "",
	fitnessLevel: "",
	pilotRating: "",
	flyingHours: "",
	wing: "",
	harness: "",
	reserve: "",
	reserveRepackDate: "",
	sivBefore: "",
	sivBeforeDetails: "",
	hasInjury: "",
	injuryDetails: "",
};

/** Under 18 on today's date, worked out from the date of birth. */
export function isMinor(dob: string): boolean {
	const age = ageInYears(dob);
	return age !== null && age < 18;
}

/** Blanks answers to follow-up questions that aren't shown, so they're never sent or emailed. */
export function withoutHiddenAnswers(form: SivApplicationValues): SivApplicationValues {
	const minor = isMinor(form.dob);
	return {
		...form,
		guardianName: minor ? form.guardianName : "",
		guardianPhone: minor ? form.guardianPhone : "",
		guardianEmail: minor ? form.guardianEmail : "",
		guardianConsent: minor ? form.guardianConsent : false,
		sivBeforeDetails: form.sivBefore === "Yes" ? form.sivBeforeDetails : "",
		injuryDetails: form.hasInjury === "Yes" ? form.injuryDetails : "",
	};
}

function phoneError(phone: string, label: string): string | undefined {
	const digits = countPhoneDigits(phone);
	if (!phone.trim()) return `${label} is required.`;
	if (digits < 10) return "Enter a valid number with at least 10 digits.";
	if (digits > 15) return "Phone number has too many digits (max 15).";
	return undefined;
}

function emailError(email: string, label: string): string | undefined {
	const trimmed = email.trim();
	if (!trimmed) return `${label} is required.`;
	if (!EMAIL_REGEX.test(trimmed)) return "Please enter a valid email address.";
	return undefined;
}

function yesNoError(value: string): string | undefined {
	return (YES_NO as readonly string[]).includes(value)
		? undefined
		: "Please select Yes or No.";
}

/** Returns one message per invalid field, in form order. Empty object = valid. */
export function validateSivApplication(form: SivApplicationValues): SivFieldErrors {
	const errors: SivFieldErrors = {};
	const set = (key: keyof SivApplicationValues, message: string | undefined) => {
		if (message) errors[key] = message;
	};

	const fullName = form.fullName.trim();
	if (!fullName) set("fullName", "Full name is required.");
	else if (fullName.length < 2) set("fullName", "Please enter at least 2 characters.");

	if (!form.dob) {
		set("dob", "Date of birth is required.");
	} else if (!parseIsoDate(form.dob)) {
		set("dob", "Please enter a valid date.");
	} else if (isFutureDate(form.dob)) {
		set("dob", "Date of birth cannot be in the future.");
	} else {
		const age = ageInYears(form.dob) ?? 0;
		if (age < 10) set("dob", "Applicants must be at least 10 years old.");
		else if (age > 100) set("dob", "Please verify your date of birth.");
	}

	if (isMinor(form.dob)) {
		const guardianName = form.guardianName.trim();
		if (!guardianName) set("guardianName", "Parent / guardian name is required.");
		else if (guardianName.length < 2) {
			set("guardianName", "Please enter at least 2 characters.");
		}
		set("guardianPhone", phoneError(form.guardianPhone, "Parent / guardian phone number"));
		set("guardianEmail", emailError(form.guardianEmail, "Parent / guardian email"));
		if (!form.guardianConsent) {
			set("guardianConsent", "Please confirm the parent / legal guardian consents.");
		}
	}

	set("email", emailError(form.email, "Email"));
	set("phone", phoneError(form.phone, "Phone number"));

	const nationality = form.nationality.trim();
	if (!nationality) set("nationality", "Nationality is required.");
	else if (nationality.length < 2) set("nationality", "Please enter at least 2 characters.");

	const weightStr = form.weight.trim().replace(",", ".");
	if (!weightStr) {
		set("weight", "Weight is required.");
	} else {
		const w = Number.parseFloat(weightStr);
		if (Number.isNaN(w)) set("weight", "Please enter a valid weight in kg.");
		else if (w < 25 || w > 250) set("weight", "Enter a weight between 25 and 250 kg.");
	}

	if (!form.batch.trim()) {
		set("batch", "Please select which batch you are applying for.");
	}

	if (!form.fitnessLevel) {
		set("fitnessLevel", "Please select your fitness level.");
	} else if (!(FITNESS_LEVELS as readonly string[]).includes(form.fitnessLevel)) {
		set("fitnessLevel", "Please select a valid fitness level.");
	}

	if (!form.pilotRating.trim()) {
		set("pilotRating", "Pilot rating / licence is required.");
	}

	const hoursStr = form.flyingHours.trim().replace(",", ".");
	if (!hoursStr) {
		set("flyingHours", "Total flying hours is required.");
	} else {
		const hours = Number(hoursStr);
		if (Number.isNaN(hours) || hours < 0 || hours > 100000) {
			set("flyingHours", "Please enter a valid number of hours.");
		}
	}

	if (!form.wing.trim()) set("wing", "Wing make / model / size is required.");
	if (!form.harness.trim()) set("harness", "Harness make / model is required.");
	if (!form.reserve.trim()) set("reserve", "Reserve make / model is required.");

	if (!form.reserveRepackDate) {
		set("reserveRepackDate", "Last repack date is required.");
	} else if (!parseIsoDate(form.reserveRepackDate)) {
		set("reserveRepackDate", "Please enter a valid date.");
	} else if (isFutureDate(form.reserveRepackDate)) {
		set("reserveRepackDate", "The repack date can't be in the future.");
	}

	set("sivBefore", yesNoError(form.sivBefore));
	if (form.sivBefore === "Yes" && !form.sivBeforeDetails.trim()) {
		set("sivBeforeDetails", "Please tell us when and where.");
	}

	set("hasInjury", yesNoError(form.hasInjury));
	if (form.hasInjury === "Yes" && !form.injuryDetails.trim()) {
		set("injuryDetails", "Please explain so the instructor can plan for it.");
	}

	return errors;
}

export function fileExtension(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isFlightLogExtension(ext: string): ext is FlightLogExtension {
	return (FLIGHT_LOG_EXTENSIONS as readonly string[]).includes(ext);
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** Checks count, type and total size of the chosen flight logs (optional field). */
export function validateFlightLogs(
	files: readonly { name: string; size: number }[],
): string | null {
	if (files.length > FLIGHT_LOG_MAX_FILES) {
		return `You can upload up to ${FLIGHT_LOG_MAX_FILES} files.`;
	}
	for (const file of files) {
		if (!isFlightLogExtension(fileExtension(file.name))) {
			return `"${file.name}" isn't a supported file. Use IGC, GPX, KML, KMZ or CSV.`;
		}
		if (file.size === 0) {
			return `"${file.name}" is empty.`;
		}
	}
	const total = files.reduce((sum, file) => sum + file.size, 0);
	if (total > FLIGHT_LOG_MAX_TOTAL_BYTES) {
		return `Files add up to ${formatFileSize(total)}. The limit is ${formatFileSize(FLIGHT_LOG_MAX_TOTAL_BYTES)} in total.`;
	}
	return null;
}
