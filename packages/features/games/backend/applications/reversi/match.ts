/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';
import { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { reversiMatchInput, reversiMatchErrors } from '../../endpoints/reversi/match.contract.js';

@Injectable()
export class ReversiMatchApplicationService {
	constructor(
		private getterService: GetterService,
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof reversiMatchInput>, me: MiLocalUser) {
		if (ps.userId === me.id) throw apiError(reversiMatchErrors.isYourself);

		const target = ps.userId ? await this.getterService.getUser(ps.userId).catch((err: unknown) => {
			if (err !== null && typeof err === 'object' && 'id' in err && err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(reversiMatchErrors.noSuchUser);
			throw err;
		}) : null;

		const game = target
			? await this.reversiService.matchSpecificUser(me, target, ps.multiple)
			: await this.reversiService.matchAnyUser(me, { noIrregularRules: ps.noIrregularRules }, ps.multiple);

		if (game == null) return;

		return await this.reversiGameEntityService.packDetail(game);
	}
}
