/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { DI } from '@/di-symbols.js';
import { FanoutTimelineName } from '../../services/FanoutTimelineService.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';

import { usersNotesInput, usersNotesErrors } from '../../endpoints/users/notes.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class UsersNotesApplicationService {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private cacheService: CacheService,
		private idService: IdService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private channelMutingService: ChannelMutingService,
	) {}

	async execute(ps: v.InferOutput<typeof usersNotesInput>, me: MiLocalUser | null) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);
		const isSelf = me && (me.id === ps.userId);

		if (ps.withReplies && ps.withFiles) throw apiError(usersNotesErrors.bothWithRepliesAndWithFiles);

		// early return if me is blocked by requesting user
		if (me != null) {
			const userIdsWhoBlockingMe = await this.cacheService.userBlockedCache.fetch(me.id);
			if (userIdsWhoBlockingMe.has(ps.userId)) {
				return [];
			}
		}

		if (!this.serverSettings.enableFanoutTimeline) {
			const timeline = await this.getFromDb({
				untilId,
				sinceId,
				limit: ps.limit,
				userId: ps.userId,
				withChannelNotes: ps.withChannelNotes,
				withFiles: ps.withFiles,
				withRenotes: ps.withRenotes,
			}, me);

			return await this.noteEntityService.packMany(timeline, me);
		}

		const redisTimelines: FanoutTimelineName[] = [ps.withFiles ? `userTimelineWithFiles:${ps.userId}` : `userTimeline:${ps.userId}`];

		if (ps.withReplies) redisTimelines.push(`userTimelineWithReplies:${ps.userId}`);
		if (ps.withChannelNotes) redisTimelines.push(`userTimelineWithChannel:${ps.userId}`);

		const isFollowing = me && Object.hasOwn(await this.cacheService.userFollowingsCache.fetch(me.id), ps.userId);

		const timeline = await this.fanoutTimelineEndpointService.timeline({
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
			dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
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
	}

	private async getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		userId: string,
		withChannelNotes: boolean,
		withFiles: boolean,
		withRenotes: boolean,
	}, me: MiLocalUser | null) {
		const mutingChannelIds = me
			? await this.channelMutingService
				.list({ requestUserId: me.id }, { idOnly: true })
				.then(x => x.map(x => x.id))
			: [];
		const isSelf = me && (me.id === ps.userId);

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
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

		this.queryService.generateVisibilityQuery(query, me);
		if (me == null) this.queryService.generateUgcVisibilityQueryForVisitor(query);
		this.queryService.generateBaseNoteFilteringQuery(query, me, {
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
}
