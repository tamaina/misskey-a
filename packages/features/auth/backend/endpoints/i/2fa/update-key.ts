/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import type { UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { emptyObjectI2faUpdateKeyInput } from '../../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: 'f9c5467f-d492-4d3c-9a8g-a70dacc86512',
		},

		accessDenied: {
			message: 'You do not have edit privilege of this key.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fff-b8df-057708cce513',
		},
	},
} as const;

@Injectable()
export class I2faUpdateKeyOperation {
	constructor(
		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<typeof emptyObjectI2faUpdateKeyInput>, me: MiLocalUser) {
		const key = await this.userSecurityKeysRepository.findOneBy({
			id: ps.credentialId,
		});

		if (key == null) {
			throw apiError(meta.errors.noSuchKey);
		}

		if (key.userId !== me.id) {
			throw apiError(meta.errors.accessDenied);
		}

		await this.userSecurityKeysRepository.update(key.id, {
			name: ps.name,
		});

		// Publish meUpdated event
		this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.packSelf(me.id, {
			includeSecrets: true,
		}));

		return {};
	}
}
