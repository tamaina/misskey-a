/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationTypes } from '../../notifications/backend/notification-types.schema.js';

export const systemWebhookEventTypes = [
	// ユーザからの通報を受けたとき
	'abuseReport',
	// 通報を処理したとき
	'abuseReportResolved',
	// ユーザが作成された時
	'userCreated',
	// モデレータが一定期間不在である警告
	'inactiveModeratorsWarning',
	// モデレータが一定期間不在のためシステムにより招待制へと変更された
	'inactiveModeratorsInvitationOnlyChanged',
] as const;
export type SystemWebhookEventType = typeof systemWebhookEventTypes[number];

export const notificationEventName = <T extends typeof notificationTypes[number]>(type: T) =>
	(type === 'note' ? 'subscribedNote' : type === 'follow' ? 'followed' : type) as T extends 'note' ? 'subscribedNote' : T extends 'follow' ? 'followed' : T;

export const notificationEventTypes = notificationTypes.map(type => notificationEventName(type));

export const webhookEventTypes = ['unfollow', 'follow', 'note', ...notificationEventTypes, 'chatMessage'] as const;
export type WebhookEventTypes = typeof webhookEventTypes[number];
