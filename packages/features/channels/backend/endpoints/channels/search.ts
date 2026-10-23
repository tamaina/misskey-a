/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { Brackets } from 'typeorm';

import { type QueryService } from '@features/notes/backend/services/QueryService.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';

import { channelsSearchContract } from './search.contract.js';
import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsSearchDependencies {
	channelsRepository: ChannelsRepository;
	channelEntityService: ChannelEntityService;
	queryService: QueryService;
}
export function createChannelsSearchProcedure<Actor extends MiLocalUser>(deps: ChannelsSearchDependencies) {
	return createApiProcedure<Actor>()(channelsSearchContract)
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
			return (await Promise.all(channels.map(x => deps.channelEntityService.pack(x, me)))).map(toPackedChannel);
		});
}
