/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../serializers/InviteCodeEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { packedInviteListInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'read:invite-codes',
} as const;

@Injectable()
export class InviteListOperation {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: v.InferOutput<typeof packedInviteListInput>, me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.registrationTicketsRepository.createQueryBuilder('ticket'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('ticket.createdById = :meId', { meId: me.id })
			.leftJoinAndSelect('ticket.createdBy', 'createdBy')
			.leftJoinAndSelect('ticket.usedBy', 'usedBy');

		const tickets = await query
			.limit(ps.limit)
			.getMany();

		return await this.inviteCodeEntityService.packMany(tickets, me);
	}
}
