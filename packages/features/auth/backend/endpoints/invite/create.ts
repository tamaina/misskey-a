/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MoreThan } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import { generateInviteCode } from '../../utility/generate-invite-code.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { packedInviteCreateInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

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
} as const;

@Injectable()
export class InviteCreateOperation {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private roleService: RoleService,
	) {}

	async execute(ps: v.InferOutput<typeof packedInviteCreateInput>, me: MiLocalUser) {
		const policies = await this.roleService.getUserPolicies(me.id);

		if (policies.inviteLimit) {
			const count = await this.registrationTicketsRepository.countBy({
				id: MoreThan(this.idService.gen(Date.now() - (policies.inviteLimitCycle * 1000 * 60))),
				createdById: me.id,
			});

			if (count >= policies.inviteLimit) {
				throw apiError(meta.errors.exceededCreateLimit);
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
	}
}
