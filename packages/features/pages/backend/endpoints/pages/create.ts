/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { pagesCreateContract, pagesCreateErrors } from './create.contract.js';
import type { DriveFilesRepository, MiDriveFile, PagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { PageEntityService } from '../../serializers/PageEntityService.js';
import type { PageService } from '../../services/PageService.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagesCreateDependencies {
	pagesRepository: Pick<PagesRepository, 'findBy'>;
	driveFilesRepository: Pick<DriveFilesRepository, 'findOneBy'>;
	pageService: Pick<PageService, 'create'>;
	pageEntityService: Pick<PageEntityService, 'pack'>;
}
export function createPagesCreateProcedure(deps: PagesCreateDependencies) {
	return implement(pagesCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: pagesCreateContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:pages', prohibitMoved: true, limit: { duration: 3_600_000, max: 10 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			let eyeCatchingImage: MiDriveFile | null = null;
			if (ps.eyeCatchingImageId != null) {
				eyeCatchingImage = await deps.driveFilesRepository.findOneBy({
					id: ps.eyeCatchingImageId,
					userId: me.id,
				});
				if (eyeCatchingImage == null) {
					throw apiError(pagesCreateErrors.noSuchFile);
				}
			}
			await deps.pagesRepository.findBy({
				userId: me.id,
				name: ps.name,
			}).then(result => {
				if (result.length > 0) {
					throw apiError(pagesCreateErrors.nameAlreadyExists);
				}
			});
			try {
				const page = await deps.pageService.create(me, {
					...ps,
					eyeCatchingImage,
					summary: ps.summary ?? null,
				});
				return await deps.pageEntityService.pack(page);
			} catch (err) {
				if (err instanceof IdentifiableError && err.id === '1a79e38e-3d83-4423-845b-a9d83ff93b61') {
					throw apiError(pagesCreateErrors.nameAlreadyExists);
				}
				throw err;
			}
		});
}
