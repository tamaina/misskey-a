/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import { sqlLikeEscape } from '../../persistence/backend/utility/sql-like-escape.js';
import type { InferSchemaOutput, InferContractRouterOutputs } from '@orpc/contract';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { RoleService, RoleWriteValues } from './services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '../../users/backend/models/User.js';
import type { MiRole } from '../../roles/backend/models/Role.js';
import { rolesErrors } from './api.errors.js';
import type { rolesContract } from './api.contract.js';
type Inputs = { [K in keyof typeof rolesContract]: InferSchemaOutput<NonNullable<(typeof rolesContract)[K]['~orpc']['inputSchema']>> };
type Outputs = InferContractRouterOutputs<typeof rolesContract>;
export interface RolesOperations<Actor extends ApiActor> {
	adminRolesAssign(input: Inputs['adminRolesAssign'], actor: Actor): Promise<Outputs['adminRolesAssign']>;
	adminRolesCreate(input: Inputs['adminRolesCreate'], actor: Actor): Promise<Outputs['adminRolesCreate']>;
	adminRolesDelete(input: Inputs['adminRolesDelete'], actor: Actor): Promise<Outputs['adminRolesDelete']>;
	adminRolesList(input: Inputs['adminRolesList'], actor: Actor): Promise<Outputs['adminRolesList']>;
	adminRolesShow(input: Inputs['adminRolesShow'], actor: Actor): Promise<Outputs['adminRolesShow']>;
	adminRolesUnassign(input: Inputs['adminRolesUnassign'], actor: Actor): Promise<Outputs['adminRolesUnassign']>;
	adminRolesUpdate(input: Inputs['adminRolesUpdate'], actor: Actor): Promise<Outputs['adminRolesUpdate']>;
	adminRolesUpdateDefaultPolicies(input: Inputs['adminRolesUpdateDefaultPolicies'], actor: Actor): Promise<Outputs['adminRolesUpdateDefaultPolicies']>;
	adminRolesUsers(input: Inputs['adminRolesUsers'], actor: Actor): Promise<Outputs['adminRolesUsers']>;
	rolesList(input: Inputs['rolesList'], actor: Actor): Promise<Outputs['rolesList']>;
	rolesNotes(input: Inputs['rolesNotes'], actor: Actor): Promise<Outputs['rolesNotes']>;
	rolesShow(input: Inputs['rolesShow'], actor: Actor | null): Promise<Outputs['rolesShow']>;
	rolesUsers(input: Inputs['rolesUsers'], actor: Actor | null): Promise<Outputs['rolesUsers']>;
}
import type { UsersRepository, RolesRepository, RoleAssignmentsRepository, NotesRepository, MiNote } from '../../persistence/backend/repositories/models.js';
import type { FanoutTimelineService } from '../../timelines/backend/services/FanoutTimelineService.js';
import type { ChannelMutingService } from '../../channels/backend/services/ChannelMutingService.js';
import type { GlobalEventService } from '../../runtime/backend/services/GlobalEventService.js';
import type { MetaService } from '../../instance/backend/services/MetaService.js';
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
	 pack(user: MiUser | string, actor: Actor | null, options: { schema: 'UserDetailed' }): Promise<Outputs['rolesUsers'][number]['user']>;
	 packMany(users: (MiUser | string)[], actor: Actor | null, options: { schema: 'UserDetailed' }): Promise<Outputs['rolesUsers'][number]['user'][]>;
	};
	noteEntityService: { packMany(notes: MiNote[], actor: Actor): Promise<Outputs['rolesNotes']> };
	metaService: Pick<MetaService, 'fetch' | 'update'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	fanoutTimelineService: Pick<FanoutTimelineService, 'get'>;
	channelMutingService: Pick<ChannelMutingService, 'list'>;
}

@Injectable()
export class RolesApplicationService<Actor extends ApiActor> implements RolesOperations<Actor> {
	constructor(private readonly deps: RolesDependencies<Actor>) {}
	public async adminRolesAssign(ps: Inputs['adminRolesAssign'], me: Actor): Promise<Outputs['adminRolesAssign']> {
		const role = await this.deps.rolesRepository.findOneBy({ id: ps.roleId });
		if (role == null) {
			throw apiError(rolesErrors.adminRolesAssign.noSuchRole);
		}

		if (!role.canEditMembersByModerator && !(await this.deps.roleService.isAdministrator(me))) {
			throw apiError(rolesErrors.adminRolesAssign.accessDenied);
		}

		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) {
			throw apiError(rolesErrors.adminRolesAssign.noSuchUser);
		}

		if (ps.expiresAt && ps.expiresAt <= Date.now()) {
			return;
		}

