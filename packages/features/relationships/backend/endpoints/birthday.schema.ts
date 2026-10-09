/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { packedJsonValueSchema, type PackedJsonValue } from '../../../users/backend/json-value.schema.js';

const month = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(12));
const day = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(31));
const date = objectInput({ month, day });

function isDate(input: PackedJsonValue | undefined): boolean {
	return input !== null && typeof input === 'object' && !Array.isArray(input)
		&& typeof input.month === 'number' && Number.isInteger(input.month) && input.month >= 1 && input.month <= 12
		&& typeof input.day === 'number' && Number.isInteger(input.day) && input.day >= 1 && input.day <= 31;
}

// The two successful alternatives remain exclusive. Known inactive keys retain original JSON
// so the consumer's presence-based range selection has the same legacy behavior.
export interface BirthdayDate { month: number; day: number }
export type BirthdaySelector = (BirthdayDate & { begin?: PackedJsonValue; end?: PackedJsonValue })
	| { begin: BirthdayDate; end: BirthdayDate; month?: PackedJsonValue; day?: PackedJsonValue };
export const birthdaySelectorSchema: v.GenericSchema<BirthdaySelector> = v.union([
	v.pipe(objectInput({ month, day, begin: v.exactOptional(packedJsonValueSchema), end: v.exactOptional(packedJsonValueSchema) }),
		v.check(input => !(isDate(input.begin) && isDate(input.end)), 'Birthday must select exactly one date shape')),
	v.pipe(objectInput({ begin: date, end: date, month: v.exactOptional(packedJsonValueSchema), day: v.exactOptional(packedJsonValueSchema) }),
		v.check(input => !(typeof input.month === 'number' && Number.isInteger(input.month) && input.month >= 1 && input.month <= 12
			&& typeof input.day === 'number' && Number.isInteger(input.day) && input.day >= 1 && input.day <= 31), 'Birthday must select exactly one date shape')),
]);

/** Match legacy arithmetic for numeric inactive range fields; malformed objects still fail in the consumer. */
export function readBirthdayDate(input: unknown): { month: number; day: number } {
	if (input === null || typeof input !== 'object' || Array.isArray(input) || !('month' in input) || !('day' in input) || typeof input.month !== 'number' || typeof input.day !== 'number') {
		throw new TypeError('Birthday range must contain numeric month and day fields');
	}
	return { month: input.month, day: input.day };
}
