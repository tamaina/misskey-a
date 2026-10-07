/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedReversiMatchDefinition, packedReversiMatchInput, packedReversiMatchOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { GetterService } from '@/server/api/GetterService.js';

const contractProjection = projectEndpointContract(packedReversiMatchDefinition);

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '0b4f0559-b484-4e31-9581-3f73cee89b28',
		},

		isYourself: {
			message: 'Target user is yourself.',
			code: 'TARGET_IS_YOURSELF',
			id: '96fd7bd6-d2bc-426c-a865-d055dcd2828e',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedReversiMatchInput, typeof packedReversiMatchOutput> {
	constructor(
		private getterService: GetterService,
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (ps.userId === me.id) throw new ApiError(meta.errors.isYourself);

			const target = ps.userId ? await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			}) : null;

			const game = target
				? await this.reversiService.matchSpecificUser(me, target, ps.multiple)
				: await this.reversiService.matchAnyUser(me, { noIrregularRules: ps.noIrregularRules }, ps.multiple);

			if (game == null) return;

			return await this.reversiGameEntityService.packDetail(game);
		});
	}
}
