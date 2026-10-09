/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AbuseReportNotificationRecipientEntityService } from './serializers/AbuseReportNotificationRecipientEntityService.js';
import type { AbuseUserReportEntityService } from './serializers/AbuseUserReportEntityService.js';
import type { ModerationLogEntityService } from './serializers/ModerationLogEntityService.js';
import { toPackedUserLite, toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import { toPackedJsonObject } from '@features/users/backend/json-value.schema.js';
import { toSystemWebhook } from '@features/integrations/backend/webhook.schema.js';

export function toRecipientWire(input: Awaited<ReturnType<AbuseReportNotificationRecipientEntityService['pack']>>) {
	return {
		id: input.id, isActive: input.isActive, updatedAt: input.updatedAt, name: input.name, method: input.method,
		...(input.userId === undefined ? {} : { userId: input.userId }),
		...(input.user === undefined ? {} : { user: toPackedUserLite(input.user) }),
		...(input.systemWebhookId === undefined ? {} : { systemWebhookId: input.systemWebhookId }),
		...(input.systemWebhook === undefined ? {} : { systemWebhook: toSystemWebhook(input.systemWebhook) }),
	};
}
export function toReportWire(input: Awaited<ReturnType<AbuseUserReportEntityService['pack']>>) {
	return {
		id: input.id, createdAt: input.createdAt, comment: input.comment, resolved: input.resolved,
		reporterId: input.reporterId, targetUserId: input.targetUserId, assigneeId: input.assigneeId,
		reporter: toPackedUserDetailed(input.reporter), targetUser: toPackedUserDetailed(input.targetUser),
		assignee: input.assignee === null ? null : toPackedUserDetailed(input.assignee),
		forwarded: input.forwarded, resolvedAs: input.resolvedAs, moderationNote: input.moderationNote,
	};
}
export function toModerationLogWire(input: Awaited<ReturnType<ModerationLogEntityService['pack']>>) {
	return { id: input.id, createdAt: input.createdAt, type: input.type, info: toPackedJsonObject(input.info), userId: input.userId, user: toPackedUserDetailed(input.user) };
}
