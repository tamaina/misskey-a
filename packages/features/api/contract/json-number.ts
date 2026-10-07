/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

/** Match JSON Schema/AJV number validation, including exponent overflow from JSON.parse. */
export const jsonNumber = Object.freeze(v.custom<number>(
	value => typeof value === 'number' && Number.isFinite(value),
	'Expected a finite JSON number',
));
