/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { groupedContract } from './notifications-grouped.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.dependencies.js';
import { readNotifications } from '@features/notifications/backend/notification-list.js';
import type { MiGroupedNotification } from '@features/notifications/backend/models/Notification.js';
export type GroupedDependencies = Pick<NotificationsDependencies, 'readAllNotification' | 'packGroupedMany' | 'generateId' | 'getNotifications'>;
export function createGroupedProcedure(deps: GroupedDependencies) {
	return implement(groupedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: groupedContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:notifications', limit: { duration: 30000, max: 30 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const records = await readNotifications(deps, input, actor);
			if (records === null || records.length === 0) return [];
			if (input.markAsRead) void deps.readAllNotification(actor.id);
			const grouped: MiGroupedNotification[] = [];
			for (const [index, record] of records.entries()) {
				const previous = grouped.at(-1);
				if (record.type === 'reaction' && previous && (previous.type === 'reaction' || previous.type === 'reaction:grouped') && previous.noteId === record.noteId) {
					if (previous.type === 'reaction:grouped') {
						previous.reactions.push({ userId: record.notifierId, reaction: record.reaction });
						previous.id = record.id;
					} else {
						grouped[grouped.length - 1] = {
							type: 'reaction:grouped', id: record.id,
							createdAt: previous.createdAt, noteId: previous.noteId,
							reactions: [{ userId: previous.notifierId, reaction: previous.reaction }, { userId: record.notifierId, reaction: record.reaction }]
						};
					}
					continue;
				}
				// The original comparison uses adjacent raw records' targetNoteId, not the grouped noteId.
				const previousRaw = records[index - 1];
				if (record.type === 'renote' && previousRaw?.type === 'renote' && previousRaw.targetNoteId === record.targetNoteId && previous) {
					if (previous.type === 'renote:grouped') {
						previous.userIds.push(record.notifierId);
						previous.id = record.id;
					} else if (previous.type === 'renote') {
						grouped[grouped.length - 1] = {
							type: 'renote:grouped', id: record.id,
							createdAt: record.createdAt, noteId: previous.noteId, userIds: [previous.notifierId, record.notifierId]
						};
					}
					continue;
				}
				grouped.push(record);
			}
			return deps.packGroupedMany(grouped.slice(0, input.limit), actor.id);
		});
}
