/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DiscoveryInputs } from '../discovery.contract.js';
import { Injectable } from '@nestjs/common';
import { UserSearchService } from '../../services/UserSearchService.js';

@Injectable()
export class UsersSearchByUsernameAndHostOperation {
	constructor(
		private userSearchService: UserSearchService,
	) {
	}

	async execute(ps: DiscoveryInputs['users/search-by-username-and-host'], me: MiLocalUser | null) {
		return this.userSearchService.searchByUsernameAndHost({
			username: 'username' in ps ? ps.username : undefined,
			host: 'host' in ps ? ps.host : undefined,
		}, {
			limit: ps.limit,
			detail: ps.detail,
		}, me);
	}
}
