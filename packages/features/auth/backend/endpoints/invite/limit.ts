/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineInviteLimitDefinition, inlineInviteLimitInput, inlineInviteLimitOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';

import type { RegistrationTicketsRepository } from '@/models/_.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(inlineInviteLimitDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'read:invite-codes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineInviteLimitInput, typeof inlineInviteLimitOutput> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);

			const count = policies.inviteLimit ? await this.registrationTicketsRepository.countBy({
				id: MoreThan(this.idService.gen(Date.now() - (policies.inviteLimitCycle * 60 * 1000))),
				createdById: me.id,
			}) : null;

			return {
				remaining: count !== null ? Math.max(0, policies.inviteLimit - count) : null,
			};
		});
	}
}
