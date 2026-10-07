/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';

// Closed required discriminator sets are disjoint. Ordinary union parsing is exclusive here.
const mode = Object.freeze(v.picklist(Object.freeze(['all', 'following', 'follower', 'mutualFollow', 'followingOrFollower', 'never'] as const)));
const list = Object.freeze(v.picklist(Object.freeze(['list'] as const)));
Object.freeze(misskeyId);
const modeField = v.pipe(mode, v.metadata({ nullable: false }));
const listField = v.pipe(list, v.metadata({ nullable: false }));

const modes = v.pipe(jsonObject({ type: modeField }), v.metadata({ nullable: false }));
const lists = v.pipe(jsonObject({ type: listField, userListId: misskeyId }), v.metadata({ nullable: false }));
for (const schema of [modeField, listField, modes, lists]) {
	for (const action of schema.pipe) {
		if ('metadata' in action) Object.freeze(action.metadata);
		Object.freeze(action);
	}
	Object.freeze(schema.pipe);
	Object.freeze(schema);
}
const options = Object.freeze([modes, lists] as const);
export const notificationReceiveRule = Object.freeze(v.union(options));

export function isNotificationReceiveRule(value: object): boolean { return value === notificationReceiveRule; }
export function hasNotificationReceiveRuleOptions(value: object): boolean {
	return 'type' in value && value.type === 'union' && 'options' in value && value.options === options;
}
