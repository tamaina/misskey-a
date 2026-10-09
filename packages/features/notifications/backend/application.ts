/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiToken } from '../../api/backend/transport/context.js';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import type { NotificationsOperations } from './operations.js';
import type { NotificationDto } from './notification.schema.js';
import { notificationTypes } from './notification-types.schema.js';
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
export interface NotificationsApplicationDependencies extends NotificationsCommandDependencies {
	generateId(timestamp?: number): string;
	getNotifications(userId: string, options: {
		sinceId?: string; untilId?: string; limit: number;
		includeTypes?: MiNotification['type'][]; excludeTypes?: MiNotification['type'][];
	}): Promise<MiNotification[]>;
	packMany(records: MiNotification[], userId: string): Promise<NotificationDto[]>;
	packGroupedMany(records: MiGroupedNotification[], userId: string): Promise<NotificationDto[]>;
	swPublicKey: string | null;
	isValidEndpoint(endpoint: string): boolean;
	findSubscription(query: SubscriptionQuery): Promise<SubscriptionRecord | null>;
	findSubscriptions(query: SubscriptionQuery): Promise<SubscriptionRecord[]>;
	insertSubscription(record: SubscriptionRecord): Promise<void>;
	updateSubscription(id: string, update: { sendReadMessage: boolean }): Promise<void>;
	deleteSubscriptions(ids: string[]): Promise<void>;
	refreshSubscriptionCache(userId: string): void;
}

type ListInput<Actor extends ApiActor> = Parameters<NotificationsOperations<Actor>['list']>[0];
type AcceptedNotificationType = NonNullable<ListInput<ApiActor>['includeTypes']>[number];

function isActiveType(type: AcceptedNotificationType): type is MiNotification['type'] {
	return notificationTypes.some(active => active === type);
}

/** Typed application operations; the host supplies repositories, serializers, and event services. */
export class NotificationsApplicationService<Actor extends ApiActor> implements NotificationsOperations<Actor> {
	constructor(private readonly deps: NotificationsApplicationDependencies) {}

	private async read(input: ListInput<Actor>, actor: Actor): Promise<MiNotification[] | null> {
		const untilId = input.untilId ?? (input.untilDate ? this.deps.generateId(input.untilDate) : undefined);
		const sinceId = input.sinceId ?? (input.sinceDate ? this.deps.generateId(input.sinceDate) : undefined);
		if (input.includeTypes?.length === 0) return null;
		if (notificationTypes.every(type => input.excludeTypes?.includes(type))) return null;
		return this.deps.getNotifications(actor.id, {
			sinceId, untilId, limit: input.limit,
			includeTypes: input.includeTypes?.filter(isActiveType),
			excludeTypes: input.excludeTypes?.filter(isActiveType),
		});
	}

	async list(input: ListInput<Actor>, actor: Actor): Promise<NotificationDto[]> {
		const records = await this.read(input, actor);
		if (records === null) return [];
		if (input.markAsRead) void this.deps.readAllNotification(actor.id);
		return this.deps.packMany(records, actor.id);
	}

	async grouped(input: ListInput<Actor>, actor: Actor): Promise<NotificationDto[]> {
		const records = await this.read(input, actor);
		if (records === null || records.length === 0) return [];
		if (input.markAsRead) void this.deps.readAllNotification(actor.id);
		const grouped: MiGroupedNotification[] = [];
		for (const [index, record] of records.entries()) {
			const previous = grouped.at(-1);
			if (record.type === 'reaction' && previous && (previous.type === 'reaction' || previous.type === 'reaction:grouped') && previous.noteId === record.noteId) {
				if (previous.type === 'reaction:grouped') {
					previous.reactions.push({ userId: record.notifierId, reaction: record.reaction });
					previous.id = record.id;
				} else {
					grouped[grouped.length - 1] = { type: 'reaction:grouped', id: record.id,
						createdAt: previous.createdAt, noteId: previous.noteId,
						reactions: [{ userId: previous.notifierId, reaction: previous.reaction }, { userId: record.notifierId, reaction: record.reaction }] };
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
					grouped[grouped.length - 1] = { type: 'renote:grouped', id: record.id,
						createdAt: record.createdAt, noteId: previous.noteId, userIds: [previous.notifierId, record.notifierId] };
				}
				continue;
			}
			grouped.push(record);
		}
		return this.deps.packGroupedMany(grouped.slice(0, input.limit), actor.id);
	}

