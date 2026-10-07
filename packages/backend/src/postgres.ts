/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://github.com/typeorm/typeorm/issues/2400
import pg from 'pg';
import { DataSource, Logger, type QueryRunner } from 'typeorm';
import { entities as charts } from '@/core/chart/entities.js';
import { Config } from '@/config.js';
import MisskeyLogger from '@/logger.js';
import { bindThis } from '@/decorators.js';

import { MiAbuseUserReport } from '@features/moderation/backend/models/AbuseUserReport.js';
import { MiAbuseReportNotificationRecipient } from '@features/moderation/backend/models/AbuseReportNotificationRecipient.js';
import { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { MiAd } from '@features/instance/backend/models/Ad.js';
import { MiAnnouncement } from '@features/announcements/backend/models/Announcement.js';
import { MiAnnouncementRead } from '@features/announcements/backend/models/AnnouncementRead.js';
import { MiAntenna } from '@features/timelines/backend/models/Antenna.js';
import { MiApp } from '@features/auth/backend/models/App.js';
import { MiAvatarDecoration } from '@features/avatar-decorations/backend/models/AvatarDecoration.js';
import { MiAuthSession } from '@features/auth/backend/models/AuthSession.js';
import { MiBlocking } from '@features/relationships/backend/models/Blocking.js';
import { MiChannelFollowing } from '@features/channels/backend/models/ChannelFollowing.js';
import { MiChannelFavorite } from '@features/channels/backend/models/ChannelFavorite.js';
import { MiChannelMuting } from '@features/channels/backend/models/ChannelMuting.js';
import { MiClip } from '@features/collections/backend/models/Clip.js';
import { MiClipNote } from '@features/collections/backend/models/ClipNote.js';
import { MiClipFavorite } from '@features/collections/backend/models/ClipFavorite.js';
import { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import { MiDriveFolder } from '@features/drive/backend/models/DriveFolder.js';
import { MiEmoji } from '@features/emojis/backend/models/Emoji.js';
import { MiFollowing } from '@features/relationships/backend/models/Following.js';
import { MiFollowRequest } from '@features/relationships/backend/models/FollowRequest.js';
import { MiGalleryLike } from '@features/gallery/backend/models/GalleryLike.js';
import { MiGalleryPost } from '@features/gallery/backend/models/GalleryPost.js';
import { MiHashtag } from '@features/discovery/backend/models/Hashtag.js';
import { MiInstance } from '@features/federation/backend/models/Instance.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import { MiModerationLog } from '@features/moderation/backend/models/ModerationLog.js';
import { MiMuting } from '@features/relationships/backend/models/Muting.js';
import { MiRenoteMuting } from '@features/relationships/backend/models/RenoteMuting.js';
import { MiNote } from '@features/notes/backend/models/Note.js';
import { MiNoteFavorite } from '@features/collections/backend/models/NoteFavorite.js';
import { MiNoteReaction } from '@features/notes/backend/models/NoteReaction.js';
import { MiNoteThreadMuting } from '@features/notes/backend/models/NoteThreadMuting.js';
import { MiNoteDraft } from '@features/notes/backend/models/NoteDraft.js';
import { MiPage } from '@features/pages/backend/models/Page.js';
import { MiPageLike } from '@features/pages/backend/models/PageLike.js';
import { MiPasswordResetRequest } from '@features/auth/backend/models/PasswordResetRequest.js';
import { MiPoll } from '@features/notes/backend/models/Poll.js';
import { MiPollVote } from '@features/notes/backend/models/PollVote.js';
import { MiPromoNote } from '@features/instance/backend/models/PromoNote.js';
import { MiPromoRead } from '@features/instance/backend/models/PromoRead.js';
import { MiRegistrationTicket } from '@features/auth/backend/models/RegistrationTicket.js';
import { MiRegistryItem } from '@features/preferences/backend/models/RegistryItem.js';
import { MiRelay } from '@features/federation/backend/models/Relay.js';
import { MiSignin } from '@features/auth/backend/models/Signin.js';
import { MiSwSubscription } from '@features/notifications/backend/models/SwSubscription.js';
import { MiUsedUsername } from '@features/users/backend/models/UsedUsername.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiUserIp } from '@features/auth/backend/models/UserIp.js';
import { MiUserKeypair } from '@features/federation/backend/models/UserKeypair.js';
import { MiUserList } from '@features/relationships/backend/models/UserList.js';
import { MiUserListFavorite } from '@features/relationships/backend/models/UserListFavorite.js';
import { MiUserListMembership } from '@features/relationships/backend/models/UserListMembership.js';
import { MiUserNotePining } from '@features/notes/backend/models/UserNotePining.js';
import { MiUserPending } from '@features/auth/backend/models/UserPending.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserPublickey } from '@features/federation/backend/models/UserPublickey.js';
import { MiUserSecurityKey } from '@features/auth/backend/models/UserSecurityKey.js';
import { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import { MiSystemWebhook } from '@features/integrations/backend/models/SystemWebhook.js';
import { MiChannel } from '@features/channels/backend/models/Channel.js';
import { MiRetentionAggregation } from '@features/statistics/backend/models/RetentionAggregation.js';
import { MiRole } from '@features/roles/backend/models/Role.js';
import { MiRoleAssignment } from '@features/roles/backend/models/RoleAssignment.js';
import { MiFlash } from '@features/play/backend/models/Flash.js';
import { MiFlashLike } from '@features/play/backend/models/FlashLike.js';
import { MiUserMemo } from '@features/users/backend/models/UserMemo.js';
import { MiChatMessage } from '@features/chat/backend/models/ChatMessage.js';
import { MiChatRoom } from '@features/chat/backend/models/ChatRoom.js';
import { MiChatRoomMembership } from '@features/chat/backend/models/ChatRoomMembership.js';
import { MiChatRoomInvitation } from '@features/chat/backend/models/ChatRoomInvitation.js';
import { MiBubbleGameRecord } from '@features/games/backend/models/BubbleGameRecord.js';
import { MiReversiGame } from '@features/games/backend/models/ReversiGame.js';
import { MiChatApproval } from '@features/chat/backend/models/ChatApproval.js';
import { MiSystemAccount } from '@features/users/backend/models/SystemAccount.js';

pg.types.setTypeParser(20, Number);

export const dbLogger = new MisskeyLogger('db');

const sqlLogger = dbLogger.createSubLogger('sql', 'gray');

export type LoggerProps = {
	disableQueryTruncation?: boolean;
	enableQueryParamLogging?: boolean;
	printReplicationMode?: boolean,
};

function truncateSql(sql: string) {
	return sql.length > 100 ? `${sql.substring(0, 100)}...` : sql;
}

function stringifyParameter(param: any) {
	if (param instanceof Date) {
		return param.toISOString();
	} else {
		return param;
	}
}

class MyCustomLogger implements Logger {
	constructor(private props: LoggerProps = {}) {
	}

	@bindThis
	private transformQueryLog(sql: string, opts?: {
		prefix?: string;
	}) {
		let modded = opts?.prefix ? opts.prefix + sql : sql;
		if (!this.props.disableQueryTruncation) {
			modded = truncateSql(modded);
		}

		return modded;
	}

	@bindThis
	private transformParameters(parameters?: any[]) {
		if (this.props.enableQueryParamLogging && parameters && parameters.length > 0) {
			return parameters.map(stringifyParameter);
		}

		return undefined;
	}

	@bindThis
	public logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
		const prefix = (this.props.printReplicationMode && queryRunner)
			? `[${queryRunner.getReplicationMode()}] `
			: undefined;
		sqlLogger.info(this.transformQueryLog(query, { prefix }), this.transformParameters(parameters));
	}

	@bindThis
	public logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
		const prefix = (this.props.printReplicationMode && queryRunner)
			? `[${queryRunner.getReplicationMode()}] `
			: undefined;
		sqlLogger.error(this.transformQueryLog(query, { prefix }), this.transformParameters(parameters));
	}

	@bindThis
	public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
		const prefix = (this.props.printReplicationMode && queryRunner)
			? `[${queryRunner.getReplicationMode()}] `
			: undefined;
		sqlLogger.warn(this.transformQueryLog(query, { prefix }), this.transformParameters(parameters));
	}

	@bindThis
	public logSchemaBuild(message: string) {
		sqlLogger.info(message);
	}

	@bindThis
	public log(message: string) {
		sqlLogger.info(message);
	}

	@bindThis
	public logMigration(message: string) {
		sqlLogger.info(message);
	}
}

