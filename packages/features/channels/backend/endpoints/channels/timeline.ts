/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedChannelsTimelineDefinition, packedChannelsTimelineInput, packedChannelsTimelineOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ChannelsRepository, MiMeta, NotesRepository } from '@/models/_.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { MiLocalUser } from '@features/users/backend/models/User.js';
import { ChannelMutingService } from '../../services/ChannelMutingService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { Brackets } from 'typeorm';

const contractProjection = projectEndpointContract(packedChannelsTimelineDefinition);

export const meta = {
	tags: ['notes', 'channels'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '4d0eeeba-a02c-4c3c-9966-ef60d38d2e7f',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedChannelsTimelineInput, typeof packedChannelsTimelineOutput> {
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
	) {
		super(meta, contractProjection, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const channel = await this.channelsRepository.findOneBy({
				id: ps.channelId,
			});

			if (channel == null) {
				throw new ApiError(meta.errors.noSuchChannel);
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
