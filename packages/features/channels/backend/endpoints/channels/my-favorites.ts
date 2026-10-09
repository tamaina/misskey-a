/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsMyFavoritesContract, channelsMyFavoritesPolicy, channelsMyFavoritesErrors } from './my-favorites.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../operations.js';

import type { ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsMyFavoritesProcedure<Actor extends ApiActor>() {
	return implement(channelsMyFavoritesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMyFavoritesPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsMyFavorites(input, context.principal));
}

@Injectable()
export class ChannelsMyFavoritesOperation {
	constructor(
		@Inject(DI.channelFavoritesRepository)
		private channelFavoritesRepository: ChannelFavoritesRepository,

		private channelEntityService: ChannelEntityService,
	) {}
	async execute(ps: v.InferOutput<NonNullable<typeof channelsMyFavoritesContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<v.InferOutput<NonNullable<typeof channelsMyFavoritesContract['~orpc']['outputSchema']>>> {
		return v.parse(v.array(packedChannelSchema), await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<NonNullable<typeof channelsMyFavoritesContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const query = this.channelFavoritesRepository.createQueryBuilder('favorite')
			.andWhere('favorite.userId = :meId', { meId: me.id })
			.leftJoinAndSelect('favorite.channel', 'channel');

		const favorites = await query
			.getMany();

		return await Promise.all(favorites.map(x => this.channelEntityService.pack(x.channel!, me)));
	}
}
