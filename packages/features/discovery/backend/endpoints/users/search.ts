/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { UserSearchService } from '../../services/UserSearchService.js';
import type { DiscoveryInputs } from '../discovery.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersSearchOperation {
	constructor(
		private userEntityService: UserEntityService,
		private userSearchService: UserSearchService,
	) {
	}

	async execute(ps: DiscoveryInputs['users/search'], me: MiLocalUser | null) {
		const users = await this.userSearchService.search(ps.query.trim(), me?.id ?? null, {
			offset: ps.offset,
			limit: ps.limit,
			origin: ps.origin,
		});

		return await this.userEntityService.packMany(users, me, { schema: ps.detail ? 'UserDetailed' : 'UserLite' });
	}
}
