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
import { adminFederationDeleteAllFilesInput, adminFederationDeleteAllFilesOutput } from './delete-all-files.contract.js';

@Injectable()
export class AdminFederationDeleteAllFilesApplicationService {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminFederationDeleteAllFilesInput>, _me: MiUser): Promise<v.InferOutput<typeof adminFederationDeleteAllFilesOutput>> {
		const result = await (async () => {
			const files = await this.driveFilesRepository.findBy({
				userHost: ps.host,
			});

			for (const file of files) {
				this.driveService.deleteFile(file);
			}
		})();
		return v.parse(adminFederationDeleteAllFilesOutput, result);
	}
}
