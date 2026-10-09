/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PackedJsonValue } from '../../../users/backend/json-value.schema.js';

export interface BirthdayDate { month: number; day: number }
export type BirthdaySelector = (BirthdayDate & { begin?: PackedJsonValue; end?: PackedJsonValue })
	| { begin: BirthdayDate; end: BirthdayDate; month?: PackedJsonValue; day?: PackedJsonValue };

/** Match legacy arithmetic for numeric inactive range fields; malformed objects still fail in the consumer. */
export function readBirthdayDate(input: unknown): { month: number; day: number } {
	if (input === null || typeof input !== 'object' || Array.isArray(input) || !('month' in input) || !('day' in input) || typeof input.month !== 'number' || typeof input.day !== 'number') {
		throw new TypeError('Birthday range must contain numeric month and day fields');
	}
	return { month: input.month, day: input.day };
}
