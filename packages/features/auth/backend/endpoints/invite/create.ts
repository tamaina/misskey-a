/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedInviteCreateDefinition, packedInviteCreateInput, packedInviteCreateOutput } from '../../../contract/packed-endpoint-definitions.js';
import { MoreThan } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@/models/_.js';
import { InviteCodeEntityService } from '../../serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import { generateInviteCode } from '../../utility/generate-invite-code.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedInviteCreateDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'write:invite-codes',

	errors: {
		exceededCreateLimit: {
			message: 'You have exceeded the limit for creating an invitation code.',
			code: 'EXCEEDED_LIMIT_OF_CREATE_INVITE_CODE',
			id: '8b165dd3-6f37-4557-8db1-73175d63c641',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedInviteCreateInput, typeof packedInviteCreateOutput> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);

			if (policies.inviteLimit) {
				const count = await this.registrationTicketsRepository.countBy({
					id: MoreThan(this.idService.gen(Date.now() - (policies.inviteLimitCycle * 1000 * 60))),
					createdById: me.id,
				});

				if (count >= policies.inviteLimit) {
					throw new ApiError(meta.errors.exceededCreateLimit);
				}
			}

			const ticket = await this.registrationTicketsRepository.insertOne({
				id: this.idService.gen(),
				createdBy: me,
				createdById: me.id,
				expiresAt: policies.inviteExpirationTime ? new Date(Date.now() + (policies.inviteExpirationTime * 1000 * 60)) : null,
				code: generateInviteCode(),
			});

			return await this.inviteCodeEntityService.pack(ticket, me);
		});
	}
}
