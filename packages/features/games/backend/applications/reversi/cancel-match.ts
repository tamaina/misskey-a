/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { reversiCancelMatchInput } from '../../endpoints/reversi/cancel-match.contract.js';

@Injectable()
export class ReversiCancelMatchApplicationService {
	constructor(
		private reversiService: ReversiService,
	) {}

	async execute(ps: v.InferOutput<typeof reversiCancelMatchInput>, me: MiLocalUser) {
		if (ps.userId) {
			await this.reversiService.matchSpecificUserCancel(me, ps.userId);
			return;
		} else {
			await this.reversiService.matchAnyUserCancel(me);
		}
	}
}