export const entities = [
	MiAnnouncement,
	MiAnnouncementRead,
	MiMeta,
	MiInstance,
	MiApp,
	MiAvatarDecoration,
	MiAuthSession,
	MiAccessToken,
	MiUser,
	MiUserProfile,
	MiUserKeypair,
	MiUserPublickey,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserNotePining,
	MiUserSecurityKey,
	MiUsedUsername,
	MiFollowing,
	MiFollowRequest,
	MiMuting,
	MiRenoteMuting,
	MiBlocking,
	MiNote,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiNoteDraft,
	MiPage,
	MiPageLike,
	MiGalleryPost,
	MiGalleryLike,
	MiDriveFile,
	MiDriveFolder,
	MiPoll,
	MiPollVote,
	MiEmoji,
	MiHashtag,
	MiSwSubscription,
	MiSystemAccount,
	MiAbuseUserReport,
	MiAbuseReportNotificationRecipient,
	MiRegistrationTicket,
	MiSignin,
	MiModerationLog,
	MiClip,
	MiClipNote,
	MiClipFavorite,
	MiAntenna,
	MiPromoNote,
	MiPromoRead,
	MiRelay,
	MiChannel,
	MiChannelFollowing,
	MiChannelFavorite,
	MiChannelMuting,
	MiRegistryItem,
	MiAd,
	MiPasswordResetRequest,
	MiUserPending,
	MiWebhook,
	MiSystemWebhook,
	MiUserIp,
	MiRetentionAggregation,
	MiRole,
	MiRoleAssignment,
	MiFlash,
	MiFlashLike,
	MiUserMemo,
	MiChatMessage,
	MiChatRoom,
	MiChatRoomMembership,
	MiChatRoomInvitation,
	MiChatApproval,
	MiBubbleGameRecord,
	MiReversiGame,
	...charts,
];

