/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminInviteListDefinition, packedAdminInviteListInput, packedAdminInviteListOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../../serializers/InviteCodeEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedAdminInviteListDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:invite-codes',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminInviteListInput, typeof packedAdminInviteListOutput> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.registrationTicketsRepository.createQueryBuilder('ticket')
				.leftJoinAndSelect('ticket.createdBy', 'createdBy')
				.leftJoinAndSelect('ticket.usedBy', 'usedBy');

			switch (ps.type) {
				case 'unused': query.andWhere('ticket.usedBy IS NULL'); break;
				case 'used': query.andWhere('ticket.usedBy IS NOT NULL'); break;
				case 'expired': query.andWhere('ticket.expiresAt < :now', { now: new Date() }); break;
			}

			switch (ps.sort) {
				case '+createdAt': query.orderBy('ticket.id', 'DESC'); break;
				case '-createdAt': query.orderBy('ticket.id', 'ASC'); break;
				case '+usedAt': query.orderBy('ticket.usedAt', 'DESC', 'NULLS LAST'); break;
				case '-usedAt': query.orderBy('ticket.usedAt', 'ASC', 'NULLS FIRST'); break;
				default: query.orderBy('ticket.id', 'DESC'); break;
			}

			query.limit(ps.limit);
			query.offset(ps.offset);

			const tickets = await query.getMany();

			return await this.inviteCodeEntityService.packMany(tickets, me);
		});
	}
}
