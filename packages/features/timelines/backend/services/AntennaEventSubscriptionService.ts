/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import type * as Redis from 'ioredis';
import { MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Stateless restoration: every live event reads persisted, unexpired subscriptions. */
@Injectable()
export class AntennaEventSubscriptionService implements OnApplicationBootstrap, OnApplicationShutdown {
	private stopping = false;
	private listening = false;
	private readonly pending = new Set<Promise<void>>();
	constructor(
		@Inject(DI.redisForSub) private readonly redis: Redis.Redis,
		@Inject(DI.webhooksRepository) private readonly webhooks: WebhooksRepository,
		private readonly queue: QueueService,
		private readonly ids: IdService,
	) { }

	private readonly onMessage = (_: string, data: string) => {
		if (this.stopping) return;
		const task = this.receive(data);
		this.pending.add(task);
		void task.then(() => this.pending.delete(task), () => {
			this.pending.delete(task);
			// No callback URLs, grant IDs, signing material or note bodies in logs.
			console.error('Antenna event enqueue failed');
		});
	};

	onApplicationBootstrap() {
		if (this.stopping || this.listening) return;
		this.listening = true; this.redis.on('message', this.onMessage);
	}

	async receive(data: string): Promise<void> {
		if (this.stopping) return;
		let parsed: unknown;
		try { parsed = JSON.parse(data); } catch { return; }
		if (!isObject(parsed) || typeof parsed.channel !== 'string' || !parsed.channel.startsWith('antennaStream:')
			|| !isObject(parsed.message) || parsed.message.type !== 'note' || !isObject(parsed.message.body)
			|| typeof parsed.message.body.id !== 'string') return;
		const antennaId = parsed.channel.slice('antennaStream:'.length);
		const noteId = parsed.message.body.id;
		if (!antennaId || antennaId.length > 32 || !noteId || noteId.length > 32) return;
		const createdAt = this.ids.parse(noteId).date.getTime();
		if (!Number.isFinite(createdAt)) return;
		const subscriptions = await this.webhooks.find({ where: { mode: 'mcp', active: true, mcpAntennaId: antennaId, mcpExpiresAt: MoreThan(new Date()) },
			select: { id: true, userId: true, mode: true, active: true, mcpAntennaId: true, mcpGeneration: true, mcpExpiresAt: true } });
		for (const subscription of subscriptions) {
			if (this.stopping) return;
			await this.queue.antennaWebhookDeliver(subscription, antennaId, noteId, createdAt);
		}
	}

	async onApplicationShutdown() {
		this.stopping = true;
		this.redis.off('message', this.onMessage);
		await Promise.allSettled([...this.pending]);
	}
}
