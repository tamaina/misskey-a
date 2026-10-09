/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import { FanoutTimelineName } from '../../services/FanoutTimelineService.js';

import { type notesHybridTimelineContract, notesHybridTimelineErrors } from '../../endpoints/notes/hybrid-timeline.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import type { NotesRepository, ChannelFollowingsRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class NotesHybridTimelineApplicationService {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
		private queryService: QueryService,
		private userFollowingService: UserFollowingService,
		private channelMutingService: ChannelMutingService,
		private channelFollowingService: ChannelFollowingService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof notesHybridTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		const policies = await this.roleService.getUserPolicies(me.id);
		if (!policies.ltlAvailable) {
			throw apiError(notesHybridTimelineErrors.stlDisabled);
		}

		if (ps.withReplies && ps.withFiles) throw apiError(notesHybridTimelineErrors.bothWithRepliesAndWithFiles);

		if (!this.serverSettings.enableFanoutTimeline) {
			const timeline = await this.getFromDb({
				untilId,
				sinceId,
				limit: ps.limit,
				includeMyRenotes: ps.includeMyRenotes,
				includeRenotedMyNotes: ps.includeRenotedMyNotes,
				includeLocalRenotes: ps.includeLocalRenotes,
				withFiles: ps.withFiles,
				withReplies: ps.withReplies,
			}, me);

			process.nextTick(() => {
				this.activeUsersChart.read(me);
			});

			return await this.noteEntityService.packMany(timeline, me);
		}

		let timelineConfig: FanoutTimelineName[];

		if (ps.withFiles) {
			timelineConfig = [
				`homeTimelineWithFiles:${me.id}`,
				'localTimelineWithFiles',
			];
		} else if (ps.withReplies) {
			timelineConfig = [
				`homeTimeline:${me.id}`,
				'localTimeline',
				'localTimelineWithReplies',
			];
		} else {
			timelineConfig = [
				`homeTimeline:${me.id}`,
				'localTimeline',
				`localTimelineWithReplyTo:${me.id}`,
			];
		}

		const [
			followings,
		] = await Promise.all([
			this.cacheService.userFollowingsCache.fetch(me.id),
		]);

		const redisTimeline = await this.fanoutTimelineEndpointService.timeline({
			untilId,
			sinceId,
			limit: ps.limit,
			allowPartial: ps.allowPartial,
			me,
			redisTimelines: timelineConfig,
			useDbFallback: this.serverSettings.enableFanoutTimelineDbFallback,
			alwaysIncludeMyNotes: true,
			excludePureRenotes: !ps.withRenotes,
			noteFilter: note => {
				if (note.reply && note.reply.visibility === 'followers') {
					if (!Object.hasOwn(followings, note.reply.userId) && note.reply.userId !== me.id) return false;
				}

				return true;
			},
			dbFallback: async (untilId, sinceId, limit) => await this.getFromDb({
				untilId,
				sinceId,
				limit,
				includeMyRenotes: ps.includeMyRenotes,
				includeRenotedMyNotes: ps.includeRenotedMyNotes,
				includeLocalRenotes: ps.includeLocalRenotes,
				withFiles: ps.withFiles,
				withReplies: ps.withReplies,
			}, me),
		});

		process.nextTick(() => {
			this.activeUsersChart.read(me);
		});

		return redisTimeline;
	}

	private async getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		includeMyRenotes: boolean,
		includeRenotedMyNotes: boolean,
		includeLocalRenotes: boolean,
		withFiles: boolean,
		withReplies: boolean,
	}, me: MiLocalUser) {
		const followees = await this.userFollowingService.getFollowees(me.id);

		const mutingChannelIds = await this.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		const followingChannelIds = await this.channelFollowingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id).filter(x => !mutingChannelIds.includes(x)));

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere(new Brackets(qb => {
				if (followees.length > 0) {
					const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
					qb.where('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds });
					qb.orWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)');
				} else {
					qb.where('note.userId = :meId', { meId: me.id });
					qb.orWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)');
				}
			}))
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		if (followingChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.where('note.channelId IN (:...followingChannelIds)', { followingChannelIds });
				qb.orWhere('note.channelId IS NULL');
			}));
		} else {
			query.andWhere('note.channelId IS NULL');
		}

		if (mutingChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteChannelId IS NULL');
				qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
		}

		if (!ps.withReplies) {
			query.andWhere(new Brackets(qb => {
				qb
					.where('note.replyId IS NULL') // 返信ではない
					.orWhere(new Brackets(qb => {
						qb // 返信だけど投稿者自身への返信
							.where('note.replyId IS NOT NULL')
							.andWhere('note.replyUserId = note.userId');
					}));
			}));
		}

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);
		this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

		if (ps.includeMyRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.userId != :meId', { meId: me.id });
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		if (ps.includeRenotedMyNotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteUserId != :meId', { meId: me.id });
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		if (ps.includeLocalRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteUserHost IS NOT NULL');
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere('note.text IS NOT NULL');
				qb.orWhere('note.fileIds != \'{}\'');
				qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
			}));
		}

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}
		//#endregion

		return await query.limit(ps.limit).getMany();
	}
}
