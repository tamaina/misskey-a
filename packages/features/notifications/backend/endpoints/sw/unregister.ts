/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidSwUnregisterDefinition, voidSwUnregisterInput, voidSwUnregisterOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import type { SwSubscriptionsRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { PushNotificationService } from '../../services/PushNotificationService.js';

const contractProjection = projectEndpointContract(voidSwUnregisterDefinition);

export const meta = {
	tags: ['account'],

	// ブラウザ側の購読解除時に、同一ブラウザに登録された全アカウント分の登録を消せるように、
	// 資格情報ではなく購読のauth secret (RFC 8291) で所有を確認する
	requireCredential: false,

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	description: 'Unregister from receiving push notifications.',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidSwUnregisterInput, typeof voidSwUnregisterOutput> {
	constructor(
		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		private pushNotificationService: PushNotificationService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const subscriptions = await this.swSubscriptionsRepository.findBy({
				...(me ? { userId: me.id } : {}),
				endpoint: ps.endpoint,
				auth: ps.auth,
				publickey: ps.publickey,
			});

			if (subscriptions.length === 0) return;

			await this.swSubscriptionsRepository.delete(subscriptions.map(s => s.id));

			for (const userId of new Set(subscriptions.map(s => s.userId))) {
				this.pushNotificationService.refreshCache(userId);
			}
		});
	}
}
