/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AuthSessionsRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { MiAuthSession } from '../models/AuthSession.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import { bindThis } from '@/decorators.js';
import type { AppEntityService } from './AppEntityService.js';

export class AuthSessionEntityService {
	constructor(
		private authSessionsRepository: AuthSessionsRepository,

		private appEntityService: Pick<AppEntityService, 'pack'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiAuthSession['id'] | MiAuthSession,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const session = typeof src === 'object' ? src : await this.authSessionsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: session.id,
			app: this.appEntityService.pack(session.appId, me),
			token: session.token,
		});
	}
}
