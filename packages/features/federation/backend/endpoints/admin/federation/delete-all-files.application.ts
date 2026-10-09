/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '../../../../../persistence/backend/repositories/models.js';
import { DriveService } from '../../../../../drive/backend/services/DriveService.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminFederationDeleteAllFilesInput, AdminFederationDeleteAllFilesOutput } from './delete-all-files.contract.js';
import { adminFederationDeleteAllFilesContract } from './delete-all-files.contract.js';

@Injectable()
export class AdminFederationDeleteAllFilesApplicationService {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
	) {}

	public async execute(ps: AdminFederationDeleteAllFilesInput, _me: MiUser): Promise<AdminFederationDeleteAllFilesOutput> {
		const result = await (async () => {
			const files = await this.driveFilesRepository.findBy({
				userHost: ps.host,
			});

			for (const file of files) {
				this.driveService.deleteFile(file);
			}
		})();
		return v.parse(adminFederationDeleteAllFilesContract['~orpc'].outputSchema!, result);
	}
}
