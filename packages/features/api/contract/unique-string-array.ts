/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const uniqueStringArrayBases = new WeakMap<object, object>();

/** Reject repeated strings using exact, case-sensitive equality without rewriting items. */
export function uniqueStringArray<const Item extends v.GenericSchema<string, string>>(item: Item) {
	const array = Object.freeze(v.array(item));
	const unique = Object.freeze(v.check<v.InferOutput<typeof array>, string>(
		values => values.every(value => typeof value === 'string') && new Set(values).size === values.length,
		'Expected unique string items',
	));
	uniqueStringArrayBases.set(unique, array);
	return v.pipe(array, unique);
}

/** Identify only this helper's exact validation action and its original array schema. */
export function getUniqueStringArrayBaseSchema(action: object): object | undefined {
	return uniqueStringArrayBases.get(action);
}
