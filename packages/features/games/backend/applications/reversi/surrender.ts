/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { reversiSurrenderInput, reversiSurrenderErrors } from '../../endpoints/reversi/surrender.contract.js';

@Injectable()
export class ReversiSurrenderApplicationService {
	constructor(
		private reversiService: ReversiService,
	) {}

	async execute(ps: v.InferOutput<typeof reversiSurrenderInput>, me: MiLocalUser) {
		const game = await this.reversiService.get(ps.gameId);

		if (game == null) {
			throw apiError(reversiSurrenderErrors.noSuchGame);
		}

		if (game.isEnded) {
			throw apiError(reversiSurrenderErrors.alreadyEnded);
		}

		if ((game.user1Id !== me.id) && (game.user2Id !== me.id)) {
			throw apiError(reversiSurrenderErrors.accessDenied);
		}

		await this.reversiService.surrender(game.id, me);
	}
}
