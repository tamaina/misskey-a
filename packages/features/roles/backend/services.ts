/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { RoleEntityService } from './serializers/RoleEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const roleServices = defineServices({
	RoleEntityService: service(RoleEntityService, [ports.rolesRepository, ports.roleAssignmentsRepository, ports.idService]),
});
export const createRoleServices = roleServices.create;
export type RoleServicesDependencies = Inputs<typeof roleServices>;
export type RoleServices = Outputs<typeof roleServices>;
