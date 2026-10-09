/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { RoleService, RoleWriteValues } from './services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '../../users/backend/models/User.js';
import type { MiRole } from '../../roles/backend/models/Role.js';
import type { rolesContract } from './api.contract.js';
import type { UsersRepository, RolesRepository, RoleAssignmentsRepository, NotesRepository, MiNote } from '../../persistence/backend/repositories/models.js';
import type { FanoutTimelineService } from '../../timelines/backend/services/FanoutTimelineService.js';
import type { ChannelMutingService } from '../../channels/backend/services/ChannelMutingService.js';
import type { GlobalEventService } from '../../runtime/backend/services/GlobalEventService.js';
import type { MetaService } from '../../instance/backend/services/MetaService.js';
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
