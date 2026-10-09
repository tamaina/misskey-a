/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsShowContract, channelsShowPolicy, channelsShowErrors } from './show.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../operations.js';

import type { ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsShowProcedure<Actor extends ApiActor>() {
	return implement(channelsShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsShowPolicy))
		.handler(({ input, context }) => context.operations.channels.channelsShow(input, context.principal));
}

@Injectable()
export class ChannelsShowOperation {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private channelEntityService: ChannelEntityService,
	) {}
	async execute(ps: v.InferOutput<NonNullable<typeof channelsShowContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<v.InferOutput<NonNullable<typeof channelsShowContract['~orpc']['outputSchema']>>> {
		return v.parse(packedChannelSchema, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<NonNullable<typeof channelsShowContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const channel = await this.channelsRepository.findOneBy({
			id: ps.channelId,
		});

		if (channel == null) {
			throw apiError(channelsShowErrors.noSuchChannel);
		}

		return await this.channelEntityService.pack(channel, me, true);
	}
}
