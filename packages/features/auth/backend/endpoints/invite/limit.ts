/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import * as v from 'valibot';
import { inlineInviteLimitInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'read:invite-codes',
} as const;

@Injectable()
export class InviteLimitOperation {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof inlineInviteLimitInput>, me: MiLocalUser) {
		const policies = await this.roleService.getUserPolicies(me.id);

		const count = policies.inviteLimit ? await this.registrationTicketsRepository.countBy({
			id: MoreThan(this.idService.gen(Date.now() - (policies.inviteLimitCycle * 60 * 1000))),
			createdById: me.id,
		}) : null;

		return {
			remaining: count !== null ? Math.max(0, policies.inviteLimit - count) : null,
		};
	}
}
