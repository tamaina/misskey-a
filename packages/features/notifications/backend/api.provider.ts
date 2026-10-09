/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { In } from 'typeorm';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import type { MiMeta, SwSubscriptionsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { NotificationService } from './services/NotificationService.js';
import { PushNotificationService } from './services/PushNotificationService.js';
import { NotificationEntityService } from './serializers/NotificationEntityService.js';
import { packedNotificationSchema } from './notification.schema.js';
import { createNotificationsRouter } from './router.js';
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
			packMany: async (records, userId) => v.parse(v.array(packedNotificationSchema), await serializer.packMany(records, userId)),
			packGroupedMany: async (records, userId) => v.parse(v.array(packedNotificationSchema), await serializer.packGroupedMany(records, userId)),
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
