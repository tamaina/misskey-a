/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export interface JsonStringOptions {
	minLength?: number;
	maxLength?: number;
	pattern?: string;
}

/** Preserve JSON wire string lengths as Unicode code points with native Valibot actions. */
export function jsonString(options: JsonStringOptions = {}): v.GenericSchema<string> {
	const { minLength, maxLength, pattern } = options;
	const minimum = minLength === undefined ? v.string() : v.pipe(v.string(), v.minCodePoints(minLength));
	const maximum = maxLength === undefined ? minimum : v.pipe(minimum, v.maxCodePoints(maxLength));
	return pattern === undefined ? maximum : v.pipe(maximum, v.regex(new RegExp(pattern, 'u')));
}
