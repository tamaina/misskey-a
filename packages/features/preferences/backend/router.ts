/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { preferencesContract } from './api.contract.js';
import { createRegistryGetProcedure } from './endpoints/i/registry/get.js';
import { createRegistryGetAllProcedure } from './endpoints/i/registry/get-all.js';
import { createRegistryGetDetailProcedure } from './endpoints/i/registry/get-detail.js';
import { createRegistryKeysProcedure } from './endpoints/i/registry/keys.js';
import { createRegistryKeysWithTypeProcedure } from './endpoints/i/registry/keys-with-type.js';
import { createRegistryRemoveProcedure } from './endpoints/i/registry/remove.js';
import { createRegistryScopesWithDomainProcedure } from './endpoints/i/registry/scopes-with-domain.js';
import { createRegistrySetProcedure } from './endpoints/i/registry/set.js';
import type { PreferencesContext } from './operations.js';
import type { ApiActor } from '../../api/backend/transport/context.js';

export function createPreferencesRouter<Actor extends ApiActor>() {
	return implement(preferencesContract).$context<PreferencesContext<Actor>>().router({
		get: createRegistryGetProcedure<Actor>(),
		getAll: createRegistryGetAllProcedure<Actor>(),
		getDetail: createRegistryGetDetailProcedure<Actor>(),
		keys: createRegistryKeysProcedure<Actor>(),
		keysWithType: createRegistryKeysWithTypeProcedure<Actor>(),
		remove: createRegistryRemoveProcedure<Actor>(),
		scopesWithDomain: createRegistryScopesWithDomainProcedure<Actor>(),
		set: createRegistrySetProcedure<Actor>(),
	});
}
