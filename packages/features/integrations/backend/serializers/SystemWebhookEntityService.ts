/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In } from 'typeorm';
import type { MiSystemWebhook, SystemWebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { Packed } from '@features/index/backend/packed.schema.js';

export class SystemWebhookEntityService {
	constructor(
		private systemWebhooksRepository: SystemWebhooksRepository,
	) {
	}

	@bindThis
	public async pack(
		src: MiSystemWebhook['id'] | MiSystemWebhook,
		opts?: {
			webhooks: Map<string, MiSystemWebhook>
		},
	): Promise<Packed<'SystemWebhook'>> {
		const webhook = typeof src === 'object'
			? src
			: opts?.webhooks.get(src) ?? await this.systemWebhooksRepository.findOneByOrFail({ id: src });

		return {
			id: webhook.id,
			isActive: webhook.isActive,
			updatedAt: webhook.updatedAt.toISOString(),
			latestSentAt: webhook.latestSentAt?.toISOString() ?? null,
			latestStatus: webhook.latestStatus,
			name: webhook.name,
			on: webhook.on,
			url: webhook.url,
			secret: webhook.secret,
		};
	}

	@bindThis
	public async packMany(src: MiSystemWebhook['id'][] | MiSystemWebhook[]): Promise<Packed<'SystemWebhook'>[]> {
		if (src.length === 0) {
			return [];
		}

		const webhooks = Array.of<MiSystemWebhook>();
		webhooks.push(
			...src.filter((it): it is MiSystemWebhook => typeof it === 'object'),
		);

		const ids = src.filter((it): it is MiSystemWebhook['id'] => typeof it === 'string');
		if (ids.length > 0) {
			webhooks.push(
				...await this.systemWebhooksRepository.findBy({ id: In(ids) }),
			);
		}

		return Promise
			.all(
				webhooks.map(x =>
					this.pack(x, {
						webhooks: new Map(webhooks.map(x => [x.id, x])),
					}),
				),
			)
			.then(it => it.sort((a, b) => a.id.localeCompare(b.id)));
	}
}
