/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { registryScopesWithDomainContract } from './scopes-with-domain.contract.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.dependencies.js';
export function createRegistryScopesWithDomainProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return implement(registryScopesWithDomainContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/scopes-with-domain', requireCredential: true, secure: true }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			return deps.registry.getAllScopeAndDomains(principal.id);
		});
}
