/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DriveFileEntityService } from '../serializers/DriveFileEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { driveManagementContract } from '../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveDependencies {
	driveFileEntityService: Pick<DriveFileEntityService, 'calcDriveUsageOf'>;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}
export function createDriveProcedure(deps: DriveDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive']).use(requirePrincipal<MiLocalUser>())
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
