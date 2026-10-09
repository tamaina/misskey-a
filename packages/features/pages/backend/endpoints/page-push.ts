/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../api/backend/transport/context.js';
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
	return implement(pagePushContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: pagePushContract['~orpc'].meta.requestName, requireCredential: true, secure: true }))
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
