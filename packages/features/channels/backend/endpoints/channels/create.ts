/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsCreateContract, channelsCreatePolicy, channelsCreateErrors } from './create.contract.js';
import type { ChannelsRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsCreateDependencies {
	driveFilesRepository: DriveFilesRepository;
	channelsRepository: ChannelsRepository;
	idService: IdService;
	channelEntityService: ChannelEntityService;
}
export function createChannelsCreateProcedure<Actor extends MiLocalUser>(deps: ChannelsCreateDependencies) {
	return implement(channelsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsCreatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			let banner = null;
			if (ps.bannerId != null) {
				banner = await deps.driveFilesRepository.findOneBy({
					id: ps.bannerId,
					userId: me.id,
				});

				if (banner == null) {
					throw apiError(channelsCreateErrors.noSuchFile);
				}
			}

			const channel = await deps.channelsRepository.insertOne({
				id: deps.idService.gen(),
				userId: me.id,
				name: ps.name,
				description: ps.description ?? null,
				bannerId: banner ? banner.id : null,
				isSensitive: ps.isSensitive ?? false,
				...(ps.color !== undefined ? { color: ps.color } : {}),
				allowRenoteToExternal: ps.allowRenoteToExternal ?? true,
			});
			return v.parse(packedChannelSchema, await deps.channelEntityService.pack(channel, me));
		});
}
