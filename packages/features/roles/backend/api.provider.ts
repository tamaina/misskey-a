/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { rolesContract } from '@features/roles/backend/api.contract.js';
import { RoleEntityService } from '@features/roles/backend/serializers/RoleEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { FanoutTimelineService } from '@features/timelines/backend/services/FanoutTimelineService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import type { RolesRepository, RoleAssignmentsRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { createRolesRouter } from './api.router.js';

function requiredSchema<T>(schema: T | undefined): T {
	if (schema === undefined) throw new Error("Missing native schema");
	return schema;
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
			noteEntityService: { packMany: async (rows, actor) => v.parse(requiredSchema(rolesContract.rolesNotes['~orpc'].outputSchema), await noteEntityService.packMany(rows, actor)) },
			metaService, globalEventService: moduleRef.get(GlobalEventService, { strict: false }), moderationLogService,
			fanoutTimelineService: moduleRef.get(FanoutTimelineService, { strict: false }), channelMutingService: moduleRef.get(ChannelMutingService, { strict: false }),
		});
		return this.router;
	}
}