const log = process.env.NODE_ENV !== 'production';

export function createPostgresDataSource(config: Config) {
	return new DataSource({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		extra: {
			statement_timeout: 1000 * 10,
			...config.db.extra,
		},
		invalidWhereValuesBehavior: {
			null: 'ignore',
			undefined: 'ignore',
		},
		...(config.dbReplications ? {
			replication: {
				master: {
					host: config.db.host,
					port: config.db.port,
					username: config.db.user,
					password: config.db.pass,
					database: config.db.db,
				},
				slaves: config.dbSlaves!.map(rep => ({
					host: rep.host,
					port: rep.port,
					username: rep.user,
					password: rep.pass,
					database: rep.db,
				})),
			},
		} : {}),
		synchronize: process.env.NODE_ENV === 'test',
		dropSchema: process.env.NODE_ENV === 'test',
		cache: !config.db.disableCache && process.env.NODE_ENV !== 'test' ? { // dbをcloseしても何故かredisのコネクションが内部的に残り続けるようで、テストの際に支障が出るため無効にする(キャッシュも含めてテストしたいため本当は有効にしたいが...)
			type: 'ioredis',
			options: {
				...config.redis,
				keyPrefix: `${config.redis.prefix}:query:`,
			},
		} : false,
		logging: log,
		logger: log
			? new MyCustomLogger({
				disableQueryTruncation: config.logging?.sql?.disableQueryTruncation,
				enableQueryParamLogging: config.logging?.sql?.enableQueryParamLogging,
				printReplicationMode: !!config.dbReplications,
			})
			: undefined,
		maxQueryExecutionTime: 300,
		entities: entities,
		migrations: ['../../migration/*.js'],
	});
}
