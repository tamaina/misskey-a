/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedChannel } from '../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { type RoleService } from '@features/roles/backend/services/RoleService.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { type ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { channelsUpdateContract, channelsUpdateErrors } from './update.contract.js';
import type { DriveFilesRepository, ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface ChannelsUpdateDependencies {
	channelsRepository: ChannelsRepository;
	driveFilesRepository: DriveFilesRepository;
	channelEntityService: ChannelEntityService;
	roleService: RoleService;
}
export function createChannelsUpdateProcedure<Actor extends MiLocalUser>(deps: ChannelsUpdateDependencies) {
	return createApiProcedure<Actor>()(channelsUpdateContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const channel = await deps.channelsRepository.findOneBy({
				id: ps.channelId,
			});

			if (channel == null) {
				throw apiError(channelsUpdateErrors.noSuchChannel);
			}

			const iAmModerator = await deps.roleService.isModerator(me);
			if (channel.userId !== me.id && !iAmModerator) {
				throw apiError(channelsUpdateErrors.accessDenied);
			}

			// eslint:disable-next-line:no-unnecessary-initializer
			let banner = undefined;
			if (ps.bannerId != null) {
				banner = await deps.driveFilesRepository.findOneBy({
					id: ps.bannerId,
					userId: me.id,
				});

				if (banner == null) {
					throw apiError(channelsUpdateErrors.noSuchFile);
				}
			} else if (ps.bannerId === null) {
				banner = null;
			}

			await deps.channelsRepository.update(channel.id, {
				...(ps.name !== undefined ? { name: ps.name } : {}),
				...(ps.description !== undefined ? { description: ps.description } : {}),
				...(ps.pinnedNoteIds !== undefined ? { pinnedNoteIds: ps.pinnedNoteIds } : {}),
				...(ps.color !== undefined ? { color: ps.color } : {}),
				...(typeof ps.isArchived === 'boolean' ? { isArchived: ps.isArchived } : {}),
				...(banner ? { bannerId: banner.id } : {}),
				...(typeof ps.isSensitive === 'boolean' ? { isSensitive: ps.isSensitive } : {}),
				...(typeof ps.allowRenoteToExternal === 'boolean' ? { allowRenoteToExternal: ps.allowRenoteToExternal } : {}),
			});
			return toPackedChannel(await deps.channelEntityService.pack(channel.id, me));
		});
}
