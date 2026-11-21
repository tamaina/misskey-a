/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * note - 通知オンにしているユーザーが投稿した
 * follow - フォローされた
 * mention - 投稿で自分が言及された
 * reply - 投稿に返信された
 * renote - 投稿がRenoteされた
 * quote - 投稿が引用Renoteされた
 * reaction - 投稿にリアクションされた
 * pollEnded - 自分のアンケートもしくは自分が投票したアンケートが終了した
 * scheduledNotePosted - 予約したノートが投稿された
 * scheduledNotePostFailed - 予約したノートの投稿に失敗した
 * receiveFollowRequest - フォローリクエストされた
 * followRequestAccepted - 自分の送ったフォローリクエストが承認された
 * roleAssigned - ロールが付与された
 * chatRoomInvitationReceived - チャットルームに招待された
 * achievementEarned - 実績を獲得
 * exportCompleted - エクスポートが完了
 * login - ログイン
 * createToken - トークン作成
 * app - アプリ通知
 * test - テスト通知（サーバー側）
 */
export const notificationTypes = [
	'note',
	'follow',
	'mention',
	'reply',
	'renote',
	'quote',
	'reaction',
	'pollEnded',
	'scheduledNotePosted',
	'scheduledNotePostFailed',
	'receiveFollowRequest',
	'followRequestAccepted',
	'roleAssigned',
	'chatRoomInvitationReceived',
	'achievementEarned',
	'exportCompleted',
	'login',
	'createToken',
	'app',
	'test',
] as const;
export const groupedNotificationTypes = [
	...notificationTypes,
	'reaction:grouped',
	'renote:grouped',
] as const;
export const obsoleteNotificationTypes = ['pollVote', 'groupInvited'] as const;
