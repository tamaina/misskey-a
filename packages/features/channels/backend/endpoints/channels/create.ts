/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsCreateContract, channelsCreatePolicy, channelsCreateErrors } from './create.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../operations.js';

import type { ChannelsRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsCreateProcedure<Actor extends ApiActor>() {
	return implement(channelsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsCreatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsCreate(input, context.principal));
}

@Injectable()
export class ChannelsCreateOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private idService: IdService,
		private channelEntityService: ChannelEntityService,
	) {}
	async execute(ps: v.InferOutput<NonNullable<typeof channelsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<v.InferOutput<NonNullable<typeof channelsCreateContract['~orpc']['outputSchema']>>> {
		return v.parse(packedChannelSchema, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<NonNullable<typeof channelsCreateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		let banner = null;
		if (ps.bannerId != null) {
			banner = await this.driveFilesRepository.findOneBy({
				id: ps.bannerId,
				userId: me.id,
			});

			if (banner == null) {
				throw apiError(channelsCreateErrors.noSuchFile);
			}
		}

		const channel = await this.channelsRepository.insertOne({
			id: this.idService.gen(),
			userId: me.id,
			name: ps.name,
			description: ps.description ?? null,
			bannerId: banner ? banner.id : null,
			isSensitive: ps.isSensitive ?? false,
			...(ps.color !== undefined ? { color: ps.color } : {}),
			allowRenoteToExternal: ps.allowRenoteToExternal ?? true,
		});

		return await this.channelEntityService.pack(channel, me);
	}
}
