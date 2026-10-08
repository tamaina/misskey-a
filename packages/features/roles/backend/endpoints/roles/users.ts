/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedRolesUsersDefinition, packedRolesUsersInput, packedRolesUsersOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import type { RoleAssignmentsRepository, RolesRepository } from '@features/persistence/backend/repositories/models.js';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

import * as v from 'valibot';
import { nativeUserDetailedSchema } from '@features/users/backend/serializers/native-user.js';

export const nativeOutputSchema = v.array(v.strictObject({ ...packedRolesUsersOutput.item.entries, user: nativeUserDetailedSchema }));

const contractProjection = projectEndpointContract(packedRolesUsersDefinition);

export const meta = {
	tags: ['role', 'users'],

	requireCredential: false,

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: '30aaaee3-4792-48dc-ab0d-cf501a575ac5',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof packedRolesUsersInput, typeof packedRolesUsersOutput, typeof nativeOutputSchema> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		private queryService: QueryService,
		private userEntityService: UserEntityService,
	) {
		super(meta, contractProjection, nativeOutputSchema, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({
				id: ps.roleId,
				isPublic: true,
				isExplorable: true,
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
				user: _userMap.get(assign.userId) ?? await this.userEntityService.pack(assign.user!, me, { schema: 'UserDetailed' }),
			})));
		});
	}
}
