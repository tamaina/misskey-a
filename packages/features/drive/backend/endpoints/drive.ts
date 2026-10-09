/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DriveFileEntityService } from '../serializers/DriveFileEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { driveManagementContract } from '../api.definition.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveDependencies {
	driveFileEntityService: Pick<DriveFileEntityService, 'calcDriveUsageOf'>;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}
export function createDriveProcedure(deps: DriveDependencies) {
	return implement(driveManagementContract['drive'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive', 'requireCredential': true, 'kind': 'read:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const _ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const usage = await deps.driveFileEntityService.calcDriveUsageOf(me.id);

			const policies = await deps.roleService.getUserPolicies(me.id);

			return {
				capacity: 1024 * 1024 * policies.driveCapacityMb,
				usage: usage,
			};
		});
}
