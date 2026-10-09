/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type IdService } from '@features/runtime/backend/services/IdService.js';
import { type GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { usersUpdateMemoErrors } from './update-memo.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UserMemoRepository } from '@features/persistence/backend/repositories/models.js';
import { usersUpdateMemoContract } from './update-memo.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface UsersUpdateMemoDependencies {
	userMemosRepository: UserMemoRepository;
	getterService: GetterService;
	idService: IdService;
}
export function createUsersUpdateMemoProcedure(deps: UsersUpdateMemoDependencies) {
	async function execute(ps: UsersInputs['users/update-memo'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		// Get target
		const target = await deps.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(usersUpdateMemoErrors.noSuchUser);
			throw err;
		});

		// 引数がnullか空文字であれば、パーソナルメモを削除する
		if (ps.memo === '' || ps.memo == null) {
			await deps.userMemosRepository.delete({
				userId: me.id,
				targetUserId: target.id,
			});
			return;
		}

		// 以前に作成されたパーソナルメモがあるかどうか確認
		const previousMemo = await deps.userMemosRepository.findOneBy({
			userId: me.id,
			targetUserId: target.id,
		});

		if (!previousMemo) {
			await deps.userMemosRepository.insert({
				id: deps.idService.gen(),
				userId: me.id,
				targetUserId: target.id,
				memo: ps.memo,
			});
		} else {
			await deps.userMemosRepository.update(previousMemo.id, {
				userId: me.id,
				targetUserId: target.id,
				memo: ps.memo,
			});
		}
	}

	return implement(usersUpdateMemoContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: usersUpdateMemoContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => await execute(input, context.principal, context.token, context.ip));
}
