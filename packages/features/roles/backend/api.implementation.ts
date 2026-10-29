/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { RoleWriteValues } from './services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiRole } from '../../roles/backend/models/Role.js';
import { rolesContract } from './api.definition.js';
import type { UsersRepository, RolesRepository, RoleAssignmentsRepository, NotesRepository, MiNote } from '@features/persistence/backend/repositories/models.js';
import { FanoutTimelineService } from '@features/timelines/backend/services/FanoutTimelineService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { implement } from '@orpc/server';
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
import { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DI } from '@/di-symbols.js';

type Outputs = InferContractRouterOutputs<typeof rolesContract>;

export interface RolesDependencies<Actor extends ApiActor> {
	usersRepository: Pick<UsersRepository, 'findOneBy'>;
	rolesRepository: Pick<RolesRepository, 'findOneBy' | 'find' | 'findBy'>;
	roleAssignmentsRepository: Pick<RoleAssignmentsRepository, 'createQueryBuilder'>;
	notesRepository: Pick<NotesRepository, 'createQueryBuilder'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery'>;
	idService: Pick<IdService, 'gen' | 'parse'>;
	roleService: {
		isAdministrator: RoleService['isAdministrator'];
		create(values: RoleWriteValues, actor: Actor): Promise<MiRole>;
		update(role: MiRole, values: RoleWriteValues, actor: Actor): Promise<void>;
		delete(role: MiRole, actor: Actor): Promise<void>;
		assign(userId: string, roleId: string, expiresAt: Date | null, actor: Actor): Promise<void>;
		unassign(userId: string, roleId: string, actor: Actor): Promise<void>;
	};
	roleEntityService: {
		pack(role: MiRole, actor: Actor | null): Promise<Outputs['rolesShow']>;
		packMany(roles: MiRole[], actor: Actor): Promise<Outputs['rolesList']>;
	};
	userEntityService: {
		pack(user: MiUser | string, actor: Actor | null, options: {
			schema: 'UserDetailed';
		}): Promise<Outputs['rolesUsers'][number]['user']>;
		packMany(users: (MiUser | string)[], actor: Actor | null, options: {
			schema: 'UserDetailed';
		}): Promise<Outputs['rolesUsers'][number]['user'][]>;
	};
	noteEntityService: {
		packMany(notes: MiNote[], actor: Actor): Promise<Outputs['rolesNotes']>;
	};
	metaService: Pick<MetaService, 'fetch' | 'update'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	fanoutTimelineService: Pick<FanoutTimelineService, 'get'>;
	channelMutingService: Pick<ChannelMutingService, 'list'>;
}

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

type RolesRouter = ReturnType<typeof createRolesRouter<MiLocalUser>>;

@Injectable()
export class RolesApiProvider {
	private router: RolesRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): RolesRouter {
		if (this.router !== undefined) return this.router;
		const moduleRef = this.moduleRef;
		const users = moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false });
		const roles = moduleRef.get(RoleService, { strict: false });
		const queryService = moduleRef.get(QueryService, { strict: false });
		const idService = moduleRef.get(IdService, { strict: false });
		const moderationLogService = moduleRef.get(ModerationLogService, { strict: false });
		const metaService = moduleRef.get(MetaService, { strict: false });
		const roleEntityService = moduleRef.get(RoleEntityService, { strict: false });
		const userEntityService = moduleRef.get(UserEntityService, { strict: false });
		const noteEntityService = moduleRef.get(NoteEntityService, { strict: false });
		this.router = createRolesRouter<MiLocalUser>({
			usersRepository: users,
			rolesRepository: moduleRef.get<RolesRepository>(DI.rolesRepository, { strict: false }),
			roleAssignmentsRepository: moduleRef.get<RoleAssignmentsRepository>(DI.roleAssignmentsRepository, { strict: false }),
			notesRepository: moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			queryService, idService, roleService: roles, roleEntityService,
			userEntityService: { pack: async (row, actor, options) => toPackedUserDetailed(await userEntityService.pack(row, actor, options)), packMany: async (rows, actor, options) => (await userEntityService.packMany(rows, actor, options)).map(toPackedUserDetailed) },
			noteEntityService,
			metaService, globalEventService: moduleRef.get(GlobalEventService, { strict: false }), moderationLogService,
			fanoutTimelineService: moduleRef.get(FanoutTimelineService, { strict: false }), channelMutingService: moduleRef.get(ChannelMutingService, { strict: false }),
		});
		return this.router;
	}
}
