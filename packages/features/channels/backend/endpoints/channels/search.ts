/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { DI } from '@/di-symbols.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { channelsSearchContract, channelsSearchPolicy, channelsSearchErrors } from './search.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import type { ChannelsApiContext } from '../../operations.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsSearchProcedure<Actor extends ApiActor>() {
	return implement(channelsSearchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsSearchPolicy))
		.handler(({ input, context }) => context.operations.channels.channelsSearch(input, context.principal));
}

@Injectable()
export class ChannelsSearchOperation {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
		private queryService: QueryService,
	) {}
	async execute(ps: v.InferOutput<NonNullable<typeof channelsSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<v.InferOutput<NonNullable<typeof channelsSearchContract['~orpc']['outputSchema']>>> {
		return v.parse(v.array(packedChannelSchema), await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<NonNullable<typeof channelsSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.channelsRepository.createQueryBuilder('channel'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('channel.isArchived = FALSE');

		if (ps.query !== '') {
			if (ps.type === 'nameAndDescription') {
				query.andWhere(new Brackets(qb => {
					qb
						.where('channel.name ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` })
						.orWhere('channel.description ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` });
				}));
			} else {
				query.andWhere('channel.name ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` });
			}
		}

		const channels = await query
			.limit(ps.limit)
			.getMany();

		return await Promise.all(channels.map(x => this.channelEntityService.pack(x, me)));
	}
}
