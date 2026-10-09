/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { NotificationDto } from './notification.schema.js';
import type { MiNotification, MiGroupedNotification } from './models/Notification.js';
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
