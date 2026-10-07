/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineApGetDefinition, inlineApGetInput, inlineApGetOutput } from '../../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import ms from '@/runtime-dependencies/ms.js';

import { ApResolverService } from '../../services/ApResolverService.js';

const contractProjection = projectEndpointContract(inlineApGetDefinition);

export const meta = {
	tags: ['federation'],

	requireAdmin: true,
	requireCredential: true,
	kind: 'read:federation',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineApGetInput, typeof inlineApGetOutput> {
	constructor(
		private apResolverService: ApResolverService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const resolver = await this.apResolverService.createResolver();
			const object = await resolver.resolve(ps.uri);
			return object;
		});
	}
}
