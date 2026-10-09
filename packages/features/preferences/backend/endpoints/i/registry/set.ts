/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { PreferencesContext } from '../../../operations.js';
import { registrySetContract } from './set.contract.js';

export function createRegistrySetProcedure<Actor extends ApiActor>() {
	return implement(registrySetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PreferencesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/set', requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.preferences.set(input, context.principal, context.token));
}
