/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedInviteListDefinition, packedInviteListInput, packedInviteListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@/models/_.js';
import { InviteCodeEntityService } from '../../serializers/InviteCodeEntityService.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedInviteListDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'read:invite-codes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedInviteListInput, typeof packedInviteListOutput> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.registrationTicketsRepository.createQueryBuilder('ticket'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('ticket.createdById = :meId', { meId: me.id })
				.leftJoinAndSelect('ticket.createdBy', 'createdBy')
				.leftJoinAndSelect('ticket.usedBy', 'usedBy');

			const tickets = await query
				.limit(ps.limit)
				.getMany();

			return await this.inviteCodeEntityService.packMany(tickets, me);
		});
	}
}
