/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { Brackets } from 'typeorm';

import * as v from 'valibot';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';
import { DI } from '@/di-symbols.js';
import { ChannelMutingService } from '../../services/ChannelMutingService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsTimelineContract, channelsTimelinePolicy, channelsTimelineErrors } from './timeline.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ChannelsRepository, MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { ChannelsApiContext } from '../../operations.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';

export function createChannelsTimelineProcedure<Actor extends ApiActor>() {
	return implement(channelsTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsTimelinePolicy))
		.handler(({ input, context }) => context.operations.channels.channelsTimeline(input, context.principal));
}

@Injectable()
export class ChannelsTimelineOperation {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private idService: IdService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private fanoutTimelineEndpointService: FanoutTimelineEndpointService,
		private activeUsersChart: ActiveUsersChart,
		private channelMutingService: ChannelMutingService,
	) {}
	async execute(ps: v.InferOutput<NonNullable<typeof channelsTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<v.InferOutput<NonNullable<typeof channelsTimelineContract['~orpc']['outputSchema']>>> {
		return v.parse(v.array(packedNoteSchema), await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<NonNullable<typeof channelsTimelineContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

		const channel = await this.channelsRepository.findOneBy({
			id: ps.channelId,
		});

		if (channel == null) {
			throw apiError(channelsTimelineErrors.noSuchChannel);
		}

		if (me) this.activeUsersChart.read(me);

		if (!this.serverSettings.enableFanoutTimeline) {
			return await this.noteEntityService.packMany(await this.getFromDb({ untilId, sinceId, limit: ps.limit, channelId: channel.id }, me), me);
		}

		return await this.fanoutTimelineEndpointService.timeline({
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
				return await this.getFromDb({ untilId, sinceId, limit, channelId: channel.id }, me);
			},
		});
	}

	private async getFromDb(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		channelId: string
	}, me: MiLocalUser | null) {
		//#region fallback to database
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.andWhere('note.channelId = :channelId', { channelId: ps.channelId })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('note.channel', 'channel');

		this.queryService.generateBaseNoteFilteringQuery(query, me);
		if (me == null) this.queryService.generateUgcVisibilityQueryForVisitor(query);

		if (me) {
			const mutingChannelIds = await this.channelMutingService
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
}
