/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { registryKeysContract } from './keys.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { PreferencesContext } from '../../../operations.js';

export function createRegistryKeysProcedure<Actor extends ApiActor>() {
	return implement(registryKeysContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PreferencesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/keys', requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.preferences.keys(input, context.principal, context.token));
}
