/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { AchievementService } from '../../services/AchievementService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class IClaimAchievementOperation {
	constructor(
		private achievementService: AchievementService,
	) {
	}

	async execute(ps: UsersInputs['i/claim-achievement'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		await this.achievementService.create(me.id, ps.name);
	}
}
