/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineFetchExternalResourcesDefinition, inlineFetchExternalResourcesInput, inlineFetchExternalResourcesOutput } from '../../contract/endpoint-definitions.js';
import { createHash } from 'crypto';
import ms from '@/runtime-dependencies/ms.js';
import { Injectable } from '@nestjs/common';

import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(inlineFetchExternalResourcesDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	secure: true,

	limit: {
		duration: ms('1hour'),
		max: 50,
	},

	errors: {
		invalidSchema: {
			message: 'External resource returned invalid schema.',
			code: 'EXT_RESOURCE_RETURNED_INVALID_SCHEMA',
			id: 'bb774091-7a15-4a70-9dc5-6ac8cf125856',
		},
		hashUnmached: {
			message: 'Hash did not match.',
			code: 'EXT_RESOURCE_HASH_DIDNT_MATCH',
			id: '693ba8ba-b486-40df-a174-72f8279b56a4',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineFetchExternalResourcesInput, typeof inlineFetchExternalResourcesOutput> {
	constructor(
		private httpRequestService: HttpRequestService,
	) {
		super(meta, contractProjection, async (ps) => {
			const res = await this.httpRequestService.getJson<{
				type: string;
				data: string;
			}>(ps.url);

			if (!res.data || !res.type) {
				throw new ApiError(meta.errors.invalidSchema);
			}

			const resHash = createHash('sha512').update(res.data.replace(/\r\n/g, '\n')).digest('hex');
			if (resHash !== ps.hash) {
				throw new ApiError(meta.errors.hashUnmached);
			}

			return {
				type: res.type,
				data: res.data,
			};
		});
	}
}
