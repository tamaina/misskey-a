/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedUsersSearchDefinition, packedUsersSearchInput, packedUsersSearchOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { UserSearchService } from '../../services/UserSearchService.js';

import * as v from 'valibot';
import { nativeUserSchema } from '@features/users/backend/serializers/native-user.js';

export const nativeOutputSchema = v.array(nativeUserSchema);

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
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof packedUsersSearchInput, typeof packedUsersSearchOutput, typeof nativeOutputSchema> {
	constructor(
		private userEntityService: UserEntityService,
		private userSearchService: UserSearchService,
	) {
		super(meta, contractProjection, nativeOutputSchema, async (ps, me) => {
			const users = await this.userSearchService.search(ps.query.trim(), me?.id ?? null, {
				offset: ps.offset,
				limit: ps.limit,
				origin: ps.origin,
			});

			return await this.userEntityService.packMany(users, me, { schema: ps.detail ? 'UserDetailed' : 'UserLite' });
		});
	}
}
