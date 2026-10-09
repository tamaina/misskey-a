/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { usersNotesContract, usersNotesErrors } from './notes.contract.js';
import { Brackets } from 'typeorm';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { FanoutTimelineName } from '../../services/FanoutTimelineService.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface UsersNotesDependencies {
	serverSettings: MiMeta;
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	queryService: QueryService;
	cacheService: CacheService;
	idService: IdService;
	fanoutTimelineEndpointService: FanoutTimelineEndpointService;
	channelMutingService: ChannelMutingService;
}
export function createUsersNotesProcedure<Actor extends MiLocalUser>(deps: UsersNotesDependencies) {
	async function getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		userId: string,
		withChannelNotes: boolean,
		withFiles: boolean,
		withRenotes: boolean,
	}, me: MiLocalUser | null) {
		const mutingChannelIds = me
			? await deps.channelMutingService
				.list({ requestUserId: me.id }, { idOnly: true })
				.then(x => x.map(x => x.id))
			: [];
		const isSelf = me && (me.id === ps.userId);
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere('note.userId = :userId', { userId: ps.userId })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('note.channel', 'channel')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');
		if (ps.withChannelNotes) {
			query.andWhere(new Brackets(qb => {
				if (mutingChannelIds.length > 0) {
					qb.andWhere(new Brackets(qb2 => {
						qb2.orWhere('note.channelId IS NULL');
						qb2.orWhere('note.channelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
					}));
				}
				if (!isSelf) {
					qb.andWhere(new Brackets(qb2 => {
						qb2.orWhere('note.channelId IS NULL');
						qb2.orWhere('channel.isSensitive = false');
					}));
				}
			}));
		} else {
			query.andWhere('note.channelId IS NULL');
		}
		// -- ミュートされたチャンネルのリノート対策
		if (mutingChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteChannelId IS NULL');
				qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
		}
		deps.queryService.generateVisibilityQuery(query, me);
		if (me == null) deps.queryService.generateUgcVisibilityQueryForVisitor(query);
		deps.queryService.generateBaseNoteFilteringQuery(query, me, {
			excludeAuthor: true,
			excludeUserFromMute: ps.userId,
		});
		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}
		if (ps.withRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.userId != :userId', { userId: ps.userId });
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}
		return await query.limit(ps.limit).getMany();
	}

	return implement(usersNotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: usersNotesContract['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
			const isSelf = me && (me.id === ps.userId);
			if (ps.withReplies && ps.withFiles) throw apiError(usersNotesErrors.bothWithRepliesAndWithFiles);
			// early return if me is blocked by requesting user
			if (me != null) {
				const userIdsWhoBlockingMe = await deps.cacheService.userBlockedCache.fetch(me.id);
				if (userIdsWhoBlockingMe.has(ps.userId)) {
					return [];
				}
			}
			if (!deps.serverSettings.enableFanoutTimeline) {
				const timeline = await getFromDb({
					untilId,
					sinceId,
					limit: ps.limit,
					userId: ps.userId,
					withChannelNotes: ps.withChannelNotes,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
				}, me);
				return await deps.noteEntityService.packMany(timeline, me);
			}
			const redisTimelines: FanoutTimelineName[] = [ps.withFiles ? `userTimelineWithFiles:${ps.userId}` : `userTimeline:${ps.userId}`];
			if (ps.withReplies) redisTimelines.push(`userTimelineWithReplies:${ps.userId}`);
			if (ps.withChannelNotes) redisTimelines.push(`userTimelineWithChannel:${ps.userId}`);
			const isFollowing = me && Object.hasOwn(await deps.cacheService.userFollowingsCache.fetch(me.id), ps.userId);
			const timeline = await deps.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				redisTimelines,
				useDbFallback: true,
				ignoreAuthorFromMute: true,
				ignoreAuthorFromInstanceBlock: true,
				ignoreAuthorFromUserSuspension: true,
				excludeReplies: ps.withChannelNotes && !ps.withReplies, // userTimelineWithChannel may include replies
				excludeNoFiles: ps.withChannelNotes && ps.withFiles, // userTimelineWithChannel may include notes without files
				excludePureRenotes: !ps.withRenotes,
				noteFilter: note => {
					if (note.channel?.isSensitive && !isSelf) return false;
					if (note.visibility === 'specified' && (!me || (me.id !== note.userId && !note.visibleUserIds.some(v => v === me.id)))) return false;
					if (note.visibility === 'followers' && !isFollowing && !isSelf) return false;
					return true;
				},
				dbFallback: async (untilId, sinceId, limit) => await getFromDb({
					untilId,
					sinceId,
					limit,
					userId: ps.userId,
					withChannelNotes: ps.withChannelNotes,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
				}, me),
			});
			return timeline;
		});
}
