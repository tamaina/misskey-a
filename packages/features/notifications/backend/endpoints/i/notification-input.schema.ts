/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { notificationTypes, obsoleteNotificationTypes } from '../../notification-types.schema.js';

const acceptedNotificationTypes = [...notificationTypes, ...obsoleteNotificationTypes] as const;
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
const notificationListObject = v.object({
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	sinceId: v.exactOptional(misskeyId),
	untilId: v.exactOptional(misskeyId),
	sinceDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	untilDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	markAsRead: v.optional(v.boolean(), true),
	includeTypes: v.exactOptional(v.array(v.picklist(acceptedNotificationTypes))),
	excludeTypes: v.exactOptional(v.array(v.picklist(acceptedNotificationTypes))),
});

export const notificationListInput = v.lazy(input => Array.isArray(input) ? v.never() : notificationListObject);
