/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { RoleEntityService } from './serializers/RoleEntityService.js';
import type { RoleAssignmentsRepository, RolesRepository } from '@/models/_.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface RoleServicesDependencies {
	rolesRepository: RolesRepository;
	roleAssignmentsRepository: RoleAssignmentsRepository;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createRoleServices(deps: RoleServicesDependencies) {
	const roleEntityService = new RoleEntityService(deps.rolesRepository, deps.roleAssignmentsRepository, deps.idService);

	return {
		RoleEntityService: roleEntityService,
	};
}

export type RoleServices = ReturnType<typeof createRoleServices>;
