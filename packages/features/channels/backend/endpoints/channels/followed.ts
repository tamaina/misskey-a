/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsFollowedContract, channelsFollowedPolicy, channelsFollowedInput, channelsFollowedOutput, channelsFollowedErrors } from './followed.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../operations.js';

import type { ChannelFollowingsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsFollowedProcedure<Actor extends ApiActor>() {
	return implement(channelsFollowedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsFollowedPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsFollowed(input, context.principal));
}

@Injectable()
export class ChannelsFollowedOperation {
	constructor(
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		private channelEntityService: ChannelEntityService,
		private queryService: QueryService,
	) {}
	async execute(ps: v.InferOutput<typeof channelsFollowedInput>, me: MiLocalUser): Promise<v.InferOutput<typeof channelsFollowedOutput>> {
		return v.parse(channelsFollowedOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof channelsFollowedInput>, me: MiLocalUser) {
		const query = this.queryService
			.makePaginationQuery(
				this.channelFollowingsRepository.createQueryBuilder(),
				ps.sinceId,
				ps.untilId,
				ps.sinceDate,
				ps.untilDate,
				'followeeId',
			)
			.andWhere({ followerId: me.id });

		const followings = await query
			.limit(ps.limit)
			.getMany();

		return await Promise.all(followings.map(x => this.channelEntityService.pack(x.followeeId, me)));
	}
}
