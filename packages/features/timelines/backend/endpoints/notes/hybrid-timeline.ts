/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesHybridTimelineContract, notesHybridTimelineErrors } from './hybrid-timeline.contract.js';
import { Brackets } from 'typeorm';
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
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import { FanoutTimelineName } from '../../services/FanoutTimelineService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';

export interface NotesHybridTimelineDependencies {
	serverSettings: MiMeta;
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	roleService: RoleService;
	activeUsersChart: ActiveUsersChart;
	idService: IdService;
	cacheService: CacheService;
	queryService: QueryService;
	userFollowingService: UserFollowingService;
	channelMutingService: ChannelMutingService;
	channelFollowingService: ChannelFollowingService;
	fanoutTimelineEndpointService: FanoutTimelineEndpointService;
}
export function createNotesHybridTimelineProcedure<Actor extends MiLocalUser>(deps: NotesHybridTimelineDependencies) {
	async function getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		includeMyRenotes: boolean,
		includeRenotedMyNotes: boolean,
		includeLocalRenotes: boolean,
		withFiles: boolean,
		withReplies: boolean,
	}, me: MiLocalUser) {
		const followees = await deps.userFollowingService.getFollowees(me.id);
		const mutingChannelIds = await deps.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		const followingChannelIds = await deps.channelFollowingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id).filter(x => !mutingChannelIds.includes(x)));
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
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
		deps.queryService.generateVisibilityQuery(query, me);
		deps.queryService.generateBaseNoteFilteringQuery(query, me);
		deps.queryService.generateMutedUserRenotesQueryForNotes(query, me);
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

	return createApiProcedure<Actor>()(notesHybridTimelineContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
				const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
				const policies = await deps.roleService.getUserPolicies(me.id);
				if (!policies.ltlAvailable) {
					throw apiError(notesHybridTimelineErrors.stlDisabled);
				}
				if (ps.withReplies && ps.withFiles) throw apiError(notesHybridTimelineErrors.bothWithRepliesAndWithFiles);
				if (!deps.serverSettings.enableFanoutTimeline) {
					const timeline = await getFromDb({
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
						deps.activeUsersChart.read(me);
					});
					return await deps.noteEntityService.packMany(timeline, me);
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
					deps.cacheService.userFollowingsCache.fetch(me.id),
				]);
				const redisTimeline = await deps.fanoutTimelineEndpointService.timeline({
					untilId,
					sinceId,
					limit: ps.limit,
					allowPartial: ps.allowPartial,
					me,
					redisTimelines: timelineConfig,
					useDbFallback: deps.serverSettings.enableFanoutTimelineDbFallback,
					alwaysIncludeMyNotes: true,
					excludePureRenotes: !ps.withRenotes,
					noteFilter: note => {
						if (note.reply && note.reply.visibility === 'followers') {
							if (!Object.hasOwn(followings, note.reply.userId) && note.reply.userId !== me.id) return false;
						}
						return true;
					},
					dbFallback: async (untilId, sinceId, limit) => await getFromDb({
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
					deps.activeUsersChart.read(me);
				});
				return redisTimeline;
			})();
			return result.map(toPackedNote);
		});
}
