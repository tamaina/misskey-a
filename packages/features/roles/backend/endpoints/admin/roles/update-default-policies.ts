/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
export function createAdminRolesUpdateDefaultPoliciesProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'metaService' | 'globalEventService' | 'moderationLogService'>) {
	return createApiProcedure<Actor>()(rolesContract.adminRolesUpdateDefaultPolicies).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const before = await deps.metaService.fetch(true);
			await deps.metaService.update({
				policies: ps.policies,
			});
			const after = await deps.metaService.fetch(true);
			deps.globalEventService.publishInternalEvent('policiesUpdated', after.policies);
			deps.moderationLogService.log(me, 'updateServerSettings', {
				before: before.policies,
				after: after.policies,
			});
		});
}
