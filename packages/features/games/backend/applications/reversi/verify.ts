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
import { type reversiVerifyContract, reversiVerifyErrors } from '../../endpoints/reversi/verify.contract.js';

@Injectable()
export class ReversiVerifyApplicationService {
	constructor(
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof reversiVerifyContract)['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
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
	}
}
