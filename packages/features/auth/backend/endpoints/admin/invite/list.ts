/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../../serializers/InviteCodeEntityService.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { packedAdminInviteListInput } from '../../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:invite-codes',
} as const;

@Injectable()
export class AdminInviteListOperation {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof packedAdminInviteListInput>, me: MiLocalUser) {
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
	}
}
