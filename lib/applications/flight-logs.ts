/**
 * Server-only checks for uploaded flight logs. The browser and the route both
 * check extension and size (see `./siv`); this looks inside the file so a
 * renamed file of another type is rejected before it is emailed.
 */

import type { FlightLogExtension } from "./siv";

const SNIFF_BYTES = 8192;

function hasUtf16Bom(buf: Buffer): boolean {
	return (
		buf.length >= 2 &&
		((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff))
	);
}

/** Text files don't contain NUL bytes; binaries almost always do near the start. */
function looksLikeText(buf: Buffer): boolean {
	return !buf.subarray(0, SNIFF_BYTES).includes(0);
}

function headText(buf: Buffer): string {
	return buf.subarray(0, SNIFF_BYTES).toString("utf8").replace(/^﻿/, "");
}

export function matchesFlightLogType(buf: Buffer, ext: FlightLogExtension): boolean {
	switch (ext) {
		case "kmz":
			// KMZ is a zip archive.
			return (
				buf.length >= 4 &&
				buf[0] === 0x50 &&
				buf[1] === 0x4b &&
				buf[2] === 0x03 &&
				buf[3] === 0x04
			);
		case "igc":
			// The IGC format always starts with the "A" (manufacturer) record.
			return looksLikeText(buf) && /^\s*A/.test(headText(buf));
		case "gpx":
			return looksLikeText(buf) && /<(?:\w+:)?gpx[\s>]/i.test(headText(buf));
		case "kml":
			return looksLikeText(buf) && /<(?:\w+:)?kml[\s>]/i.test(headText(buf));
		case "csv":
			return hasUtf16Bom(buf) || looksLikeText(buf);
	}
}

/** Strips paths and unusual characters from an uploaded name before attaching it. */
export function safeAttachmentName(fileName: string, ext: FlightLogExtension): string {
	const base = fileName.split(/[\\/]/).pop() ?? "";
	const stem = base.slice(0, Math.max(0, base.length - ext.length - 1));
	const cleaned = stem
		.replace(/[^A-Za-z0-9._ ()-]+/g, "_")
		.replace(/_+/g, "_")
		.trim()
		.slice(0, 80);
	return `${cleaned || "flight-log"}.${ext}`;
}
