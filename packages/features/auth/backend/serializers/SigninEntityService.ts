/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { MiSignin } from '../models/Signin.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';

export class SigninEntityService {
	constructor(
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiSignin,
	) {
		return {
			id: src.id,
			createdAt: this.idService.parse(src.id).date.toISOString(),
			ip: src.ip,
			headers: src.headers,
			success: src.success,
		};
	}
}
