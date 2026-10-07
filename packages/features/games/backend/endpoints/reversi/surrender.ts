/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidReversiSurrenderDefinition, voidReversiSurrenderInput, voidReversiSurrenderOutput } from '../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(voidReversiSurrenderDefinition);

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: 'ace0b11f-e0a6-4076-a30d-e8284c81b2df',
		},

		alreadyEnded: {
			message: 'That game has already ended.',
			code: 'ALREADY_ENDED',
			id: '6c2ad4a6-cbf1-4a5b-b187-b772826cfc6d',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '6e04164b-a992-4c93-8489-2123069973e1',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidReversiSurrenderInput, typeof voidReversiSurrenderOutput> {
	constructor(
		private reversiService: ReversiService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const game = await this.reversiService.get(ps.gameId);

			if (game == null) {
				throw new ApiError(meta.errors.noSuchGame);
			}

			if (game.isEnded) {
				throw new ApiError(meta.errors.alreadyEnded);
			}

			if ((game.user1Id !== me.id) && (game.user2Id !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.reversiService.surrender(game.id, me);
		});
	}
}
