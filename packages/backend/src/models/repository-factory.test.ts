/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import type { DataSource } from 'typeorm';
import { describe, expect, test } from 'vitest';
import { DI } from '@/di-symbols.js';
import {
	miRepository,
	MiAbuseReportNotificationRecipient,
	MiAbuseUserReport,
	MiAccessToken,
	MiAd,
	MiAnnouncement,
	MiAnnouncementRead,
	MiAntenna,
	MiApp,
	MiAuthSession,
	MiAvatarDecoration,
	MiBlocking,
	MiBubbleGameRecord,
	MiChannel,
	MiChannelFavorite,
	MiChannelFollowing,
	MiChannelMuting,
	MiChatApproval,
	MiChatMessage,
	MiChatRoom,
	MiChatRoomInvitation,
	MiChatRoomMembership,
	MiClip,
	MiClipFavorite,
	MiClipNote,
	MiDriveFile,
	MiDriveFolder,
	MiEmoji,
	MiFlash,
	MiFlashLike,
	MiFollowRequest,
	MiFollowing,
	MiGalleryLike,
	MiGalleryPost,
	MiHashtag,
	MiInstance,
	MiMeta,
	MiModerationLog,
	MiMuting,
	MiNote,
	MiNoteDraft,
	MiNoteFavorite,
	MiNoteReaction,
	MiNoteThreadMuting,
	MiPage,
	MiPageLike,
	MiPasswordResetRequest,
	MiPoll,
	MiPollVote,
	MiPromoNote,
	MiPromoRead,
	MiRegistrationTicket,
	MiRegistryItem,
	MiRelay,
	MiRenoteMuting,
	MiRetentionAggregation,
	MiReversiGame,
	MiRole,
	MiRoleAssignment,
	MiSignin,
	MiSwSubscription,
	MiSystemAccount,
	MiSystemWebhook,
	MiUsedUsername,
	MiUser,
	MiUserIp,
	MiUserKeypair,
	MiUserList,
	MiUserListFavorite,
	MiUserListMembership,
	MiUserMemo,
	MiUserNotePining,
	MiUserPending,
	MiUserProfile,
	MiUserPublickey,
	MiUserSecurityKey,
	MiWebhook,
} from '@features/persistence/backend/repositories/models.js';
import type { FactoryProvider } from '@nestjs/common';
import { RepositoryModule, repositoryProviders } from '@features/persistence/backend/repositories/RepositoryModule.js';
import { createRepositorySet, repositoryFactories } from '@features/persistence/backend/repositories/factory.js';

