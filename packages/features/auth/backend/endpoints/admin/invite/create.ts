/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminInviteCreateDefinition, packedAdminInviteCreateInput, packedAdminInviteCreateOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../../serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DI } from '@/di-symbols.js';
import { generateInviteCode } from '../../../utility/generate-invite-code.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAdminInviteCreateDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:invite-codes',

	errors: {
		invalidDateTime: {
			message: 'Invalid date-time format',
			code: 'INVALID_DATE_TIME',
			id: 'f1380b15-3760-4c6c-a1db-5c3aaf1cbd49',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminInviteCreateInput, typeof packedAdminInviteCreateOutput> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (ps.expiresAt && isNaN(Date.parse(ps.expiresAt))) {
				throw new ApiError(meta.errors.invalidDateTime);
			}

			const ticketsPromises = [];

			for (let i = 0; i < ps.count; i++) {
				ticketsPromises.push(this.registrationTicketsRepository.insertOne({
					id: this.idService.gen(),
					createdBy: me,
					createdById: me.id,
					expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
					code: generateInviteCode(),
				}));
			}

			const tickets = await Promise.all(ticketsPromises);

			this.moderationLogService.log(me, 'createInvitation', {
				invitations: tickets,
			});

			return await this.inviteCodeEntityService.packMany(tickets, me);
		});
	}
}
