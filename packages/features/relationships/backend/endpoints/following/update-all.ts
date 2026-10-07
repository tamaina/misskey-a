/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidFollowingUpdateAllDefinition, voidFollowingUpdateAllInput, voidFollowingUpdateAllOutput } from '../../../contract/void-endpoint-definitions.js';
import ms from '@/runtime-dependencies/ms.js';
import { Inject, Injectable } from '@nestjs/common';

import type { FollowingsRepository } from '@/models/_.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { UserFollowingService } from '../../services/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidFollowingUpdateAllDefinition);

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	requireCredential: true,

	kind: 'write:following',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidFollowingUpdateAllInput, typeof voidFollowingUpdateAllOutput> {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.followingsRepository.update({
				followerId: me.id,
			}, {
				notify: ps.notify != null ? (ps.notify === 'none' ? null : ps.notify) : undefined,
				withReplies: ps.withReplies != null ? ps.withReplies : undefined,
			});

			return;
		});
	}
}
