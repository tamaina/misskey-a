/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registryScopesWithDomainContract } from './scopes-with-domain.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
export function createRegistryScopesWithDomainProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return createApiProcedure<Actor>()(registryScopesWithDomainContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ context }) => {
			const principal = context.principal;
			return (await deps.registry.getAllScopeAndDomains(principal.id)).map(item => ({ domain: item.domain, scopes: item.scopes.map(scope => [...scope]) }));
		});
}
