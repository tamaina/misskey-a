/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { flashDeleteInput, flashDeleteErrors } from '../../endpoints/flash/delete.contract.js';

@Injectable()
export class FlashDeleteApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private moderationLogService: ModerationLogService,
		private roleService: RoleService,
	) {}

	async execute(ps: v.InferOutput<typeof flashDeleteInput>, me: MiLocalUser) {
		const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });

		if (flash == null) {
			throw apiError(flashDeleteErrors.noSuchFlash);
		}

		if (!await this.roleService.isModerator(me) && flash.userId !== me.id) {
			throw apiError(flashDeleteErrors.accessDenied);
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
	}
}
