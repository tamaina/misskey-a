/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedReversiVerifyDefinition, packedReversiVerifyInput, packedReversiVerifyOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedReversiVerifyDefinition);

export const meta = {
	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: '8fb05624-b525-43dd-90f7-511852bdfeee',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedReversiVerifyInput, typeof packedReversiVerifyOutput> {
	constructor(
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const game = await this.reversiService.checkCrc(ps.gameId, ps.crc32);
			if (game) {
				return {
					desynced: true,
					game: await this.reversiGameEntityService.packDetail(game),
				};
			} else {
				return {
					desynced: false,
				};
			}
		});
	}
}
