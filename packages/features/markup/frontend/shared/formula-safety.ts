/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Keep JUICE's conservative limits before KaTeX parses untrusted note content.
export const FORMULA_MAX_LENGTH = 1000;
export const FORMULA_MAX_NEST_DEPTH = 3;
export const FORMULA_MAX_HTML_LENGTH = 100_000;

export function isFormulaTooComplex(formula: string): boolean {
	if (formula.length > FORMULA_MAX_LENGTH) return true;
	let depth = 0;
	for (const char of formula) {
		if (char === '{' && ++depth > FORMULA_MAX_NEST_DEPTH) return true;
		if (char === '}') depth = Math.max(0, depth - 1);
	}
	return false;
}

/** Missing, malformed and old-server settings remain disabled. */
export function isLatexEnabled(clientOptions: unknown): boolean {
	return typeof clientOptions === 'object' && clientOptions !== null
		&& (clientOptions as Record<string, unknown>).latexEnabled === true
		&& Object.hasOwn(clientOptions, 'latexEnabled');
}
