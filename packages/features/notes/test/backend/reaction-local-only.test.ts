/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as assert from 'assert';
import { describe, test, vi } from 'vitest';
import { ReactionService } from '../../backend/services/ReactionService.js';

describe('local-only reaction federation boundaries', () => {
	describe('create', () => {
		test.each([
			[null, null, ':localonly:'],
			['remote.example', null, '❤'],
			[null, 'remote.example', '❤'],
			[null, 'local', ':localonly:'],
		])('local-only emoji noteHost=%s originalHost=%s gives %s', async (userHost, originalHost, expected) => {
			const inserted: Array<{ reaction: string }> = [];
			const query = { update: vi.fn(), set: vi.fn(), where: vi.fn(), setParameters: vi.fn(), execute: vi.fn().mockResolvedValue(undefined) };
			for (const method of ['update', 'set', 'where', 'setParameters'] as const) query[method].mockReturnValue(query);
			const service = new ReactionService(
				{ enableReactionsBuffering: false, enableChartsForRemoteUser: false, mediaSilencedHosts: [] } as never,
				{ findOneBy: vi.fn().mockResolvedValue({ id: 'remote-user', host: userHost }) } as never,
				{ createQueryBuilder: () => query } as never,
				{
					insert: vi.fn(async (record: { reaction: string }) => {
						inserted.push(record);
					}),
				} as never,
				{ findOne: vi.fn() } as never,
				{ toPunyNullable: (host: string | null) => host, isMediaSilencedHost: () => false } as never,
				{
					localEmojisCache: {
						fetch: vi.fn().mockResolvedValue(new Map([['localonly', {
							name: 'localonly',
							host: null,
							localOnly: true,
							isSensitive: false,
							roleIdsThatCanBeUsedThisEmojiAsReaction: [],
						}]])),
					},
				} as never,
				{ getUserRoles: vi.fn() } as never,
				{ isLocalUser: (user: { host: string | null }) => user.host == null } as never,
				{ isVisibleForMe: vi.fn().mockResolvedValue(true) } as never,
				{ checkBlocked: vi.fn().mockResolvedValue(false) } as never,
				{ create: vi.fn(), delete: vi.fn() } as never,
				{ gen: vi.fn(() => 'reaction-id'), parse: vi.fn(() => ({ date: new Date() })) } as never,
				{ updateInChannelNotesRanking: vi.fn(), updateGlobalNotesRanking: vi.fn(), updatePerUserNotesRanking: vi.fn() } as never,
				{ publishNoteStream: vi.fn() } as never,
				{
					addContext: (content: unknown) => content,
					renderLike: vi.fn().mockResolvedValue({}),
				} as never,
				{
					createDeliverManager: vi.fn(() => ({
						addDirectRecipe: vi.fn(),
						addFollowersRecipe: vi.fn(),
						execute: vi.fn().mockResolvedValue(undefined),
					})),
				} as never,
				{ createNotification: vi.fn() } as never,
				{ update: vi.fn() } as never,
			);

			await service.create(
				{ id: 'local-user', host: null, isBot: false },
				{
					id: 'remote-note',
					userId: 'remote-user',
					userHost,
					text: 'quote',
					fileIds: [],
					renoteId: originalHost == null ? null : 'original-note',
					renote: null,
					renoteUserHost: originalHost === 'local' ? null : originalHost,
					reactionAcceptance: null,
					reactionAndUserPairCache: [],
					localOnly: false,
					visibility: 'public',
					replyId: null,
					channelId: null,
					visibleUserIds: [],
				} as never,
				':localonly:',
			);

			assert.strictEqual(inserted[0].reaction, expected);
		});
	});
});