// Captured from the original RepositoryModule providers/exports before the refactor.
const originalMappings = [
	['usersRepository', DI.usersRepository, MiUser],
	['notesRepository', DI.notesRepository, MiNote],
	['announcementsRepository', DI.announcementsRepository, MiAnnouncement],
	['announcementReadsRepository', DI.announcementReadsRepository, MiAnnouncementRead],
	['appsRepository', DI.appsRepository, MiApp],
	['avatarDecorationsRepository', DI.avatarDecorationsRepository, MiAvatarDecoration],
	['noteFavoritesRepository', DI.noteFavoritesRepository, MiNoteFavorite],
	['noteThreadMutingsRepository', DI.noteThreadMutingsRepository, MiNoteThreadMuting],
	['noteReactionsRepository', DI.noteReactionsRepository, MiNoteReaction],
	['noteDraftsRepository', DI.noteDraftsRepository, MiNoteDraft],
	['pollsRepository', DI.pollsRepository, MiPoll],
	['pollVotesRepository', DI.pollVotesRepository, MiPollVote],
	['userProfilesRepository', DI.userProfilesRepository, MiUserProfile],
	['userKeypairsRepository', DI.userKeypairsRepository, MiUserKeypair],
	['userPendingsRepository', DI.userPendingsRepository, MiUserPending],
	['userSecurityKeysRepository', DI.userSecurityKeysRepository, MiUserSecurityKey],
	['userPublickeysRepository', DI.userPublickeysRepository, MiUserPublickey],
	['userListsRepository', DI.userListsRepository, MiUserList],
	['userListFavoritesRepository', DI.userListFavoritesRepository, MiUserListFavorite],
	['userListMembershipsRepository', DI.userListMembershipsRepository, MiUserListMembership],
	['userNotePiningsRepository', DI.userNotePiningsRepository, MiUserNotePining],
	['userIpsRepository', DI.userIpsRepository, MiUserIp],
	['usedUsernamesRepository', DI.usedUsernamesRepository, MiUsedUsername],
	['followingsRepository', DI.followingsRepository, MiFollowing],
	['followRequestsRepository', DI.followRequestsRepository, MiFollowRequest],
	['instancesRepository', DI.instancesRepository, MiInstance],
	['emojisRepository', DI.emojisRepository, MiEmoji],
	['driveFilesRepository', DI.driveFilesRepository, MiDriveFile],
	['driveFoldersRepository', DI.driveFoldersRepository, MiDriveFolder],
	['metasRepository', DI.metasRepository, MiMeta],
	['mutingsRepository', DI.mutingsRepository, MiMuting],
	['renoteMutingsRepository', DI.renoteMutingsRepository, MiRenoteMuting],
	['blockingsRepository', DI.blockingsRepository, MiBlocking],
	['swSubscriptionsRepository', DI.swSubscriptionsRepository, MiSwSubscription],
	['systemAccountsRepository', DI.systemAccountsRepository, MiSystemAccount],
	['hashtagsRepository', DI.hashtagsRepository, MiHashtag],
	['abuseUserReportsRepository', DI.abuseUserReportsRepository, MiAbuseUserReport],
	['abuseReportNotificationRecipientRepository', DI.abuseReportNotificationRecipientRepository, MiAbuseReportNotificationRecipient],
	['registrationTicketsRepository', DI.registrationTicketsRepository, MiRegistrationTicket],
	['authSessionsRepository', DI.authSessionsRepository, MiAuthSession],
	['accessTokensRepository', DI.accessTokensRepository, MiAccessToken],
	['signinsRepository', DI.signinsRepository, MiSignin],
	['pagesRepository', DI.pagesRepository, MiPage],
	['pageLikesRepository', DI.pageLikesRepository, MiPageLike],
	['galleryPostsRepository', DI.galleryPostsRepository, MiGalleryPost],
	['galleryLikesRepository', DI.galleryLikesRepository, MiGalleryLike],
	['moderationLogsRepository', DI.moderationLogsRepository, MiModerationLog],
	['clipsRepository', DI.clipsRepository, MiClip],
	['clipNotesRepository', DI.clipNotesRepository, MiClipNote],
	['clipFavoritesRepository', DI.clipFavoritesRepository, MiClipFavorite],
	['antennasRepository', DI.antennasRepository, MiAntenna],
	['promoNotesRepository', DI.promoNotesRepository, MiPromoNote],
	['promoReadsRepository', DI.promoReadsRepository, MiPromoRead],
	['relaysRepository', DI.relaysRepository, MiRelay],
	['channelsRepository', DI.channelsRepository, MiChannel],
	['channelFollowingsRepository', DI.channelFollowingsRepository, MiChannelFollowing],
	['channelFavoritesRepository', DI.channelFavoritesRepository, MiChannelFavorite],
	['channelMutingRepository', DI.channelMutingRepository, MiChannelMuting],
	['registryItemsRepository', DI.registryItemsRepository, MiRegistryItem],
	['webhooksRepository', DI.webhooksRepository, MiWebhook],
	['systemWebhooksRepository', DI.systemWebhooksRepository, MiSystemWebhook],
	['adsRepository', DI.adsRepository, MiAd],
	['passwordResetRequestsRepository', DI.passwordResetRequestsRepository, MiPasswordResetRequest],
	['retentionAggregationsRepository', DI.retentionAggregationsRepository, MiRetentionAggregation],
	['rolesRepository', DI.rolesRepository, MiRole],
	['roleAssignmentsRepository', DI.roleAssignmentsRepository, MiRoleAssignment],
	['flashsRepository', DI.flashsRepository, MiFlash],
	['flashLikesRepository', DI.flashLikesRepository, MiFlashLike],
	['userMemosRepository', DI.userMemosRepository, MiUserMemo],
	['chatMessagesRepository', DI.chatMessagesRepository, MiChatMessage],
	['chatRoomsRepository', DI.chatRoomsRepository, MiChatRoom],
	['chatRoomMembershipsRepository', DI.chatRoomMembershipsRepository, MiChatRoomMembership],
	['chatRoomInvitationsRepository', DI.chatRoomInvitationsRepository, MiChatRoomInvitation],
	['chatApprovalsRepository', DI.chatApprovalsRepository, MiChatApproval],
	['bubbleGameRecordsRepository', DI.bubbleGameRecordsRepository, MiBubbleGameRecord],
	['reversiGamesRepository', DI.reversiGamesRepository, MiReversiGame],
 ] as const;

type RepositoryInvocation = { entity: unknown; extension: unknown; repository: object };

function makeDataSource() {
	const calls: RepositoryInvocation[] = [];
	const db = {
		getRepository(entity: unknown) {
			return {
				extend(extension: unknown) {
				const repository = {};
				calls.push({ entity, extension, repository });
				return repository;
			},
			};
		},
	} as unknown as DataSource;
	return { db, calls };
}

describe('repository factory', () => {
	test('preserves original token/entity mapping, extension, and construction order', () => {
		const { db, calls } = makeDataSource();
		const repositories = createRepositorySet(db);

		expect(originalMappings).toHaveLength(76);
		expect(Object.keys(repositoryFactories)).toEqual(originalMappings.map(([name]) => name));
		expect(calls).toHaveLength(originalMappings.length);
		expect(calls.map(call => call.entity)).toEqual(originalMappings.map(([, , entity]) => entity));
		expect(calls.map(call => call.extension)).toEqual(originalMappings.map(() => miRepository));
		expect(new Set(calls.map(call => call.repository)).size).toBe(originalMappings.length);

		for (const [index, [name]] of originalMappings.entries()) {
			expect(repositories[name]).toBe(calls[index].repository);
		}
	});

	test('creates distinct extended repository instances for each context', () => {
		const firstContext = makeDataSource();
		const secondContext = makeDataSource();
		const first = createRepositorySet(firstContext.db);
		const second = createRepositorySet(secondContext.db);

		expect(firstContext.calls).toHaveLength(originalMappings.length);
		expect(secondContext.calls).toHaveLength(originalMappings.length);
		for (const [name] of originalMappings) {
			expect(first[name]).not.toBe(second[name]);
		}
	});

	test('generated Nest aliases and module exports expose the original objects and tokens', () => {
		const repositories = createRepositorySet(makeDataSource().db);
		expect(repositoryProviders).toHaveLength(originalMappings.length);
		expect(repositoryProviders.map(provider => provider.provide)).toEqual(originalMappings.map(([, token]) => token));
		expect(repositoryProviders.map(provider => provider.useFactory(repositories))).toEqual(
			originalMappings.map(([name]) => repositories[name]),
		);

		const exportedProviders = Reflect.getMetadata(MODULE_METADATA.EXPORTS, RepositoryModule) as FactoryProvider[];
		expect(exportedProviders.map(provider => provider.provide)).toEqual(originalMappings.map(([, token]) => token));
	});
});
