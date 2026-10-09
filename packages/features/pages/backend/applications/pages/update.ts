/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, MiDriveFile } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { PageService } from '../../services/PageService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { pagesUpdateInput, pagesUpdateErrors } from '../../endpoints/pages/update.contract.js';

@Injectable()
export class PagesUpdateApplicationService {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
	) {}

	async execute(ps: v.InferOutput<typeof pagesUpdateInput>, me: MiLocalUser) {
		try {
			let eyeCatchingImage: MiDriveFile | null | undefined | string = ps.eyeCatchingImageId;
			if (eyeCatchingImage != null) {
				eyeCatchingImage = await this.driveFilesRepository.findOneBy({
					id: eyeCatchingImage,
					userId: me.id,
				});

				if (eyeCatchingImage == null) {
					throw apiError(pagesUpdateErrors.noSuchFile);
				}
			}

			await this.pageService.update(me, ps.pageId, {
				...ps,
				eyeCatchingImage,
			});
		} catch (err) {
			if (err instanceof IdentifiableError) {
				if (err.id === '66aefd3c-fdb2-4a71-85ae-cc18bea85d3f') throw apiError(pagesUpdateErrors.noSuchPage);
				if (err.id === 'd0017699-8256-46f1-aed4-bc03bed73616') throw apiError(pagesUpdateErrors.accessDenied);
				if (err.id === 'd05bfe24-24b6-4ea2-a3ec-87cc9bf4daa4') throw apiError(pagesUpdateErrors.nameAlreadyExists);
			}
			throw err;
		}
	}
}
