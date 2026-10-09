/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { RelayService } from '../../../services/RelayService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminRelaysRemoveInput, adminRelaysRemoveOutput } from './remove.contract.js';

@Injectable()
export class AdminRelaysRemoveApplicationService {
	constructor(
		private relayService: RelayService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminRelaysRemoveInput>, _me: MiUser): Promise<v.InferOutput<typeof adminRelaysRemoveOutput>> {
		const result = await (async () => {
			return await this.relayService.removeRelay(ps.inbox);
		})();
		return v.parse(adminRelaysRemoveOutput, result);
	}
}
