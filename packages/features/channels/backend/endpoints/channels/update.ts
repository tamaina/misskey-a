/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { ChannelEntityService } from '../../serializers/ChannelEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { channelsUpdateContract, channelsUpdatePolicy, channelsUpdateInput, channelsUpdateOutput, channelsUpdateErrors } from './update.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { ChannelsApiContext } from '../../operations.js';

import type { DriveFilesRepository, ChannelsRepository } from '@features/persistence/backend/repositories/models.js';

import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createChannelsUpdateProcedure<Actor extends ApiActor>() {
	return implement(channelsUpdateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ChannelsApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(channelsUpdatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.channels.channelsUpdate(input, context.principal));
}

@Injectable()
export class ChannelsUpdateOperation {
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private channelEntityService: ChannelEntityService,

		private roleService: RoleService,
	) {}
	async execute(ps: v.InferOutput<typeof channelsUpdateInput>, me: MiLocalUser): Promise<v.InferOutput<typeof channelsUpdateOutput>> {
		return v.parse(channelsUpdateOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof channelsUpdateInput>, me: MiLocalUser) {
		const channel = await this.channelsRepository.findOneBy({
			id: ps.channelId,
		});

		if (channel == null) {
			throw apiError(channelsUpdateErrors.noSuchChannel);
		}

		const iAmModerator = await this.roleService.isModerator(me);
		if (channel.userId !== me.id && !iAmModerator) {
			throw apiError(channelsUpdateErrors.accessDenied);
		}

		// eslint:disable-next-line:no-unnecessary-initializer
		let banner = undefined;
		if (ps.bannerId != null) {
			banner = await this.driveFilesRepository.findOneBy({
				id: ps.bannerId,
				userId: me.id,
			});

			if (banner == null) {
				throw apiError(channelsUpdateErrors.noSuchFile);
			}
		} else if (ps.bannerId === null) {
			banner = null;
		}

		await this.channelsRepository.update(channel.id, {
			...(ps.name !== undefined ? { name: ps.name } : {}),
			...(ps.description !== undefined ? { description: ps.description } : {}),
			...(ps.pinnedNoteIds !== undefined ? { pinnedNoteIds: ps.pinnedNoteIds } : {}),
			...(ps.color !== undefined ? { color: ps.color } : {}),
			...(typeof ps.isArchived === 'boolean' ? { isArchived: ps.isArchived } : {}),
			...(banner ? { bannerId: banner.id } : {}),
			...(typeof ps.isSensitive === 'boolean' ? { isSensitive: ps.isSensitive } : {}),
			...(typeof ps.allowRenoteToExternal === 'boolean' ? { allowRenoteToExternal: ps.allowRenoteToExternal } : {}),
		});

		return await this.channelEntityService.pack(channel.id, me);
	}
}
