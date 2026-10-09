/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { pagesShowContract, pagesShowErrors } from './show.contract.js';
import { IsNull } from 'typeorm';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';
import type { MiPage } from '../../models/Page.js';
import type { PageEntityService } from '../../serializers/PageEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
/** Legacy competing selectors pass their original JSON pageId directly to TypeORM. */
export interface PagesSelectorRepository {
	findOneBy(selector: { id: PackedJsonValue | undefined } | { name: string; userId: string }): Promise<MiPage | null>;
}
export interface PagesShowDependencies {
	usersRepository: Pick<UsersRepository, 'findOneBy'>;
	pagesSelectorRepository: Pick<PagesSelectorRepository, 'findOneBy'>;
	pageEntityService: Pick<PageEntityService, 'pack'>;
}
export function createPagesShowProcedure(deps: PagesShowDependencies) {
	return implement(pagesShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: pagesShowContract['~orpc'].meta.requestName }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			let page: MiPage | null = null;
			if ('pageId' in ps) {
				page = await deps.pagesSelectorRepository.findOneBy({ id: ps.pageId });
			} else {
				const author = await deps.usersRepository.findOneBy({
					host: IsNull(),
					usernameLower: ps.username.toLowerCase(),
				});
				if (author) {
					page = await deps.pagesSelectorRepository.findOneBy({
						name: ps.name,
						userId: author.id,
					});
				}
			}
			if (page == null) {
				throw apiError(pagesShowErrors.noSuchPage);
			}
			return await deps.pageEntityService.pack(page, me);
		});
}
