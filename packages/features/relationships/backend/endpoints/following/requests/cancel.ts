/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedFollowingRequestsCancelDefinition, packedFollowingRequestsCancelInput, packedFollowingRequestsCancelOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { IdentifiableError } from '@/misc/identifiable-error.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserFollowingService } from '../../../services/UserFollowingService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedFollowingRequestsCancelDefinition);

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'write:following',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4e68c551-fc4c-4e46-bb41-7d4a37bf9dab',
		},

		followRequestNotFound: {
			message: 'Follow request not found.',
			code: 'FOLLOW_REQUEST_NOT_FOUND',
			id: '089b125b-d338-482a-9a09-e2622ac9f8d4',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFollowingRequestsCancelInput, typeof packedFollowingRequestsCancelOutput> {
	constructor(
		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Fetch followee
			const followee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			try {
				await this.userFollowingService.cancelFollowRequest(followee, me);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw new ApiError(meta.errors.followRequestNotFound);
				}
				throw err;
			}

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
