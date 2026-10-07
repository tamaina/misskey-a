/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidUsersUpdateMemoDefinition, voidUsersUpdateMemoInput, voidUsersUpdateMemoOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserMemoRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(voidUsersUpdateMemoDefinition);

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '6fef56f3-e765-4957-88e5-c6f65329b8a5',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidUsersUpdateMemoInput, typeof voidUsersUpdateMemoOutput> {
	constructor(
		@Inject(DI.userMemosRepository)
		private userMemosRepository: UserMemoRepository,
		private getterService: GetterService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Get target
			const target = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
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
		});
	}
}
