/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { registryScopesWithDomainContract } from './scopes-with-domain.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { PreferencesContext } from '../../../operations.js';

export function createRegistryScopesWithDomainProcedure<Actor extends ApiActor>() {
	return implement(registryScopesWithDomainContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PreferencesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/scopes-with-domain', requireCredential: true, secure: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.preferences.scopesWithDomain(input, context.principal, context.token));
}
