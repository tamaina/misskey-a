/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import * as v from 'valibot';
import { packedChannelSchema } from '../../channel.schema.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsUpdateContract, channelsUpdatePolicy, channelsUpdateErrors } from './update.contract.js';
import type { DriveFilesRepository, ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface ChannelsUpdateDependencies {
	channelsRepository: ChannelsRepository;
	driveFilesRepository: DriveFilesRepository;
	channelEntityService: ChannelEntityService;
	roleService: RoleService;
}
export function createChannelsUpdateProcedure<Actor extends MiLocalUser>(deps: ChannelsUpdateDependencies) {
	return implement(channelsUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsUpdatePolicy))
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
			return v.parse(packedChannelSchema, await deps.channelEntityService.pack(channel.id, me));
		});
}
