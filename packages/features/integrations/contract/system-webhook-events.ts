/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
