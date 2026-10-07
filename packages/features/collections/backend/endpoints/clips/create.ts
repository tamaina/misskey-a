/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedClipsCreateDefinition, packedClipsCreateInput, packedClipsCreateOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { MiClip } from '@/models/_.js';
import { ClipEntityService } from '../../serializers/ClipEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import { ClipService } from '../../services/ClipService.js';

const contractProjection = projectEndpointContract(packedClipsCreateDefinition);

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	res: contractProjection.response,

	errors: {
		tooManyClips: {
			message: 'You cannot create clip any more.',
			code: 'TOO_MANY_CLIPS',
			id: '920f7c2d-6208-4b76-8082-e632020f5883',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedClipsCreateInput, typeof packedClipsCreateOutput> {
	constructor(
		private clipEntityService: ClipEntityService,
		private clipService: ClipService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			let clip: MiClip;
			try {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				clip = await this.clipService.create(me, ps.name, ps.isPublic, ps.description || null);
			} catch (e) {
				if (e instanceof ClipService.TooManyClipsError) {
					throw new ApiError(meta.errors.tooManyClips);
				}
				throw e;
			}
			return await this.clipEntityService.pack(clip, me);
		});
	}
}
