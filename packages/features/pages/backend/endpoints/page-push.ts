/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '../../../api/backend/transport/middleware.js';

import { pagePushContract, pagePushErrors } from './page-push.contract.js';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface PagePushDependencies {
	pagesRepository: Pick<PagesRepository, 'findOneBy'>;
	userEntityService: Pick<UserEntityService, 'pack'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createPagePushProcedure(deps: PagePushDependencies) {
	return createApiProcedure<MiLocalUser>()(pagePushContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const page = await deps.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw apiError(pagePushErrors.noSuchPage);
			}
			deps.globalEventService.publishMainStream(page.userId, 'pageEvent', {
				pageId: ps.pageId,
				event: ps.event,
				var: ps.var,
				userId: me.id,
				user: await deps.userEntityService.pack(me.id, { id: page.userId }, {
					schema: 'UserDetailed',
				}),
			});
		});
}
