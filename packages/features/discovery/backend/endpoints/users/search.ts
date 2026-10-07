/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedUsersSearchDefinition, packedUsersSearchInput, packedUsersSearchOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { UserSearchService } from '../../services/UserSearchService.js';

const contractProjection = projectEndpointContract(packedUsersSearchDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,
	requiredRolePolicy: 'canSearchUsers',

	description: 'Search for users.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersSearchInput, typeof packedUsersSearchOutput> {
	constructor(
		private userEntityService: UserEntityService,
		private userSearchService: UserSearchService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const users = await this.userSearchService.search(ps.query.trim(), me?.id ?? null, {
				offset: ps.offset,
				limit: ps.limit,
				origin: ps.origin,
			});

			return await this.userEntityService.packMany(users, me, { schema: ps.detail ? 'UserDetailed' : 'UserLite' });
		});
	}
}
