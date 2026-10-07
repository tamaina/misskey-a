/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const schemas = new WeakSet<object>();
const tuples = new WeakSet<object>();

/** Exactly the historical array-first, disjoint plain-string alternatives. */
export function muteWordInputItem() {
	const item = Object.freeze(v.string());
	const array = Object.freeze(v.array(item));
	const options = Object.freeze([array, item] as const);
	tuples.add(options);
	const schema = Object.freeze(v.union(options));
	schemas.add(schema);
	return schema;
}
export function isMuteWordInputItem(value: object): boolean { return schemas.has(value); }
export function hasMuteWordInputItemOptions(value: object): boolean {
	return 'type' in value && value.type === 'union' && 'options' in value
		&& value.options !== null && typeof value.options === 'object' && tuples.has(value.options);
}
