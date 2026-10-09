/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class DriveFilesCheckExistenceOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/check-existence'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const exist = await this.driveFilesRepository.exists({
			where: {
				md5: ps.md5,
				userId: me.id,
			},
		});

		return exist;
	}
}
