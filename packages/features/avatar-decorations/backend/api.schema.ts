/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';

const id = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
const nonempty = v.pipe(v.string(), v.minLength(1));
const date = v.pipe(v.string(), v.metadata({ format: 'date-time' }));
const pagination = {
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	sinceId: v.exactOptional(id), untilId: v.exactOptional(id),
	sinceDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	untilDate: v.exactOptional(v.pipe(v.number(), v.integer())),
};

export const avatarDecorationCreateInput = objectInput({
	name: nonempty, description: v.string(), url: nonempty,
	roleIdsThatCanBeUsedThisDecoration: v.exactOptional(v.array(v.string())),
	category: v.exactOptional(v.nullable(v.string())),
});
export const avatarDecorationUpdateInput = objectInput({
	id, name: v.exactOptional(nonempty), description: v.exactOptional(v.string()), url: v.exactOptional(nonempty),
	roleIdsThatCanBeUsedThisDecoration: v.exactOptional(v.array(v.string())),
	category: v.exactOptional(v.nullable(v.string())),
});
export const avatarDecorationDeleteInput = objectInput({ id });
export const avatarDecorationListInput = objectInput({ ...pagination, userId: v.exactOptional(v.nullable(id)) });
export const avatarDecorationsInput = v.optional(objectInput({}), {});
const decorationFields = {
	id: v.string(), name: v.string(), description: v.string(), url: v.string(),
	roleIdsThatCanBeUsedThisDecoration: v.array(v.string()),
};
export const avatarDecorationOutput = v.strictObject({
	...decorationFields, createdAt: date, updatedAt: v.nullable(date), category: v.nullable(v.string()),
});
export const avatarDecorationListOutput = v.array(v.strictObject({
	...decorationFields, createdAt: date, updatedAt: v.nullable(date), category: v.exactOptional(v.nullable(v.string())),
}));
export const avatarDecorationsOutput = v.array(v.strictObject({
	...decorationFields, category: v.exactOptional(v.nullable(v.string())),
}));
