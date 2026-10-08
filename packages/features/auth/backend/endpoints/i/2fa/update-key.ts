/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { emptyObjectI2faUpdateKeyDefinition, emptyObjectI2faUpdateKeyInput, emptyObjectI2faUpdateKeyOutput } from '../../../../contract/empty-object-key-endpoint-definitions.js';
import type { UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(emptyObjectI2faUpdateKeyDefinition);

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

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof emptyObjectI2faUpdateKeyInput, typeof emptyObjectI2faUpdateKeyOutput> {
	constructor(
		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const key = await this.userSecurityKeysRepository.findOneBy({
				id: ps.credentialId,
			});

			if (key == null) {
				throw new ApiError(meta.errors.noSuchKey);
			}

			if (key.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.userSecurityKeysRepository.update(key.id, {
				name: ps.name,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {};
		});
	}
}
