/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { RelayService } from '../../../services/RelayService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminRelaysListInput, adminRelaysListOutput } from './list.contract.js';

@Injectable()
export class AdminRelaysListApplicationService {
	constructor(
		private relayService: RelayService,
	) {}

	public async execute(_ps: v.InferOutput<typeof adminRelaysListInput>, _me: MiUser): Promise<v.InferOutput<typeof adminRelaysListOutput>> {
		const result = await (async () => {
			return await this.relayService.listRelay();
		})();
		return v.parse(adminRelaysListOutput, result);
	}
}
