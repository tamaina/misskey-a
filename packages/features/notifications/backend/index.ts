/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import { notificationsContract, notificationsInputs } from '../contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';

export interface NotificationsActor {
	id: string;
}

export interface NotificationsToken {
	id: string;
	name: string | null;
	iconUrl: string | null;
}

export interface NotificationsContext {
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
	createAppNotification(userId: string, data: AppNotificationData): unknown;
	createTestNotification(userId: string): unknown;
	flushAllNotifications(userId: string): unknown;
	readAllNotification(userId: string, markRead: true): unknown;
}

function requireActor(context: NotificationsContext | null | undefined): NotificationsActor {
	if (context?.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted notifications actor is required');
	}

	return { id: context.actor.id };
}

/** Create notification commands using only the actor and token provided by trusted transport context. */
export function createNotifications(deps: NotificationsDependencies) {
	const clientContext = (context: NotificationsContext) => context;

	return {
		'notifications/create': createProcedureClient(implement(notificationsContract['notifications/create'])
			.$context<NotificationsContext>()
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
		'notifications/flush': createProcedureClient(implement(notificationsContract['notifications/flush'])
			.$context<NotificationsContext>()
			.handler(({ context }) => {
				const actor = requireActor(context);
				deps.flushAllNotifications(actor.id);
			}), { context: clientContext }),
		'notifications/mark-all-as-read': createProcedureClient(implement(notificationsContract['notifications/mark-all-as-read'])
			.$context<NotificationsContext>()
			.handler(({ context }) => {
				const actor = requireActor(context);
				deps.readAllNotification(actor.id, true);
			}), { context: clientContext }),
		'notifications/test-notification': createProcedureClient(implement(notificationsContract['notifications/test-notification'])
			.$context<NotificationsContext>()
			.handler(({ context }) => {
				const actor = requireActor(context);
				deps.createTestNotification(actor.id);
			}), { context: clientContext }),
	};
}

export type NotificationsFeature = ReturnType<typeof createNotifications>;

export const legacyNotificationsSchemas: Record<keyof typeof notificationsInputs, { input: JsonSchema }> = {
	'notifications/create': { input: toLegacyJsonSchema(notificationsInputs['notifications/create'], { target: 'openapi-3.0' }) },
	'notifications/flush': { input: toLegacyJsonSchema(notificationsInputs['notifications/flush'], { target: 'openapi-3.0' }) },
	'notifications/mark-all-as-read': { input: toLegacyJsonSchema(notificationsInputs['notifications/mark-all-as-read'], { target: 'openapi-3.0' }) },
	'notifications/test-notification': { input: toLegacyJsonSchema(notificationsInputs['notifications/test-notification'], { target: 'openapi-3.0' }) },
};
