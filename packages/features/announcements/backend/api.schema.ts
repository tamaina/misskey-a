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

const icon = v.picklist(['info', 'warning', 'error', 'success']);
const display = v.picklist(['normal', 'banner', 'dialog']);
export const announcementOutput = v.strictObject({
	id: v.string(), createdAt: date, updatedAt: v.nullable(date),
	title: v.string(), text: v.string(), imageUrl: v.nullable(v.string()), icon, display,
	needConfirmationToRead: v.boolean(), silence: v.boolean(), forYou: v.boolean(),
	isRead: v.optional(v.boolean()),
});
export const announcementCreateInput = objectInput({
	title: nonempty, text: nonempty, imageUrl: v.nullable(v.string()),
	icon: v.optional(icon, 'info'), display: v.optional(display, 'normal'),
	forExistingUsers: v.optional(v.boolean(), false), silence: v.optional(v.boolean(), false),
	needConfirmationToRead: v.optional(v.boolean(), false), userId: v.optional(v.nullable(id), null),
});
export const announcementUpdateInput = objectInput({
	id, title: v.exactOptional(nonempty), text: v.exactOptional(nonempty),
	imageUrl: v.exactOptional(v.nullable(v.string())), icon: v.exactOptional(icon), display: v.exactOptional(display),
	forExistingUsers: v.exactOptional(v.boolean()), silence: v.exactOptional(v.boolean()),
	needConfirmationToRead: v.exactOptional(v.boolean()), isActive: v.exactOptional(v.boolean()),
});
export const announcementDeleteInput = objectInput({ id });
export const announcementReadInput = objectInput({ announcementId: id });
export const announcementListInput = objectInput({ ...pagination, isActive: v.optional(v.boolean(), true) });
export const announcementAdminListInput = objectInput({
	...pagination, userId: v.exactOptional(v.nullable(id)), status: v.optional(v.picklist(['all', 'active', 'archived']), 'active'),
});
export const announcementAdminOutput = v.strictObject({
	id: v.string(), createdAt: date, updatedAt: v.nullable(date), title: v.string(), text: v.string(),
	imageUrl: v.nullable(v.string()), icon, display, isActive: v.boolean(), forExistingUsers: v.boolean(),
	silence: v.boolean(), needConfirmationToRead: v.boolean(), userId: v.nullable(v.string()), reads: v.number(),
});
