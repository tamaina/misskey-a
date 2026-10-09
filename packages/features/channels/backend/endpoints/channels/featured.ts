/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { channelsFeaturedContract, channelsFeaturedPolicy, channelsFeaturedInput, channelsFeaturedOutput, channelsFeaturedErrors } from './featured.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../operations.js';

import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsFeaturedProcedure<Actor extends ApiActor>() {
	return implement(channelsFeaturedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsFeaturedPolicy))
		.handler(({ input, context }) => context.operations.channels.channelsFeatured(input, context.principal));
}

@Injectable()
export class ChannelsFeaturedOperation {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
	) {}
	async execute(ps: v.InferOutput<typeof channelsFeaturedInput>, me: MiLocalUser | null): Promise<v.InferOutput<typeof channelsFeaturedOutput>> {
		return v.parse(channelsFeaturedOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof channelsFeaturedInput>, me: MiLocalUser | null) {
		const query = this.channelsRepository.createQueryBuilder('channel')
			.where('channel.lastNotedAt IS NOT NULL')
			.andWhere('channel.isArchived = FALSE')
			.orderBy('channel.lastNotedAt', 'DESC');

		const channels = await query.limit(10).getMany();

		return await Promise.all(channels.map(x => this.channelEntityService.pack(x, me)));
	}
}
