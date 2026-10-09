/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { rolesContract } from './api.contract.js';
import type { RolesDependencies } from './api.dependencies.js';
import { createAdminRolesAssignProcedure } from './endpoints/admin/roles/assign.js';
import { createAdminRolesCreateProcedure } from './endpoints/admin/roles/create.js';
import { createAdminRolesDeleteProcedure } from './endpoints/admin/roles/delete.js';
import { createAdminRolesListProcedure } from './endpoints/admin/roles/list.js';
import { createAdminRolesShowProcedure } from './endpoints/admin/roles/show.js';
import { createAdminRolesUnassignProcedure } from './endpoints/admin/roles/unassign.js';
import { createAdminRolesUpdateProcedure } from './endpoints/admin/roles/update.js';
import { createAdminRolesUpdateDefaultPoliciesProcedure } from './endpoints/admin/roles/update-default-policies.js';
import { createAdminRolesUsersProcedure } from './endpoints/admin/roles/users.js';
import { createRolesListProcedure } from './endpoints/roles/list.js';
import { createRolesNotesProcedure } from './endpoints/roles/notes.js';
import { createRolesShowProcedure } from './endpoints/roles/show.js';
import { createRolesUsersProcedure } from './endpoints/roles/users.js';
export function createRolesRouter<Actor extends ApiActor>(deps: RolesDependencies<Actor>) {
	return implement(rolesContract).$context<ApiContext<Actor>>().router({
		adminRolesAssign: createAdminRolesAssignProcedure<Actor>(deps),
		adminRolesCreate: createAdminRolesCreateProcedure<Actor>(deps),
		adminRolesDelete: createAdminRolesDeleteProcedure<Actor>(deps),
		adminRolesList: createAdminRolesListProcedure<Actor>(deps),
		adminRolesShow: createAdminRolesShowProcedure<Actor>(deps),
		adminRolesUnassign: createAdminRolesUnassignProcedure<Actor>(deps),
		adminRolesUpdate: createAdminRolesUpdateProcedure<Actor>(deps),
		adminRolesUpdateDefaultPolicies: createAdminRolesUpdateDefaultPoliciesProcedure<Actor>(deps),
		adminRolesUsers: createAdminRolesUsersProcedure<Actor>(deps),
		rolesList: createRolesListProcedure<Actor>(deps),
		rolesNotes: createRolesNotesProcedure<Actor>(deps),
		rolesShow: createRolesShowProcedure<Actor>(deps),
		rolesUsers: createRolesUsersProcedure<Actor>(deps),
	});
}
