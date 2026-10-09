/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type LocaleParameterNames<T extends string> = string extends T ? string :
	T extends `${string}{${infer Name}}${infer Rest}` ? Name | LocaleParameterNames<Rest> : never;

/** Interpolate raw locale strings using the existing tsx parameter semantics. */
export function interpolateLocaleParameters<T extends string>(message: T, values: Readonly<Record<LocaleParameterNames<NoInfer<T>>, string | number>>): string {
	let cursor = 0;
	let result = '';
	for (;;) {
		const start = message.indexOf('{', cursor);
		if (start === -1) return result + message.slice(cursor);
		const end = message.indexOf('}', start);
		// Migration audits reject malformed messages; never reproduce a legacy hang.
		if (end === -1) throw new Error('Unclosed locale parameter');
		result += message.slice(cursor, start);
		result += values[message.slice(start + 1, end) as LocaleParameterNames<T>] + '';
		cursor = end + 1;
	}
}
