/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminFederationRemoveAllFollowingDefinition, voidAdminFederationRemoveAllFollowingInput, voidAdminFederationRemoveAllFollowingOutput } from '../../../../../../../features/federation/contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { FollowingsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { QueueService } from '../../../../../../../features/runtime/backend/services/QueueService.js';

const contractProjection = projectEndpointContract(voidAdminFederationRemoveAllFollowingDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:federation',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof voidAdminFederationRemoveAllFollowingInput, typeof voidAdminFederationRemoveAllFollowingOutput> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private followingsRepository: FollowingsRepository,

		private queueService: QueueService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const followings = await this.followingsRepository.findBy({
				followerHost: ps.host,
			});

			const pairs = await Promise.all(followings.map(f => Promise.all([
				this.usersRepository.findOneByOrFail({ id: f.followerId }),
				this.usersRepository.findOneByOrFail({ id: f.followeeId }),
			]).then(([from, to]) => [{ id: from.id }, { id: to.id }])));

			this.queueService.createUnfollowJob(pairs.map(p => ({ from: p[0], to: p[1], silent: true })));
		});
	}
}
