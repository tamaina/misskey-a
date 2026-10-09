/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Brackets } from 'typeorm';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { channelsSearchContract, channelsSearchPolicy } from './search.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsSearchDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
	queryService: QueryService;
}
export function createChannelsSearchProcedure<Actor extends MiLocalUser>(deps: ChannelsSearchDependencies) {
	return implement(channelsSearchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsSearchPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.channelsRepository.createQueryBuilder('channel'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('channel.isArchived = FALSE');

			if (ps.query !== '') {
				if (ps.type === 'nameAndDescription') {
					query.andWhere(new Brackets(qb => {
						qb
							.where('channel.name ILIKE :q', { q: `%${sqlLikeEscape(ps.query)}%` })
							.orWhere('channel.description ILIKE :q', { q: `%${sqlLikeEscape(ps.query)}%` });
					}));
				} else {
					query.andWhere('channel.name ILIKE :q', { q: `%${sqlLikeEscape(ps.query)}%` });
				}
			}

			const channels = await query
				.limit(ps.limit)
				.getMany();
			return v.parse(v.array(packedChannelSchema), await Promise.all(channels.map(x => deps.channelEntityService.pack(x, me))));
		});
}
