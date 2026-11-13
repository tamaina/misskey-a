/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { BrowserSessionService } from '../services/BrowserSessionService.js';
import type { BrowserSessionIdentity } from '@features/api/backend/transport/context.js';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AccessTokensRepository, AppsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { MemoryKVCache } from '@features/runtime/backend/cache/cache.js';
import type { MiApp } from '@features/auth/backend/models/App.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { isNativeUserToken } from '../utility/token.js';
import { bindThis } from '@features/runtime/backend/decorators.js';

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

@Injectable()
export class AuthenticateService implements OnApplicationShutdown {
	private appCache: MemoryKVCache<MiApp>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private cacheService: CacheService,
		private browserSessionService: BrowserSessionService,
	) {
		this.appCache = new MemoryKVCache<MiApp>(1000 * 60 * 60 * 24 * 7); // 1w
	}

	@bindThis
	public async authenticate(token: string | null | undefined): Promise<[MiLocalUser | null, MiAccessToken | null, BrowserSessionIdentity?]> {
		if (token == null) {
			return [null, null];
		}

		if (token.startsWith('bs_')) {
			const session = await this.browserSessionService.verify(token);
			if (!session) throw new AuthenticationError('invalid browser session');
			// Browser credentials never borrow the legacy user cache or app scopes.
			const user = await this.usersRepository.findOneBy({ id: session.userId, host: IsNull(), isSuspended: false, isDeleted: false }) as MiLocalUser | null;
			if (!user || user.host !== null || user.isSuspended || user.isDeleted) throw new AuthenticationError('local user not found');
			return [user, null, { id: session.id, userId: session.userId }];
		}

		if (isNativeUserToken(token)) {
			const user = await this.cacheService.localUserByNativeTokenCache.fetch(token,
				() => this.usersRepository.findOneBy({ token }) as Promise<MiLocalUser | null>);

			if (user == null) {
				throw new AuthenticationError('user not found');
			}

			return [user, null];
		} else {
			const accessToken = await this.accessTokensRepository.findOne({
				where: [{
					hash: token.toLowerCase(), // app
				}, {
					token: token, // miauth
				}],
			});

			if (accessToken == null) {
				throw new AuthenticationError('invalid signature');
			}

			this.accessTokensRepository.update(accessToken.id, {
				lastUsedAt: new Date(),
			});

			const user = await this.cacheService.localUserByIdCache.fetch(accessToken.userId,
				() => this.usersRepository.findOneBy({
					id: accessToken.userId,
				}) as Promise<MiLocalUser>);

			if (accessToken.appId) {
				const app = await this.appCache.fetch(accessToken.appId,
					() => this.appsRepository.findOneByOrFail({ id: accessToken.appId! }));

				return [user, {
					id: accessToken.id,
					permission: app.permission,
				} as MiAccessToken];
			} else {
				return [user, accessToken];
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.appCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
