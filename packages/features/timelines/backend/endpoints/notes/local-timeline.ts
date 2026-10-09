/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';

import { notesLocalTimelineContract, notesLocalTimelineErrors } from './local-timeline.contract.js';
import { Brackets } from 'typeorm';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { FanoutTimelineEndpointService } from '../../services/FanoutTimelineEndpointService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';

export interface NotesLocalTimelineDependencies {
	serverSettings: MiMeta;
	notesRepository: NotesRepository;
	noteEntityService: NoteEntityService;
	roleService: RoleService;
	activeUsersChart: ActiveUsersChart;
	idService: IdService;
	fanoutTimelineEndpointService: FanoutTimelineEndpointService;
	queryService: QueryService;
	channelMutingService: ChannelMutingService;
}
export function createNotesLocalTimelineProcedure<Actor extends MiLocalUser>(deps: NotesLocalTimelineDependencies) {
	async function getFromDb(ps: {
		sinceId: string | null,
		untilId: string | null,
		limit: number,
		withFiles: boolean,
		withReplies: boolean,
	}, me: MiLocalUser | null) {
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'),
			ps.sinceId, ps.untilId)
			.andWhere('(note.visibility = \'public\') AND (note.userHost IS NULL) AND (note.channelId IS NULL)')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');
		deps.queryService.generateVisibilityQuery(query, me);
		deps.queryService.generateBaseNoteFilteringQuery(query, me);
		if (me) {
			deps.queryService.generateMutedUserRenotesQueryForNotes(query, me);
			const mutedChannelIds = await deps.channelMutingService
				.list({ requestUserId: me.id }, { idOnly: true })
				.then(x => x.map(x => x.id));
			if (mutedChannelIds.length > 0) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.renoteChannelId IS NULL')
						.orWhere('note.renoteChannelId NOT IN (:...mutedChannelIds)', { mutedChannelIds });
				}));
			}
		}
		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
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
		return await query.limit(ps.limit).getMany();
	}

	return createApiProcedure<Actor>()(notesLocalTimelineContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
				const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
				const policies = await deps.roleService.getUserPolicies(me ? me.id : null);
				if (!policies.ltlAvailable) {
					throw apiError(notesLocalTimelineErrors.ltlDisabled);
				}
				if (ps.withReplies && ps.withFiles) throw apiError(notesLocalTimelineErrors.bothWithRepliesAndWithFiles);
				if (!deps.serverSettings.enableFanoutTimeline) {
					const timeline = await getFromDb({
						untilId,
						sinceId,
						limit: ps.limit,
						withFiles: ps.withFiles,
						withReplies: ps.withReplies,
					}, me);
					process.nextTick(() => {
						if (me) {
							deps.activeUsersChart.read(me);
						}
					});
					return await deps.noteEntityService.packMany(timeline, me);
				}
				const timeline = await deps.fanoutTimelineEndpointService.timeline({
					untilId,
					sinceId,
					limit: ps.limit,
					allowPartial: ps.allowPartial,
					me,
					useDbFallback: deps.serverSettings.enableFanoutTimelineDbFallback,
					redisTimelines:
						ps.withFiles ? ['localTimelineWithFiles']
							: ps.withReplies ? ['localTimeline', 'localTimelineWithReplies']
								: me ? ['localTimeline', `localTimelineWithReplyTo:${me.id}`]
									: ['localTimeline'],
					alwaysIncludeMyNotes: true,
					excludePureRenotes: !ps.withRenotes,
					dbFallback: async (untilId, sinceId, limit) => await getFromDb({
						untilId,
						sinceId,
						limit,
						withFiles: ps.withFiles,
						withReplies: ps.withReplies,
					}, me),
				});
				process.nextTick(() => {
					if (me) {
						deps.activeUsersChart.read(me);
					}
				});
				return timeline;
			})();
			return result.map(toPackedNote);
		});
}
