/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import { createContract } from './endpoints/notifications/create.contract.js';
import { flushContract } from './endpoints/notifications/flush.contract.js';
import { markAllAsReadContract } from './endpoints/notifications/mark-all-as-read.contract.js';
import { testNotificationContract } from './endpoints/notifications/test-notification.contract.js';

export interface NotificationsActor {
	id: string;
}

export interface NotificationsToken {
	id: string;
	name: string | null;
	iconUrl: string | null;
}

export interface NotificationsCommandContext {
	actor: NotificationsActor;
	token: NotificationsToken | null;
}

export interface AppNotificationData {
	appAccessTokenId: string | null;
	customBody: string;
	customHeader: string | null;
	customIcon: string | null;
}

export interface NotificationsDependencies {
	createAppNotification(userId: string, data: AppNotificationData): void;
	createTestNotification(userId: string): void;
	flushAllNotifications(userId: string): void | Promise<void>;
	readAllNotification(userId: string, markRead: true): void | Promise<void>;
}

function requireActor(context: NotificationsCommandContext | null | undefined): NotificationsActor {
	if (context?.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted notifications actor is required');
	}

	return { id: context.actor.id };
}

/** Create notification commands using only the actor and token provided by trusted transport context. */
export function createNotifications(deps: NotificationsDependencies) {
	const clientContext = (context: NotificationsCommandContext) => context;

	return {
		'notifications/create': createProcedureClient(implement(createContract)
			.$context<NotificationsCommandContext>()
			.handler(({ input, context }) => {
				const actor = requireActor(context);
				const token = context.token ?? null;
				deps.createAppNotification(actor.id, {
					appAccessTokenId: token?.id ?? null,
					customBody: input.body,
					customHeader: input.header ?? token?.name ?? null,
					customIcon: input.icon ?? token?.iconUrl ?? null,
				});
			}), { context: clientContext }),
		'notifications/flush': createProcedureClient(implement(flushContract)
			.$context<NotificationsCommandContext>()
			.handler(({ context }) => {
				const actor = requireActor(context);
				deps.flushAllNotifications(actor.id);
			}), { context: clientContext }),
		'notifications/mark-all-as-read': createProcedureClient(implement(markAllAsReadContract)
			.$context<NotificationsCommandContext>()
			.handler(({ context }) => {
				const actor = requireActor(context);
				deps.readAllNotification(actor.id, true);
			}), { context: clientContext }),
		'notifications/test-notification': createProcedureClient(implement(testNotificationContract)
			.$context<NotificationsCommandContext>()
			.handler(({ context }) => {
				const actor = requireActor(context);
				deps.createTestNotification(actor.id);
			}), { context: clientContext }),
	};
}

export type NotificationsFeature = ReturnType<typeof createNotifications>;

export { notificationsContract } from './endpoints/notifications.contract.js';
export { createNotificationsRouter } from './router.js';
export { createNotificationsOperations, NotificationsApplicationService } from './application.js';
export type { NotificationsApplicationDependencies, NotificationsCommandDependencies, SubscriptionRecord, SubscriptionQuery } from './application.js';
export type { NotificationsContext, NotificationsOperations } from './operations.js';
export { packedNotificationSchema } from './notification.schema.js';
export type { NotificationDto } from './notification.schema.js';
