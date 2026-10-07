/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { misskeyId } from './index.js';

const ownedUnions = new WeakSet<object>();
const ownedOptions = new WeakSet<object>();

/** Own exactly the disjoint string-first identifier or identifier-array alternatives. */
export function misskeyIdOrIds() {
	Object.freeze(misskeyId);
	const array = Object.freeze(v.array(misskeyId));
	const options = Object.freeze([misskeyId, array] as const);
	ownedOptions.add(options);
	const schema = Object.freeze(v.union(options));
	ownedUnions.add(schema);
	return schema;
}

/** Recognize only the exact frozen union owned by misskeyIdOrIds. */
export function isMisskeyIdOrIds(schema: object): boolean {
	return ownedUnions.has(schema);
}

/** Copies retain ownership context for metadata checks but never inherit projection registration. */
export function hasMisskeyIdOrIdsOptions(schema: object): boolean {
	return 'type' in schema && schema.type === 'union' && 'options' in schema
		&& schema.options !== null && typeof schema.options === 'object' && ownedOptions.has(schema.options);
}
