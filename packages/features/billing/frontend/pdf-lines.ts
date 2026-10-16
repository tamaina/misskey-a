/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/** Bound printed lines before pagination so long Japanese fields cannot lose evidence. */
export function wrapPdfLines(lines: readonly string[]): string[] {
	return lines.flatMap(line => line.split(/\r?\n/).flatMap(part => {
		const points = Array.from(part), wrapped: string[] = [];
		if (!points.length) return [''];
		for (let index = 0; index < points.length; index += 36) wrapped.push(points.slice(index, index + 36).join(''));
		return wrapped;
	}));
}
