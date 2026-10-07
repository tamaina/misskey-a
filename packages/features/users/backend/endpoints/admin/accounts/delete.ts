/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminAccountsDeleteDefinition, voidAdminAccountsDeleteInput, voidAdminAccountsDeleteOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { UsersRepository } from '@/models/_.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../../../serializers/UserEntityService.js';
import { DeleteAccountService } from '../../../services/DeleteAccountService.js';

const contractProjection = projectEndpointContract(voidAdminAccountsDeleteDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:account',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminAccountsDeleteInput, typeof voidAdminAccountsDeleteOutput> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private deleteAccoountService: DeleteAccountService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			await this.deleteAccoountService.deleteAccount(user, me);
		});
	}
}