		await this.deps.roleService.assign(user.id, role.id, ps.expiresAt ? new Date(ps.expiresAt) : null, me);
	}
	public async adminRolesCreate(ps: Inputs['adminRolesCreate'], me: Actor): Promise<Outputs['adminRolesCreate']> {
		const created = await this.deps.roleService.create(ps, me);

		return await this.deps.roleEntityService.pack(created, me);
	}
	public async adminRolesDelete(ps: Inputs['adminRolesDelete'], me: Actor): Promise<Outputs['adminRolesDelete']> {
		const role = await this.deps.rolesRepository.findOneBy({ id: ps.roleId });
		if (role == null) {
			throw apiError(rolesErrors.adminRolesDelete.noSuchRole);
		}
		await this.deps.roleService.delete(role, me);
	}
	public async adminRolesList(ps: Inputs['adminRolesList'], me: Actor): Promise<Outputs['adminRolesList']> {
		const roles = await this.deps.rolesRepository.find({
			order: { lastUsedAt: 'DESC' },
		});
		return await this.deps.roleEntityService.packMany(roles, me);
	}
	public async adminRolesShow(ps: Inputs['adminRolesShow'], me: Actor): Promise<Outputs['adminRolesShow']> {
		const role = await this.deps.rolesRepository.findOneBy({ id: ps.roleId });
		if (role == null) {
			throw apiError(rolesErrors.adminRolesShow.noSuchRole);
		}
		return await this.deps.roleEntityService.pack(role, me);
	}
	public async adminRolesUnassign(ps: Inputs['adminRolesUnassign'], me: Actor): Promise<Outputs['adminRolesUnassign']> {
		const role = await this.deps.rolesRepository.findOneBy({ id: ps.roleId });
		if (role == null) {
			throw apiError(rolesErrors.adminRolesUnassign.noSuchRole);
		}

		if (!role.canEditMembersByModerator && !(await this.deps.roleService.isAdministrator(me))) {
			throw apiError(rolesErrors.adminRolesUnassign.accessDenied);
		}

		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) {
			throw apiError(rolesErrors.adminRolesUnassign.noSuchUser);
		}

		await this.deps.roleService.unassign(user.id, role.id, me);
	}
	public async adminRolesUpdate(ps: Inputs['adminRolesUpdate'], me: Actor): Promise<Outputs['adminRolesUpdate']> {
		const role = await this.deps.rolesRepository.findOneBy({ id: ps.roleId });
		if (role == null) {
			throw apiError(rolesErrors.adminRolesUpdate.noSuchRole);
		}

		await this.deps.roleService.update(role, {
			name: ps.name,
			description: ps.description,
			color: ps.color,
			iconUrl: ps.iconUrl,
			target: ps.target,
			condFormula: ps.condFormula,
			isPublic: ps.isPublic,
			isModerator: ps.isModerator,
			isAdministrator: ps.isAdministrator,
			isExplorable: ps.isExplorable,
			asBadge: ps.asBadge,
			preserveAssignmentOnMoveAccount: ps.preserveAssignmentOnMoveAccount,
			canEditMembersByModerator: ps.canEditMembersByModerator,
			displayOrder: ps.displayOrder,
			policies: ps.policies,
		}, me);
	}
	public async adminRolesUpdateDefaultPolicies(ps: Inputs['adminRolesUpdateDefaultPolicies'], me: Actor): Promise<Outputs['adminRolesUpdateDefaultPolicies']> {
		const before = await this.deps.metaService.fetch(true);

		await this.deps.metaService.update({
			policies: ps.policies,
		});

		const after = await this.deps.metaService.fetch(true);

		this.deps.globalEventService.publishInternalEvent('policiesUpdated', after.policies);
		this.deps.moderationLogService.log(me, 'updateServerSettings', {
			before: before.policies,
			after: after.policies,
		});
	}
	public async adminRolesUsers(ps: Inputs['adminRolesUsers'], me: Actor): Promise<Outputs['adminRolesUsers']> {
		const role = await this.deps.rolesRepository.findOneBy({
			id: ps.roleId,
		});

		if (role == null) {
			throw apiError(rolesErrors.adminRolesUsers.noSuchRole);
		}

		const query = this.deps.queryService.makePaginationQuery(this.deps.roleAssignmentsRepository.createQueryBuilder('assign'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('assign.roleId = :roleId', { roleId: role.id })
			.andWhere(new Brackets(qb => {
				qb
					.where('assign.expiresAt IS NULL')
					.orWhere('assign.expiresAt > :now', { now: new Date() });
			}))
			.innerJoinAndSelect('assign.user', 'user');

		const assigns = await query
			.limit(ps.limit)
			.getMany();

		const _users = assigns.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.deps.userEntityService.packMany(_users, me, { schema: 'UserDetailed' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return await Promise.all(assigns.map(async assign => ({
			id: assign.id,
			createdAt: this.deps.idService.parse(assign.id).date.toISOString(),
			user: _userMap.get(assign.userId) ?? await this.deps.userEntityService.pack(assign.user ?? assign.userId, me, { schema: 'UserDetailed' }),
			expiresAt: assign.expiresAt?.toISOString() ?? null,
		})));
	}
	public async rolesList(ps: Inputs['rolesList'], me: Actor): Promise<Outputs['rolesList']> {
		const roles = await this.deps.rolesRepository.findBy({
			isPublic: true,
			isExplorable: true,
		});
		return await this.deps.roleEntityService.packMany(roles, me);
	}
	public async rolesNotes(ps: Inputs['rolesNotes'], me: Actor): Promise<Outputs['rolesNotes']> {
		const untilId = ps.untilId ?? (ps.untilDate ? this.deps.idService.gen(ps.untilDate) : null);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.deps.idService.gen(ps.sinceDate) : null);

		const role = await this.deps.rolesRepository.findOneBy({
			id: ps.roleId,
			isPublic: true,
		});

		if (role == null) {
			throw apiError(rolesErrors.rolesNotes.noSuchRole);
		}
		if (!role.isExplorable) {
			return [];
		}

		let noteIds = await this.deps.fanoutTimelineService.get(`roleTimeline:${role.id}`, untilId, sinceId);
		noteIds = noteIds.slice(0, ps.limit);

		if (noteIds.length === 0) {
			return [];
		}

		const query = this.deps.notesRepository.createQueryBuilder('note')
			.where('note.id IN (:...noteIds)', { noteIds: noteIds })
			.andWhere('(note.visibility = \'public\')')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		// -- ミュートされたチャンネル対策
		const mutingChannelIds = await this.deps.channelMutingService
			.list({ requestUserId: me.id }, { idOnly: true })
			.then(x => x.map(x => x.id));
		if (mutingChannelIds.length > 0) {
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.channelId IS NULL');
				qb.orWhere('note.channelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.renoteChannelId IS NULL');
				qb.orWhere('note.renoteChannelId NOT IN (:...mutingChannelIds)', { mutingChannelIds });
			}));
		}

		this.deps.queryService.generateVisibilityQuery(query, me);
		this.deps.queryService.generateBaseNoteFilteringQuery(query, me);

		const notes = await query.getMany();
		notes.sort((a, b) => a.id > b.id ? -1 : 1);

		return await this.deps.noteEntityService.packMany(notes, me);
	}
	public async rolesShow(ps: Inputs['rolesShow'], me: Actor | null): Promise<Outputs['rolesShow']> {
		const role = await this.deps.rolesRepository.findOneBy({
			id: ps.roleId,
			isPublic: true,
		});

		if (role == null) {
			throw apiError(rolesErrors.rolesShow.noSuchRole);
		}

		return await this.deps.roleEntityService.pack(role, me);
	}
	public async rolesUsers(ps: Inputs['rolesUsers'], me: Actor | null): Promise<Outputs['rolesUsers']> {
		const role = await this.deps.rolesRepository.findOneBy({
			id: ps.roleId,
			isPublic: true,
			isExplorable: true,
		});

		if (role == null) {
			throw apiError(rolesErrors.rolesUsers.noSuchRole);
		}

		const query = this.deps.queryService.makePaginationQuery(this.deps.roleAssignmentsRepository.createQueryBuilder('assign'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('assign.roleId = :roleId', { roleId: role.id })
			.andWhere(new Brackets(qb => {
				qb
					.where('assign.expiresAt IS NULL')
					.orWhere('assign.expiresAt > :now', { now: new Date() });
			}))
			.innerJoinAndSelect('assign.user', 'user');

		const assigns = await query
			.limit(ps.limit)
			.getMany();

		const _users = assigns.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.deps.userEntityService.packMany(_users, me, { schema: 'UserDetailed' })
			.then(users => new Map(users.map(u => [u.id, u])));
		return await Promise.all(assigns.map(async assign => ({
			id: assign.id,
			user: _userMap.get(assign.userId) ?? await this.deps.userEntityService.pack(assign.user ?? assign.userId, me, { schema: 'UserDetailed' }),
		})));
	}
}
export function createRolesOperations<Actor extends ApiActor>(deps: RolesDependencies<Actor>): RolesOperations<Actor> { return new RolesApplicationService(deps); }
