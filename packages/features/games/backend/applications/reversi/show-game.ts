/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type reversiShowGameContract, reversiShowGameErrors } from '../../endpoints/reversi/show-game.contract.js';

@Injectable()
export class ReversiShowGameApplicationService {
	constructor(
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof reversiShowGameContract)['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const game = await this.reversiService.get(ps.gameId);

		if (game == null) {
			throw apiError(reversiShowGameErrors.noSuchGame);
		}

		return await this.reversiGameEntityService.packDetail(game);
	}
}
