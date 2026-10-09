/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { RelayService } from '../../../services/RelayService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminRelaysRemoveInput, AdminRelaysRemoveOutput } from './remove.contract.js';
import { adminRelaysRemoveContract } from './remove.contract.js';

@Injectable()
export class AdminRelaysRemoveApplicationService {
	constructor(
		private relayService: RelayService,
	) {}

	public async execute(ps: AdminRelaysRemoveInput, _me: MiUser): Promise<AdminRelaysRemoveOutput> {
		const result = await (async () => {
			return await this.relayService.removeRelay(ps.inbox);
		})();
		return v.parse(adminRelaysRemoveContract['~orpc'].outputSchema!, result);
	}
}
