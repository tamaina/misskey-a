/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';

import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserMutingService } from '../../services/UserMutingService.js';

import { relationshipsErrors } from '../relationships.errors.js';
import type { MutingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class MuteCreateOperation {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private getterService: GetterService,
		private userMutingService: UserMutingService,
	) {}

	async execute(ps: RelationshipsInputs['mute/create'], me: MiLocalUser) {
		const muter = me;

		// 自分自身
		if (me.id === ps.userId) {
			throw apiError(relationshipsErrors['mute/create'].muteeIsYourself);
		}

		// Get mutee
		const mutee = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['mute/create'].noSuchUser);
			throw err;
		});

		// Check if already muting
		const exist = await this.mutingsRepository.exists({
			where: {
				muterId: muter.id,
				muteeId: mutee.id,
			},
		});

		if (exist) {
			throw apiError(relationshipsErrors['mute/create'].alreadyMuting);
		}

		if (ps.expiresAt && ps.expiresAt <= Date.now()) {
			return;
		}

		await this.userMutingService.mute(muter, mutee, ps.expiresAt ? new Date(ps.expiresAt) : null);
	}
}
