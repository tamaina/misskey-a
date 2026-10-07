/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminDeleteAccountDefinition, voidAdminDeleteAccountInput, voidAdminDeleteAccountOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';

import { DeleteAccountService } from '../../services/DeleteAccountService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(voidAdminDeleteAccountDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:delete-account',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminDeleteAccountInput, typeof voidAdminDeleteAccountOutput> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private deleteAccountService: DeleteAccountService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const user = await this.usersRepository.findOneByOrFail({ id: ps.userId });
			if (user.isDeleted) {
				return;
			}

			await this.deleteAccountService.deleteAccount(user, me);
		});
	}
}
