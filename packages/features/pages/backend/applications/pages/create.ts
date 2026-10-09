/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, MiDriveFile, PagesRepository } from '@features/persistence/backend/repositories/models.js';
import { PageEntityService } from '../../serializers/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { PageService } from '../../services/PageService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { pagesCreateInput, pagesCreateErrors } from '../../endpoints/pages/create.contract.js';

@Injectable()
export class PagesCreateApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
		private pageEntityService: PageEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof pagesCreateInput>, me: MiLocalUser) {
		let eyeCatchingImage: MiDriveFile | null = null;
		if (ps.eyeCatchingImageId != null) {
			eyeCatchingImage = await this.driveFilesRepository.findOneBy({
				id: ps.eyeCatchingImageId,
				userId: me.id,
			});

			if (eyeCatchingImage == null) {
				throw apiError(pagesCreateErrors.noSuchFile);
			}
		}

		await this.pagesRepository.findBy({
			userId: me.id,
			name: ps.name,
		}).then(result => {
			if (result.length > 0) {
				throw apiError(pagesCreateErrors.nameAlreadyExists);
			}
		});

		try {
			const page = await this.pageService.create(me, {
				...ps,
				eyeCatchingImage,
				summary: ps.summary ?? null,
			});

			return await this.pageEntityService.pack(page);
		} catch (err) {
			if (err instanceof IdentifiableError && err.id === '1a79e38e-3d83-4423-845b-a9d83ff93b61') {
				throw apiError(pagesCreateErrors.nameAlreadyExists);
			}
			throw err;
		}
	}
}
