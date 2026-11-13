/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { RegistryJsonValue } from './endpoints/i/registry/registry.schema.js';
import { implement } from '@orpc/server';
import { preferencesContract } from './api.definition.js';
import { createRegistryGetProcedure } from './endpoints/i/registry/get.js';
import { createRegistryGetAllProcedure } from './endpoints/i/registry/get-all.js';
import { createRegistryGetDetailProcedure } from './endpoints/i/registry/get-detail.js';
import { createRegistryKeysProcedure } from './endpoints/i/registry/keys.js';
import { createRegistryKeysWithTypeProcedure } from './endpoints/i/registry/keys-with-type.js';
import { createRegistryRemoveProcedure } from './endpoints/i/registry/remove.js';
import { createRegistryScopesWithDomainProcedure } from './endpoints/i/registry/scopes-with-domain.js';
import { createRegistrySetProcedure } from './endpoints/i/registry/set.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { RegistryApiService } from '@features/preferences/backend/services/RegistryApiService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export interface PreferencesRegistryItem {
	key: string;
	value: RegistryJsonValue;
	updatedAt: Date;
}

export interface PreferencesRegistry {
	getItem(userId: string, domain: string | null, scope: string[], key: string): Promise<PreferencesRegistryItem | null>;
	getAllItemsOfScope(userId: string, domain: string | null, scope: string[]): Promise<PreferencesRegistryItem[]>;
	getAllKeysOfScope(userId: string, domain: string | null, scope: string[]): Promise<string[]>;
	getAllScopeAndDomains(userId: string): Promise<{
		domain: string | null;
		scopes: string[][];
	}[]>;
	remove(userId: string, domain: string | null, scope: string[], key: string): Promise<void>;
	set(userId: string, domain: string | null, scope: string[], key: string, value: RegistryJsonValue): Promise<void>;
}

export interface PreferencesDependencies {
	registry: PreferencesRegistry;
}

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

type PreferencesRouter = ReturnType<typeof createPreferencesRouter<MiLocalUser>>;

@Injectable()
export class PreferencesApiProvider {
	private router: PreferencesRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): PreferencesRouter {
		if (this.router !== undefined) return this.router;
		const moduleRef = this.moduleRef;
		const registry = moduleRef.get(RegistryApiService, { strict: false });
		this.router = createPreferencesRouter<MiLocalUser>({ registry });
		return this.router;
	}
}
