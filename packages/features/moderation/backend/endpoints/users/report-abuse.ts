/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { moderationErrors } from '../../api.errors.js';
export function createUsersReportAbuseProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'getterService' | 'roleService' | 'abuseReportService'>) {
	return implement(moderationContract.usersReportAbuse, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'users/report-abuse', requireCredential: true, kind: 'write:report-abuse' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			// Lookup user
			const targetUser = await deps.getterService.getUser(ps.userId).catch(err => {
				if (typeof err === 'object' && err !== null && 'id' in err && err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(moderationErrors.usersReportAbuse.noSuchUser);
				throw err;
			});
			if (targetUser.id === me.id) {
				throw apiError(moderationErrors.usersReportAbuse.cannotReportYourself);
			}
			if (await deps.roleService.isAdministrator(targetUser)) {
				throw apiError(moderationErrors.usersReportAbuse.cannotReportAdmin);
			}
			await deps.abuseReportService.report([{
				targetUserId: targetUser.id,
				targetUserHost: targetUser.host,
				reporterId: me.id,
				reporterHost: null,
				comment: ps.comment,
			}]);
		});
}
