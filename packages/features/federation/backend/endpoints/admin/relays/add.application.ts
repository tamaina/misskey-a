/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';
import { RelayService } from '../../../services/RelayService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminRelaysAddInput, AdminRelaysAddOutput } from './add.contract.js';
import { adminRelaysAddContract, adminRelaysAddErrors } from './add.contract.js';

@Injectable()
export class AdminRelaysAddApplicationService {
	constructor(
		private relayService: RelayService,
	) {}

	public async execute(ps: AdminRelaysAddInput, _me: MiUser): Promise<AdminRelaysAddOutput> {
		const result = await (async () => {
			try {
				if (new URL(ps.inbox).protocol !== 'https:') throw new Error('https only');
			} catch {
				throw apiError(adminRelaysAddErrors.invalidUrl);
			}

			return await this.relayService.addRelay(ps.inbox);
		})();
		return v.parse(adminRelaysAddContract['~orpc'].outputSchema!, result);
	}
}
