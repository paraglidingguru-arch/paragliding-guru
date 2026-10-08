import coursesContent from "@/content/courses.json";

export type CourseSchedule = {
	note?: string;
	sessions?: string[];
};

export type Course = {
	title: string;
	primaryDescription: string;
	secondaryDescription: string;
	duration: string;
	venue: string;
	cost: string;
	level: "Beginner" | "Intermediate" | "Advanced";
	tag: string;
	featured?: boolean;
	image?: string;
	/** "siv" shows the SIV application form; anything else the standard form. */
	formType?: string;
	schedule?: CourseSchedule;
};

export const courses = coursesContent.items as Course[];

export function usesSivForm(course: Course): boolean {
	return course.formType === "siv";
}

export function findCourseByTitle(title: string): Course | undefined {
	return courses.find((course) => course.title.trim() === title.trim());
}

/** Batch choices offered on the SIV form; the API accepts only these values. */
export function batchOptions(course: Course): string[] {
	const sessions = [
		...new Set(
			(course.schedule?.sessions ?? [])
				.map((session) => session.trim())
				.filter(Boolean),
		),
	];
	return sessions.length > 0 ? [...sessions, "Not sure yet"] : ["Flexible / TBD"];
}
