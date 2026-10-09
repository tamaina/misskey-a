/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { packedChannelSchema } from '../../../channel.schema.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { ChannelMutingService } from '../../../services/ChannelMutingService.js';
import { ChannelEntityService } from '../../../serializers/ChannelEntityService.js';
import { channelsMuteListContract, channelsMuteListPolicy, channelsMuteListErrors } from './list.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../../operations.js';

import type { MiLocalUser } from '../../../../../users/backend/models/User.js';

export function createChannelsMuteListProcedure<Actor extends ApiActor>() {
	return implement(channelsMuteListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsMuteListPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsMuteList(input, context.principal));
}

@Injectable()
export class ChannelsMuteListOperation {
	constructor(
		private channelMutingService: ChannelMutingService,
		private channelEntityService: ChannelEntityService,
	) {}
	async execute(ps: v.InferOutput<NonNullable<typeof channelsMuteListContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<v.InferOutput<NonNullable<typeof channelsMuteListContract['~orpc']['outputSchema']>>> {
		return v.parse(v.array(packedChannelSchema), await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<NonNullable<typeof channelsMuteListContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const mutings = await this.channelMutingService.list({
			requestUserId: me.id,
		});
		return await this.channelEntityService.packMany(mutings, me);
	}
}
