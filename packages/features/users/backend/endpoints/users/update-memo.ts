/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { usersUpdateMemoErrors } from './update-memo.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UserMemoRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class UsersUpdateMemoOperation {
	constructor(
		@Inject(DI.userMemosRepository)
		private userMemosRepository: UserMemoRepository,
		private getterService: GetterService,
		private idService: IdService,
	) {
	}

	async execute(ps: UsersInputs['users/update-memo'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		// Get target
		const target = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(usersUpdateMemoErrors.noSuchUser);
			throw err;
		});

		// 引数がnullか空文字であれば、パーソナルメモを削除する
		if (ps.memo === '' || ps.memo == null) {
			await this.userMemosRepository.delete({
				userId: me.id,
				targetUserId: target.id,
			});
			return;
		}

		// 以前に作成されたパーソナルメモがあるかどうか確認
		const previousMemo = await this.userMemosRepository.findOneBy({
			userId: me.id,
			targetUserId: target.id,
		});

		if (!previousMemo) {
			await this.userMemosRepository.insert({
				id: this.idService.gen(),
				userId: me.id,
				targetUserId: target.id,
				memo: ps.memo,
			});
		} else {
			await this.userMemosRepository.update(previousMemo.id, {
				userId: me.id,
				targetUserId: target.id,
				memo: ps.memo,
			});
		}
	}
}
