/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserFollowingService } from '../../../services/UserFollowingService.js';

import { relationshipsErrors } from '../../relationships.errors.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class FollowingRequestsCancelOperation {
	constructor(
		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {}

	async execute(ps: RelationshipsInputs['following/requests/cancel'], me: MiLocalUser) {
		// Fetch followee
		const followee = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['following/requests/cancel'].noSuchUser);
			throw err;
		});

		try {
			await this.userFollowingService.cancelFollowRequest(followee, me);
		} catch (err) {
			if (err instanceof IdentifiableError) {
				if (err.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw apiError(relationshipsErrors['following/requests/cancel'].followRequestNotFound);
			}
			throw err;
		}

		return await this.userEntityService.pack(followee.id, me);
	}
}
