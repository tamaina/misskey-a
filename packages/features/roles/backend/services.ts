/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { RoleEntityService } from './serializers/RoleEntityService.js';

export const roleServices = defineServices({
	RoleEntityService: service(RoleEntityService, [ports.rolesRepository, ports.roleAssignmentsRepository, ports.idService]),
});
