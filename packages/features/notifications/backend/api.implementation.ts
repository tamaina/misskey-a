/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { NotificationDto } from './notification.schema.js';
import type { MiNotification, MiGroupedNotification } from './models/Notification.js';
import { implement } from '@orpc/server';
import { notificationsContract } from './endpoints/notifications.contract.js';
import { createListProcedure } from './endpoints/i/notifications.js';
import { createGroupedProcedure } from './endpoints/i/notifications-grouped.js';
import { createCreateProcedure } from './endpoints/notifications/create.js';
import { createFlushProcedure } from './endpoints/notifications/flush.js';
import { createMarkAllAsReadProcedure } from './endpoints/notifications/mark-all-as-read.js';
import { createTestNotificationProcedure } from './endpoints/notifications/test-notification.js';
import { createRegisterProcedure } from './endpoints/sw/register.js';
import { createShowRegistrationProcedure } from './endpoints/sw/show-registration.js';
import { createUnregisterProcedure } from './endpoints/sw/unregister.js';
import { createUpdateRegistrationProcedure } from './endpoints/sw/update-registration.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiMeta, SwSubscriptionsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { NotificationService } from './services/NotificationService.js';
import { PushNotificationService } from './services/PushNotificationService.js';
import { NotificationEntityService } from './serializers/NotificationEntityService.js';

export interface AppNotificationData {
	appAccessTokenId: string | null;
	customBody: string;
	customHeader: string | null;
	customIcon: string | null;
}

export interface NotificationsCommandDependencies {
	createAppNotification(userId: string, data: AppNotificationData): void;
	createTestNotification(userId: string): void;
	flushAllNotifications(userId: string): Promise<void>;
	readAllNotification(userId: string, force?: boolean): Promise<void>;
}

export interface SubscriptionRecord {
	id: string;
	userId: string;
	endpoint: string;
	auth: string;
	publickey: string;
	sendReadMessage: boolean;
}

export interface SubscriptionQuery {
	userId?: string;
	endpoint: string;
	auth?: string;
	publickey?: string;
}

export interface NotificationsDependencies extends NotificationsCommandDependencies {
	generateId(timestamp?: number): string;
	getNotifications(userId: string, options: {
		sinceId?: string; untilId?: string; limit: number;
		includeTypes?: MiNotification['type'][]; excludeTypes?: MiNotification['type'][];
	}): Promise<MiNotification[]>;
	packMany(records: MiNotification[], userId: string): Promise<NotificationDto[]>;
	packGroupedMany(records: MiGroupedNotification[], userId: string): Promise<NotificationDto[]>;
	getSwPublicKey(): string | null;
	isValidEndpoint(endpoint: string): boolean;
	findSubscription(query: SubscriptionQuery): Promise<SubscriptionRecord | null>;
	findSubscriptions(query: SubscriptionQuery): Promise<SubscriptionRecord[]>;
	insertSubscription(record: SubscriptionRecord): Promise<void>;
	updateSubscription(id: string, update: { sendReadMessage: boolean }): Promise<void>;
	deleteSubscriptions(ids: string[]): Promise<void>;
	refreshSubscriptionCache(userId: string): void;
}

export function createNotificationsRouter(deps: NotificationsDependencies) {
	return implement(notificationsContract).$context<ApiContext<MiLocalUser>>().router({
		list: createListProcedure(deps),
		grouped: createGroupedProcedure(deps),
		create: createCreateProcedure(deps),
		flush: createFlushProcedure(deps),
		markAllAsRead: createMarkAllAsReadProcedure(deps),
		testNotification: createTestNotificationProcedure(deps),
		register: createRegisterProcedure(deps),
		showRegistration: createShowRegistrationProcedure(deps),
		unregister: createUnregisterProcedure(deps),
		updateRegistration: createUpdateRegistrationProcedure(deps),
	});
}

type NotificationsRouter = ReturnType<typeof createNotificationsRouter>;

/** Resolve domain singletons after their initialization hooks, then cache the router. */
@Injectable()
export class NotificationsApiProvider {
	private router: NotificationsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): NotificationsRouter {
		if (this.router !== undefined) return this.router;
		const settings = this.moduleRef.get<MiMeta>(DI.meta, { strict: false });
		const subscriptions = this.moduleRef.get<SwSubscriptionsRepository>(DI.swSubscriptionsRepository, { strict: false });
		const ids = this.moduleRef.get(IdService, { strict: false });
		const notifications = this.moduleRef.get(NotificationService, { strict: false });
		const serializer = this.moduleRef.get(NotificationEntityService, { strict: false });
		const push = this.moduleRef.get(PushNotificationService, { strict: false });
		this.router = createNotificationsRouter({
			generateId: timestamp => ids.gen(timestamp),
			getNotifications: (userId, options) => notifications.getNotifications(userId, options),
			packMany: async (records, userId) => serializer.packMany(records, userId),
			packGroupedMany: async (records, userId) => serializer.packGroupedMany(records, userId),
			createAppNotification: (userId, data) => notifications.createNotification(userId, 'app', data),
			createTestNotification: userId => notifications.createNotification(userId, 'test', {}),
			flushAllNotifications: userId => notifications.flushAllNotifications(userId),
			readAllNotification: (userId, force) => notifications.readAllNotification(userId, force),
			getSwPublicKey: () => settings.swPublicKey,
			isValidEndpoint: endpoint => push.isValidEndpoint(endpoint),
			findSubscription: query => subscriptions.findOneBy(query),
			findSubscriptions: query => subscriptions.findBy(query),
			insertSubscription: async record => { await subscriptions.insert(record); },
			updateSubscription: async (id, update) => { await subscriptions.update(id, update); },
			deleteSubscriptions: async ids => { await subscriptions.delete({ id: In(ids) }); },
			refreshSubscriptionCache: userId => push.refreshCache(userId),
		});
		return this.router;
	}
}
