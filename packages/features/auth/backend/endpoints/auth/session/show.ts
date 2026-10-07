/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAuthSessionShowDefinition, packedAuthSessionShowInput, packedAuthSessionShowOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AuthSessionsRepository } from '@/models/_.js';
import { AuthSessionEntityService } from '../../../serializers/AuthSessionEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAuthSessionShowDefinition);

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: 'bd72c97d-eba7-4adb-a467-f171b8847250',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAuthSessionShowInput, typeof packedAuthSessionShowOutput> {
	constructor(
		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private authSessionEntityService: AuthSessionEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Lookup session
			const session = await this.authSessionsRepository.findOneBy({
				token: ps.token,
			});

			if (session == null) {
				throw new ApiError(meta.errors.noSuchSession);
			}

			return await this.authSessionEntityService.pack(session, me);
		});
	}
}
