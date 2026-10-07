/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedClipsUpdateDefinition, packedClipsUpdateInput, packedClipsUpdateOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ClipEntityService } from '../../serializers/ClipEntityService.js';
import { ClipService } from '../../services/ClipService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedClipsUpdateDefinition);

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'b4d92d70-b216-46fa-9a3f-a8c811699257',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedClipsUpdateInput, typeof packedClipsUpdateOutput> {
	constructor(
		private clipService: ClipService,

		private clipEntityService: ClipEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			try {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				await this.clipService.update(me, ps.clipId, ps.name, ps.isPublic, ps.description || null);
			} catch (e) {
				if (e instanceof ClipService.NoSuchClipError) {
					throw new ApiError(meta.errors.noSuchClip);
				}
				throw e;
			}

			return await this.clipEntityService.pack(ps.clipId, me);
		});
	}
}
