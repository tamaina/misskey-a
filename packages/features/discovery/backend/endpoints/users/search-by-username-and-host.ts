/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { allOfUsersSearchByUsernameAndHostDefinition, allOfUsersSearchByUsernameAndHostInput, allOfUsersSearchByUsernameAndHostOutput } from '../../../contract/selector-common-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { UserSearchService } from '../../services/UserSearchService.js';

import * as v from 'valibot';
import { nativeUserSchema } from '@features/users/backend/serializers/native-user.js';

export const nativeOutputSchema = v.array(nativeUserSchema);

const contractProjection = projectEndpointContract(allOfUsersSearchByUsernameAndHostDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for a user by username and/or host.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof allOfUsersSearchByUsernameAndHostInput, typeof allOfUsersSearchByUsernameAndHostOutput, typeof nativeOutputSchema, 'legacy-declared'> {
	constructor(
		private userSearchService: UserSearchService,
	) {
		super(meta, contractProjection, nativeOutputSchema, (ps, me) => {
			return this.userSearchService.searchByUsernameAndHost({
				username: 'username' in ps ? ps.username : undefined,
				host: 'host' in ps ? ps.host : undefined,
			}, {
				limit: ps.limit,
				detail: ps.detail,
			}, me);
		});
	}
}
