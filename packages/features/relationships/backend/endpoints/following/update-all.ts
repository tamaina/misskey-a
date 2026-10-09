/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { DI } from '@/di-symbols.js';
import { UserFollowingService } from '../../services/UserFollowingService.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class FollowingUpdateAllOperation {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
	) {}

	async execute(ps: RelationshipsInputs['following/update-all'], me: MiLocalUser) {
		await this.followingsRepository.update({
			followerId: me.id,
		}, {
			notify: ps.notify != null ? (ps.notify === 'none' ? null : ps.notify) : undefined,
			withReplies: ps.withReplies != null ? ps.withReplies : undefined,
		});

		return;
	}
}
