/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { Brackets } from 'typeorm';

import * as v from 'valibot';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';
import { ChannelMutingService } from '../../services/ChannelMutingService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsTimelineContract, channelsTimelinePolicy, channelsTimelineErrors } from './timeline.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ChannelsRepository, MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
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

	return implement(channelsTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsTimelinePolicy))
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
				return v.parse(v.array(packedNoteSchema), await deps.noteEntityService.packMany(await getFromDb({ untilId, sinceId, limit: ps.limit, channelId: channel.id }, me), me));
			}
			return v.parse(v.array(packedNoteSchema), await deps.fanoutTimelineEndpointService.timeline({
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
			}));
		});
}
