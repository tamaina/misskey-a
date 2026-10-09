/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferSchemaOutput } from '@orpc/contract';
import { notificationTypes } from './notification-types.schema.js';
import type { listContract } from './endpoints/i/notifications.contract.js';
import type { MiNotification } from './models/Notification.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from './api.dependencies.js';
type NotificationListInput = InferSchemaOutput<NonNullable<typeof listContract['~orpc']['inputSchema']>>;
type AcceptedNotificationType = NonNullable<NotificationListInput['includeTypes']>[number];
export type NotificationsReadDependencies = Pick<NotificationsDependencies, 'generateId' | 'getNotifications'>;

function isActiveType(type: AcceptedNotificationType): type is MiNotification['type'] {
	return notificationTypes.some(active => active === type);
}

export async function readNotifications(deps: NotificationsReadDependencies, input: NotificationListInput, actor: MiLocalUser): Promise<MiNotification[] | null> {
	const untilId = input.untilId ?? (input.untilDate ? deps.generateId(input.untilDate) : undefined);
	const sinceId = input.sinceId ?? (input.sinceDate ? deps.generateId(input.sinceDate) : undefined);
	if (input.includeTypes?.length === 0) return null;
	if (notificationTypes.every(type => input.excludeTypes?.includes(type))) return null;
	return deps.getNotifications(actor.id, {
		sinceId, untilId, limit: input.limit,
		includeTypes: input.includeTypes?.filter(isActiveType),
		excludeTypes: input.excludeTypes?.filter(isActiveType),
	});
}
