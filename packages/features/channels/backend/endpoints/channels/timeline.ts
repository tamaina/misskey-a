/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { channelsTimelineContract, channelsTimelineErrors } from './timeline.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ChannelsRepository, MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type QueryService } from '@features/notes/backend/services/QueryService.js';
import { type NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { type ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { type IdService } from '@features/runtime/backend/services/IdService.js';
import { type FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { Brackets } from 'typeorm';

import { type ChannelMutingService } from '../../services/ChannelMutingService.js';

export interface ChannelsTimelineDependencies {
	serverSettings: MiMeta;
	notesRepository: NotesRepository;
	channelsRepository: ChannelsRepository;
	idService: IdService;
	noteEntityService: NoteEntityService;
	queryService: QueryService;
	fanoutTimelineEndpointService: FanoutTimelineEndpointService;
	activeUsersChart: ActiveUsersChart;
	channelMutingService: ChannelMutingService;
}
export function createChannelsTimelineProcedure<Actor extends MiLocalUser>(deps: ChannelsTimelineDependencies) {
	async function getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		channelId: string
	}, me: MiLocalUser | null) {
		//#region fallback to database
		const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere('note.channelId = :channelId', { channelId: ps.channelId })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('note.channel', 'channel');

		deps.queryService.generateBaseNoteFilteringQuery(query, me);
		if (me == null) deps.queryService.generateUgcVisibilityQueryForVisitor(query);

		if (me) {
			const mutingChannelIds = await deps.channelMutingService
				.list({ requestUserId: me.id }, { idOnly: true })
				.then(x => x.map(x => x.id).filter(x => x !== ps.channelId));
			if (mutingChannelIds.length > 0) {
				query.andWhere('note.channelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.renoteChannelId IS NULL');
					qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
				}));
			}
		}
		//#endregion

		return await query.limit(ps.limit).getMany();
	}

	return createApiProcedure<Actor>()(channelsTimelineContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const untilId = ps.untilId ?? (ps.untilDate ? deps.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? deps.idService.gen(ps.sinceDate!) : null);
			const channel = await deps.channelsRepository.findOneBy({
				id: ps.channelId,
			});
			if (channel == null) {
				throw apiError(channelsTimelineErrors.noSuchChannel);
			}
			if (me) deps.activeUsersChart.read(me);
			if (!deps.serverSettings.enableFanoutTimeline) {
				return (await deps.noteEntityService.packMany(await getFromDb({ untilId, sinceId, limit: ps.limit, channelId: channel.id }, me), me)).map(toPackedNote);
			}
			return (await deps.fanoutTimelineEndpointService.timeline({
				untilId,
				sinceId,
				limit: ps.limit,
				allowPartial: ps.allowPartial,
				me,
				useDbFallback: true,
				redisTimelines: [`channelTimeline:${channel.id}`],
				excludePureRenotes: false,
				ignoreAuthorChannelFromMute: true,
				dbFallback: async (untilId, sinceId, limit) => {
					return await getFromDb({ untilId, sinceId, limit, channelId: channel.id }, me);
				},
			})).map(toPackedNote);
		});
}
