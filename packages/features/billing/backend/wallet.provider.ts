/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { createPostgresWalletChainStore } from './wallet-chain-store.js';
import { createResidenceStore } from './residence-store.js';
import { createWalletRouter } from './wallet.implementation.js';
import { createPostgresWalletStore } from './wallet-store.js';
import { createWalletAuthentication } from './wallet-authentication.js';
import { createWalletProof } from './wallet-service.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { DataSource } from 'typeorm';

@Injectable()
export class WalletApiProvider {
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		const get = <T>(token: symbol) => this.moduleRef.get<T>(token, { strict: false });
		const config = get<Config>(DI.config);
		const id = this.moduleRef.get(IdService, { strict: false });
		const authentication = createWalletAuthentication({
			profiles: get<UserProfilesRepository>(DI.userProfilesRepository),
			auth: this.moduleRef.get(UserAuthService, { strict: false }),
			passkeys: this.moduleRef.get(WebAuthnService, { strict: false }),
		});
		const chainSettings = createPostgresWalletChainStore(get<DataSource>(DI.db));
		return createWalletRouter<MiLocalUser>({
			requireResidence: createResidenceStore(get<DataSource>(DI.db)).require,
			...authentication, ...createWalletProof(this.moduleRef.get(HttpRequestService, { strict: false })),
			store: createPostgresWalletStore(get<DataSource>(DI.db)),
			origin: new URL(config.url).origin,
			id: now => id.gen(now), now: Date.now,
			chainSettings, chains: chainSettings.chains, rpcUrl: chainSettings.rpcUrl,
		});
	}
}
