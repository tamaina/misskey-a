/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineAdminRelaysAddDefinition, inlineAdminRelaysAddInput, inlineAdminRelaysAddOutput } from '../../../../contract/endpoint-definitions.js';
import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';

import { RelayService } from '../../../services/RelayService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(inlineAdminRelaysAddDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:relays',

	errors: {
		invalidUrl: {
			message: 'Invalid URL',
			code: 'INVALID_URL',
			id: 'fb8c92d3-d4e5-44e7-b3d4-800d5cef8b2c',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminRelaysAddInput, typeof inlineAdminRelaysAddOutput> {
	constructor(
		private relayService: RelayService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			try {
				if (new URL(ps.inbox).protocol !== 'https:') throw new Error('https only');
			} catch {
				throw new ApiError(meta.errors.invalidUrl);
			}

			return await this.relayService.addRelay(ps.inbox);
		});
	}
}
