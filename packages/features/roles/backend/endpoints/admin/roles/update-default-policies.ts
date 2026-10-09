/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
export function createAdminRolesUpdateDefaultPoliciesProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'metaService' | 'globalEventService' | 'moderationLogService'>) {
	return implement(rolesContract.adminRolesUpdateDefaultPolicies, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/roles/update-default-policies', requireCredential: true, requireAdmin: true, kind: 'write:admin:roles' })).use(requirePrincipal<Actor>())
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
