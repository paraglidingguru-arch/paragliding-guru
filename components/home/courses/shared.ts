import type { Course } from "@/lib/courses";
import { assets } from "../assets";

/** Falls back to the shared course visual when no image is set in the CMS. */
export function courseImageSrc(course: Course) {
	return course.image?.trim() || assets.gallery9.src;
}

export const levelColors = {
	Beginner: { bg: "#ceeedc", color: "#0a5b2f" },
	Intermediate: { bg: "#f5edd9", color: "#6e4f06" },
	Advanced: { bg: "#fee6e4", color: "#b3261e" },
};

/** Keeps the dropdown inside the Dialog so menu clicks aren’t swallowed by focus / scroll-lock. */
export const dialogSelectMenuProps = {
	disablePortal: true,
	disableScrollLock: true,
} as const;
