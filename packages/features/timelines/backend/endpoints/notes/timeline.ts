/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesTimelineContract } from './timeline.contract.js';
import { Brackets } from 'typeorm';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesTimelineDependencies {
	serverSettings: MiMeta;
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	activeUsersChart: ActiveUsersChart;
	idService: IdService;
	cacheService: CacheService;
	fanoutTimelineEndpointService: FanoutTimelineEndpointService;
	userFollowingService: UserFollowingService;
	channelMutingService: ChannelMutingService;
	channelFollowingService: ChannelFollowingService;
	queryService: QueryService;
}
export function createNotesTimelineProcedure<Actor extends MiLocalUser>(deps: NotesTimelineDependencies) {
	async function getFromDb(ps: { untilId: string | null; sinceId: string | null; limit: number; includeMyRenotes: boolean; includeRenotedMyNotes: boolean; includeLocalRenotes: boolean; withFiles: boolean; withRenotes: boolean; }, me: MiLocalUser) {
		const followees = await deps.userFollowingService.getFollowees(me.id);
		const mutingChannelIds = await deps.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		const followingChannelIds = await deps.channelFollowingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id).filter(x => !mutingChannelIds.includes(x)));
		//#region Construct query
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');
		if (followees.length > 0 && followingChannelIds.length > 0) {
			// ユーザー・チャンネルともにフォローあり
			const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
			query.andWhere(new Brackets(qb => {
				qb
					.where(new Brackets(qb2 => {
						qb2
							.andWhere('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds })
							.andWhere('note.channelId IS NULL');
					}))
					.orWhere('note.channelId IN (:...followingChannelIds)', { followingChannelIds });
			}));
		} else if (followees.length > 0) {
			// ユーザーフォローのみ（チャンネルフォローなし）
			const meOrFolloweeIds = [me.id, ...followees.map(f => f.followeeId)];
			query.andWhere(new Brackets(qb => {
				qb
					.andWhere('note.channelId IS NULL')
					.andWhere('note.userId IN (:...meOrFolloweeIds)', { meOrFolloweeIds: meOrFolloweeIds });
				if (mutingChannelIds.length > 0) {
					qb.andWhere(new Brackets(qb2 => {
						qb2.orWhere('note.renoteChannelId IS NULL');
						qb2.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
					}));
				}
			}));
		} else if (followingChannelIds.length > 0) {
			// チャンネルフォローのみ（ユーザーフォローなし）
			query.andWhere(new Brackets(qb => {
				qb
					// renoteChannelIdは見る必要が無い
					// ・HTLに流れてくるチャンネル＝フォローしているチャンネル
					// ・HTLにフォロー外のチャンネルが流れるのは、フォローしているユーザがそのチャンネル投稿をリノートした場合のみ
					// つまり、ユーザフォローしてない前提のこのブロックでは見る必要が無い
					.where('note.channelId IN (:...followingChannelIds)', { followingChannelIds })
					.orWhere('note.userId = :meId', { meId: me.id });
			}));
		} else {
			// フォローなし
			query.andWhere(new Brackets(qb => {
				qb
					.andWhere('note.channelId IS NULL')
					.andWhere('note.userId = :meId', { meId: me.id });
			}));
		}
		query.andWhere(new Brackets(qb => {
			qb
				.where('note.replyId IS NULL') // 返信ではない
				.orWhere(new Brackets(qb => {
					qb // 返信だけど投稿者自身への返信
						.where('note.replyId IS NOT NULL')
						.andWhere('note.replyUserId = note.userId');
				}));
		}));
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
		if (ps.withRenotes === false) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteId IS NULL');
				qb.orWhere(new Brackets(qb => {
					qb.orWhere('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}));
		}
		//#endregion
		return await query.limit(ps.limit).getMany();
	}

	return implement(notesTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: notesTimelineContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
			if (!deps.serverSettings.enableFanoutTimeline) {
				const timeline = await getFromDb({
					untilId,
					sinceId,
					limit: ps.limit,
					includeMyRenotes: ps.includeMyRenotes,
					includeRenotedMyNotes: ps.includeRenotedMyNotes,
					includeLocalRenotes: ps.includeLocalRenotes,
					withFiles: ps.withFiles,
					withRenotes: ps.withRenotes,
				}, me);
				process.nextTick(() => {
					deps.activeUsersChart.read(me);
				});
				return await deps.noteEntityService.packMany(timeline, me);
			}
			const [
				followings,
			] = await Promise.all([
				deps.cacheService.userFollowingsCache.fetch(me.id),
			]);
			const timeline = deps.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				useDbFallback: deps.serverSettings.enableFanoutTimelineDbFallback,
				redisTimelines: ps.withFiles ? [`homeTimelineWithFiles:${me.id}`] : [`homeTimeline:${me.id}`],
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
					withRenotes: ps.withRenotes,
				}, me),
			});
			process.nextTick(() => {
				deps.activeUsersChart.read(me);
			});
			return timeline;
		});
}
