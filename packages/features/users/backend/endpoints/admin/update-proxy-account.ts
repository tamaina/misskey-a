/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { UserEntityService } from '../../serializers/UserEntityService.js';
import { SystemAccountService } from '../../services/SystemAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class AdminUpdateProxyAccountOperation {
	constructor(
		private userEntityService: UserEntityService,
		private moderationLogService: ModerationLogService,
		private systemAccountService: SystemAccountService,
	) {
	}

	async execute(ps: UsersInputs['admin/update-proxy-account'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const proxy = await this.systemAccountService.updateCorrespondingUserProfile('proxy', {
			description: ps.description,
		});

		const updated = await this.userEntityService.packSelf(proxy.id);

		if (ps.description !== undefined) {
			this.moderationLogService.log(me, 'updateProxyAccountDescription', {
				before: null, //TODO
				after: ps.description,
			});
		}

		return updated;
	}
}
