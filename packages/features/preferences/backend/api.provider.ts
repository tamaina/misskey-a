/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RegistryApiService } from '@features/preferences/backend/services/RegistryApiService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createPreferencesRouter } from './router.js';
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
