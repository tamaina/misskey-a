/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { DeleteAccountService } from '../../../services/DeleteAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class AdminAccountsDeleteOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private deleteAccoountService: DeleteAccountService,
	) {
	}

	async execute(ps: UsersInputs['admin/accounts/delete'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const user = await this.usersRepository.findOneBy({ id: ps.userId });

		if (user == null) {
			throw new Error('user not found');
		}

		await this.deleteAccoountService.deleteAccount(user, me);
	}
}
