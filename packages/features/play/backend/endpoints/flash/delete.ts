/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidFlashDeleteDefinition, voidFlashDeleteInput, voidFlashDeleteOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, UsersRepository } from '@/models/_.js';

import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(voidFlashDeleteDefinition);

export const meta = {
	tags: ['flashs'],

	requireCredential: true,

	kind: 'write:flash',

	errors: {
		noSuchFlash: {
			message: 'No such flash.',
			code: 'NO_SUCH_FLASH',
			id: 'de1623ef-bbb3-4289-a71e-14cfa83d9740',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '1036ad7b-9f92-4fff-89c3-0e50dc941704',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidFlashDeleteInput, typeof voidFlashDeleteOutput> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private moderationLogService: ModerationLogService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });

			if (flash == null) {
				throw new ApiError(meta.errors.noSuchFlash);
			}

			if (!await this.roleService.isModerator(me) && flash.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.flashsRepository.delete(flash.id);

			if (flash.userId !== me.id) {
				const user = await this.usersRepository.findOneByOrFail({ id: flash.userId });
				this.moderationLogService.log(me, 'deleteFlash', {
					flashId: flash.id,
					flashUserId: flash.userId,
					flashUserUsername: user.username,
					flash,
				});
			}
		});
	}
}
