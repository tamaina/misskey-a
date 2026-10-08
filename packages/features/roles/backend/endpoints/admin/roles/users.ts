/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { referenceAdminRolesUsersDefinition, referenceAdminRolesUsersInput, referenceAdminRolesUsersOutput } from '../../../../contract/reference-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import type { RoleAssignmentsRepository, RolesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

import * as v from 'valibot';
import { nativeUserDetailedSchema } from '@features/users/backend/serializers/native-user.js';

export const nativeOutputSchema = v.array(v.strictObject({ ...referenceAdminRolesUsersOutput.item.entries, user: nativeUserDetailedSchema }));

const contractProjection = projectEndpointContract(referenceAdminRolesUsersDefinition);

export const meta = {
	tags: ['admin', 'role', 'users'],

	requireCredential: false,
	requireModerator: true,
	kind: 'read:admin:roles',

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: '224eff5e-2488-4b18-b3e7-f50d94421648',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof referenceAdminRolesUsersInput, typeof referenceAdminRolesUsersOutput, typeof nativeOutputSchema> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private queryService: QueryService,
		private userEntityService: UserEntityService,
		private idService: IdService,
	) {
		super(meta, contractProjection, nativeOutputSchema, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({
				id: ps.roleId,
			});

			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			const query = this.queryService.makePaginationQuery(this.roleAssignmentsRepository.createQueryBuilder('assign'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
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
			const _userMap = await this.userEntityService.packMany(_users, me, { schema: 'UserDetailed' })
				.then(users => new Map(users.map(u => [u.id, u])));
			return await Promise.all(assigns.map(async assign => ({
				id: assign.id,
				createdAt: this.idService.parse(assign.id).date.toISOString(),
				user: _userMap.get(assign.userId) ?? await this.userEntityService.pack(assign.user!, me, { schema: 'UserDetailed' }),
				expiresAt: assign.expiresAt?.toISOString() ?? null,
			})));
		});
	}
}
