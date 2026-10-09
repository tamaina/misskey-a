/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { pagesDeleteContract, pagesDeleteErrors } from './delete.contract.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import type { PageService } from '../../services/PageService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagesDeleteDependencies {
	pageService: Pick<PageService, 'delete'>;
}
export function createPagesDeleteProcedure(deps: PagesDeleteDependencies) {
	return implement(pagesDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: pagesDeleteContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:pages' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			try {
				await deps.pageService.delete(me, ps.pageId);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '66aefd3c-fdb2-4a71-85ae-cc18bea85d3f') throw apiError(pagesDeleteErrors.noSuchPage);
					if (err.id === 'd0017699-8256-46f1-aed4-bc03bed73616') throw apiError(pagesDeleteErrors.accessDenied);
				}
				throw err;
			}
		});
}
