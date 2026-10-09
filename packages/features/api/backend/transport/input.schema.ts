/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const rawObjectInputGuard = v.pipe(
	v.unknown(),
	v.check(value => value !== null && typeof value === 'object' && !Array.isArray(value)
		&& (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null), 'Expected an object'),
	v.transform(() => ({})),
);

/** Inspect the raw request in parallel with field validation, then project the finite fields. */
export function objectInput<const Entries extends v.ObjectEntries>(entries: Entries) {
	const fields = v.object(entries);
	const options: [typeof fields, typeof rawObjectInputGuard] = [fields, rawObjectInputGuard];
	return v.intersect(options);
}

/** Retain explicitly supported JSON extension fields that are persisted verbatim. */
export function objectInputWithRest<const Entries extends v.ObjectEntries, const Rest extends v.GenericSchema>(entries: Entries, rest: Rest) {
	const fields = v.objectWithRest(entries, rest);
	const options: [typeof fields, typeof rawObjectInputGuard] = [fields, rawObjectInputGuard];
	return v.intersect(options);
}