	async create(input: Parameters<NotificationsOperations<Actor>['create']>[0], actor: Actor, token: ApiToken | null): Promise<void> {
		this.deps.createAppNotification(actor.id, {
			appAccessTokenId: token?.id ?? null, customBody: input.body,
			customHeader: input.header ?? token?.name ?? null,
			customIcon: input.icon ?? token?.iconUrl ?? null,
		});
	}
	async flush(_input: Parameters<NotificationsOperations<Actor>['flush']>[0], actor: Actor): Promise<void> {
		void this.deps.flushAllNotifications(actor.id);
	}
	async markAllAsRead(_input: Parameters<NotificationsOperations<Actor>['markAllAsRead']>[0], actor: Actor): Promise<void> {
		void this.deps.readAllNotification(actor.id, true);
	}
	async testNotification(_input: Parameters<NotificationsOperations<Actor>['testNotification']>[0], actor: Actor): Promise<void> {
		this.deps.createTestNotification(actor.id);
	}
	async register(input: Parameters<NotificationsOperations<Actor>['register']>[0], actor: Actor) {
		if (!this.deps.isValidEndpoint(input.endpoint)) throw apiError({ code: 'INVALID_ENDPOINT', message: 'Invalid push endpoint.', id: '4432adbe-17c0-4f9f-b43c-9ceb2f8910fe' });
		const existing = await this.deps.findSubscription({ userId: actor.id, endpoint: input.endpoint, auth: input.auth, publickey: input.publickey });
		if (existing) return { state: 'already-subscribed' as const, key: this.deps.swPublicKey, userId: actor.id, endpoint: existing.endpoint, sendReadMessage: existing.sendReadMessage };
		await this.deps.insertSubscription({ id: this.deps.generateId(), userId: actor.id, ...input });
		this.deps.refreshSubscriptionCache(actor.id);
		return { state: 'subscribed' as const, key: this.deps.swPublicKey, userId: actor.id, endpoint: input.endpoint, sendReadMessage: input.sendReadMessage };
	}
	async showRegistration(input: Parameters<NotificationsOperations<Actor>['showRegistration']>[0], actor: Actor) {
		const record = await this.deps.findSubscription({ userId: actor.id, endpoint: input.endpoint });
		return record ? { userId: record.userId, endpoint: record.endpoint, sendReadMessage: record.sendReadMessage } : null;
	}
	async unregister(input: Parameters<NotificationsOperations<Actor>['unregister']>[0], actor: Actor | null): Promise<void> {
		const records = await this.deps.findSubscriptions({ ...(actor ? { userId: actor.id } : {}), ...input });
		if (records.length === 0) return;
		await this.deps.deleteSubscriptions(records.map(record => record.id));
		for (const userId of new Set(records.map(record => record.userId))) this.deps.refreshSubscriptionCache(userId);
	}
	async updateRegistration(input: Parameters<NotificationsOperations<Actor>['updateRegistration']>[0], actor: Actor) {
		const record = await this.deps.findSubscription({ userId: actor.id, endpoint: input.endpoint });
		if (record === null) throw apiError({ code: 'NO_SUCH_REGISTRATION', message: 'No such registration.', id: ' b09d8066-8064-5613-efb6-0e963b21d012' });
		if (input.sendReadMessage !== undefined) record.sendReadMessage = input.sendReadMessage;
		await this.deps.updateSubscription(record.id, { sendReadMessage: record.sendReadMessage });
		this.deps.refreshSubscriptionCache(actor.id);
		return { userId: record.userId, endpoint: record.endpoint, sendReadMessage: record.sendReadMessage };
	}
}

export function createNotificationsOperations<Actor extends ApiActor>(deps: NotificationsApplicationDependencies): NotificationsOperations<Actor> {
	return new NotificationsApplicationService<Actor>(deps);
}
