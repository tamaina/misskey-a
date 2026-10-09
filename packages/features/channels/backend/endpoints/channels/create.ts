/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type IdService } from '@features/runtime/backend/services/IdService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { channelsCreateContract, channelsCreateErrors } from './create.contract.js';
import type { ChannelsRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsCreateDependencies {
	driveFilesRepository: DriveFilesRepository;
	channelsRepository: ChannelsRepository;
	idService: IdService;
	channelEntityService: ChannelEntityService;
}
export function createChannelsCreateProcedure<Actor extends MiLocalUser>(deps: ChannelsCreateDependencies) {
	return createApiProcedure<Actor>()(channelsCreateContract)
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
			return toPackedChannel(await deps.channelEntityService.pack(channel, me));
		});
}
