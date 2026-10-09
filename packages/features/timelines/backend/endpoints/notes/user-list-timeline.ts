/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesUserListTimelineContract, notesUserListTimelineErrors } from './user-list-timeline.contract.js';
import { Brackets } from 'typeorm';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiMeta, MiUserList, NotesRepository, UserListMembershipsRepository, UserListsRepository } from '@features/persistence/backend/repositories/models.js';

export interface NotesUserListTimelineDependencies {
	serverSettings: MiMeta;
	notesRepository: NotesRepository;
	userListsRepository: UserListsRepository;
	userListMembershipsRepository: UserListMembershipsRepository;
	noteEntityService: NoteEntityService;
	activeUsersChart: ActiveUsersChart;
	idService: IdService;
	fanoutTimelineEndpointService: FanoutTimelineEndpointService;
	queryService: QueryService;
	channelMutingService: ChannelMutingService;
}
export function createNotesUserListTimelineProcedure<Actor extends MiLocalUser>(deps: NotesUserListTimelineDependencies) {
	async function getFromDb(list: MiUserList, ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		includeMyRenotes: boolean,
		includeRenotedMyNotes: boolean,
		includeLocalRenotes: boolean,
		withFiles: boolean,
		withRenotes: boolean,
	}, me: MiLocalUser) {
		//#region Construct query
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.innerJoin(deps.userListMembershipsRepository.metadata.targetName, 'userListMemberships', 'userListMemberships.userId = note.userId')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.andWhere('userListMemberships.userListId = :userListId', { userListId: list.id })
			.andWhere('note.channelId IS NULL') // チャンネルノートではない
			.andWhere(new Brackets(qb => {
				qb
					.where('note.replyId IS NULL') // 返信ではない
					.orWhere(new Brackets(qb => {
						qb // 返信だけど投稿者自身への返信
							.where('note.replyId IS NOT NULL')
							.andWhere('note.replyUserId = note.userId');
					}))
					.orWhere(new Brackets(qb => {
						qb // 返信だけど自分宛ての返信
							.where('note.replyId IS NOT NULL')
							.andWhere('note.replyUserId = :meId', { meId: me.id });
					}))
					.orWhere(new Brackets(qb => {
						qb // 返信だけどwithRepliesがtrueの場合
							.where('note.replyId IS NOT NULL')
							.andWhere('userListMemberships.withReplies = true');
					}));
			}));
		deps.queryService.generateVisibilityQuery(query, me);
		deps.queryService.generateBaseNoteFilteringQuery(query, me);
		deps.queryService.generateMutedUserRenotesQueryForNotes(query, me);
		// -- ミュートされたチャンネルのリノート対策
		const mutedChannelIds = await deps.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		if (mutedChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteChannelId IS NULL')
					.orWhere('note.renoteChannelId NOT IN (:...mutedChannelIds)', { mutedChannelIds });
			}));
		}
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
		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}
		//#endregion
		return await query.limit(ps.limit).getMany();
	}

	return createApiProcedure<Actor>()(notesUserListTimelineContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
				const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
				const list = await deps.userListsRepository.findOneBy({
					id: ps.listId,
					userId: me.id,
				});
				if (list == null) {
					throw apiError(notesUserListTimelineErrors.noSuchList);
				}
				if (!deps.serverSettings.enableFanoutTimeline) {
					const timeline = await getFromDb(list, {
						untilId,
						sinceId,
						limit: ps.limit,
						includeMyRenotes: ps.includeMyRenotes,
						includeRenotedMyNotes: ps.includeRenotedMyNotes,
						includeLocalRenotes: ps.includeLocalRenotes,
						withFiles: ps.withFiles,
						withRenotes: ps.withRenotes,
					}, me);
					deps.activeUsersChart.read(me);
					return await deps.noteEntityService.packMany(timeline, me);
				}
				const timeline = await deps.fanoutTimelineEndpointService.timeline({
					untilId,
					sinceId,
					limit: ps.limit,
					allowPartial: ps.allowPartial,
					me,
					useDbFallback: deps.serverSettings.enableFanoutTimelineDbFallback,
					redisTimelines: ps.withFiles ? [`userListTimelineWithFiles:${list.id}`] : [`userListTimeline:${list.id}`],
					alwaysIncludeMyNotes: true,
					excludePureRenotes: !ps.withRenotes,
					dbFallback: async (untilId, sinceId, limit) => await getFromDb(list, {
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
				deps.activeUsersChart.read(me);
				return timeline;
			})();
			return result.map(toPackedNote);
		});
}
