/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AccessTokensRepository, AppsRepository } from '@features/persistence/backend/repositories/models.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { MiApp } from '../models/App.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import { bindThis } from '@features/runtime/backend/decorators.js';

export class AppEntityService {
	constructor(
		private appsRepository: AppsRepository,

		private accessTokensRepository: AccessTokensRepository,
	) {
	}

	@bindThis
	public async pack(
		src: MiApp['id'] | MiApp,
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			detail?: boolean,
			includeSecret?: boolean,
			includeProfileImageIds?: boolean
		},
	): Promise<Packed<'App'>> {
		const opts = Object.assign({
			detail: false,
			includeSecret: false,
			includeProfileImageIds: false,
		}, options);

		const app = typeof src === 'object' ? src : await this.appsRepository.findOneByOrFail({ id: src });

		return {
			id: app.id,
			name: app.name,
			callbackUrl: app.callbackUrl,
			permission: app.permission,
			...(opts.includeSecret ? { secret: app.secret } : {}),
			...(me ? {
				isAuthorized: await this.accessTokensRepository.countBy({
					appId: app.id,
					userId: me.id,
				}).then(count => count > 0),
			} : {}),
		};
	}
}
