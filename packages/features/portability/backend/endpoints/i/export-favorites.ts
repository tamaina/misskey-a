/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { iExportFavoritesContract } from './export-favorites.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.implementation.js';
export function createIExportFavoritesProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'createExportFavoritesJob'>) {
	return implement(iExportFavoritesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': iExportFavoritesContract['~orpc'].meta.requestName, 'requireCredential': true, 'secure': true, 'limit': { 'duration': 86400000, 'max': 1 } })).use(requirePrincipal<Actor>())
		.handler(async ({ context }) => {
			const actor = context.principal;
			deps.createExportFavoritesJob({ id: actor.id });
		});
}
