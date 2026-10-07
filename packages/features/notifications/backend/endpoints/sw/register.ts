/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineSwRegisterDefinition, inlineSwRegisterInput, inlineSwRegisterOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiMeta, SwSubscriptionsRepository } from '@/models/_.js';

import { DI } from '@/di-symbols.js';
import { PushNotificationService } from '../../services/PushNotificationService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(inlineSwRegisterDefinition);

export const meta = {
	tags: ['account'],

	requireCredential: true,
	secure: true,

	description: 'Register to receive push notifications.',

	res: contractProjection.response,

	errors: {
		invalidEndpoint: {
			message: 'Invalid push endpoint.',
			code: 'INVALID_ENDPOINT',
			id: '4432adbe-17c0-4f9f-b43c-9ceb2f8910fe',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineSwRegisterInput, typeof inlineSwRegisterOutput> {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		private idService: IdService,
		private pushNotificationService: PushNotificationService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (!this.pushNotificationService.isValidEndpoint(ps.endpoint)) {
				throw new ApiError(meta.errors.invalidEndpoint);
			}

			// if already subscribed
			const exist = await this.swSubscriptionsRepository.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
			});

			if (exist != null) {
				return {
					state: 'already-subscribed' as const,
					key: this.serverSettings.swPublicKey,
					userId: me.id,
					endpoint: exist.endpoint,
					sendReadMessage: exist.sendReadMessage,
				};
			}

			await this.swSubscriptionsRepository.insert({
				id: this.idService.gen(),
				userId: me.id,
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
				sendReadMessage: ps.sendReadMessage,
			});

			this.pushNotificationService.refreshCache(me.id);

			return {
				state: 'subscribed' as const,
				key: this.serverSettings.swPublicKey,
				userId: me.id,
				endpoint: ps.endpoint,
				sendReadMessage: ps.sendReadMessage,
			};
		});
	}
}
