/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedReversiShowGameDefinition, packedReversiShowGameInput, packedReversiShowGameOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedReversiShowGameDefinition);

export const meta = {
	requireCredential: false,

	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: 'f13a03db-fae1-46c9-87f3-43c8165419e1',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedReversiShowGameInput, typeof packedReversiShowGameOutput> {
	constructor(
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const game = await this.reversiService.get(ps.gameId);

			if (game == null) {
				throw new ApiError(meta.errors.noSuchGame);
			}

			return await this.reversiGameEntityService.packDetail(game);
		});
	}
}
