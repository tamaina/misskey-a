/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MoreThan } from 'typeorm';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import * as v from 'valibot';
import { InviteLimitContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'read:invite-codes',
} as const;
export interface InviteLimitDependencies {
	registrationTicketsRepository: RegistrationTicketsRepository;
	roleService: Pick<RoleService, 'getUserPolicies'>;
	idService: Pick<IdService, 'gen'>;
}
export function createInviteLimitProcedure(deps: InviteLimitDependencies) {
	return implement(InviteLimitContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'invite/limit', requireCredential: true, kind: 'read:invite-codes', requiredRolePolicy: 'canInvite' })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const me = context.principal;
		const result = await (async () => {
			const policies = await deps.roleService.getUserPolicies(me.id);

			const count = policies.inviteLimit ? await deps.registrationTicketsRepository.countBy({
				id: MoreThan(deps.idService.gen(Date.now() - (policies.inviteLimitCycle * 60 * 1000))),
				createdById: me.id,
			}) : null;

			return {
				remaining: count !== null ? Math.max(0, policies.inviteLimit - count) : null,
			};
		})();
		return v.parse(requiredSchema(InviteLimitContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
