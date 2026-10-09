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
import type { PreferencesDependencies } from './api.dependencies.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
export function createPreferencesRouter<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return implement(preferencesContract).$context<ApiContext<Actor>>().router({
		get: createRegistryGetProcedure<Actor>(deps),
		getAll: createRegistryGetAllProcedure<Actor>(deps),
		getDetail: createRegistryGetDetailProcedure<Actor>(deps),
		keys: createRegistryKeysProcedure<Actor>(deps),
		keysWithType: createRegistryKeysWithTypeProcedure<Actor>(deps),
		remove: createRegistryRemoveProcedure<Actor>(deps),
		scopesWithDomain: createRegistryScopesWithDomainProcedure<Actor>(deps),
		set: createRegistrySetProcedure<Actor>(deps),
	});
}
