/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { MoreThan, Not, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { McpStreamAccessService } from './McpStreamAccessService.js';
import { acceptsSource, reduceOccurrence } from './stream-catalog.js';
import { isJsonObject } from '@features/runtime/backend/formatting/json-value.js';
import type { WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import type { StreamOccurrence } from './stream-types.js';
import type { JsonValue } from '@features/runtime/backend/formatting/json-value.js';
import type * as Redis from 'ioredis';

/** Stateless restoration: startup listens, every future occurrence reads persisted rows. */
@Injectable()
export class McpStreamSubscriptionService implements OnApplicationBootstrap, OnApplicationShutdown {
	private stopping = false;
	private listening = false;
	private tail: Promise<void> = Promise.resolve();
	private pending = 0;
	public dropped = 0;
	constructor(@Inject(DI.redisForSub) private readonly redis: Redis.Redis,
		@Inject(DI.webhooksRepository) private readonly webhooks: WebhooksRepository,
		private readonly access: McpStreamAccessService, private readonly queue: QueueService) { }
	private readonly onMessage = (_: string, data: string) => {
		if (this.stopping) return;
		// Bounded FIFO ingress. Overflow is best-effort loss, never unbounded memory.
		if (this.pending >= 32) { this.dropped++; return; }
		this.pending++;
		this.tail = this.tail.then(() => this.receive(data)).catch(() => { this.dropped++; console.error('MCP stream enqueue failed'); }).finally(() => { this.pending--; });
	};
	onApplicationBootstrap() {
		if (this.stopping || this.listening) return;
		this.listening = true; this.redis.on('message', this.onMessage);
	}
	async receive(data: string) {
		if (this.stopping || Buffer.byteLength(data) > 262144) return;
		let parsed: JsonValue; try { parsed = JSON.parse(data); } catch { return; }
		if (!isJsonObject(parsed) || typeof parsed.channel !== 'string' || typeof parsed.occurrenceId !== 'string' || typeof parsed.createdAt !== 'number' || parsed.message === undefined) return;
		const source = reduceOccurrence({ id: parsed.occurrenceId, createdAt: parsed.createdAt, channel: parsed.channel, message: parsed.message } satisfies StreamOccurrence);
		if (!source) return;
		if (source.createdAt > Date.now() + 5000 || source.createdAt < Date.now() - 900000) return;
		// Page bounded reads; no process-local subscription registry or grants to restore.
		for (let skip = 0; !this.stopping; skip += 128) {
			const rows = await this.webhooks.find({ where: { mode: 'mcp', active: true, mcpStream: Not(IsNull()), mcpExpiresAt: MoreThan(new Date()) },
				order: { id: 'ASC' }, skip, take: 128 });
			for (const row of rows) {
				if (this.stopping) return;
				if (!row.mcpStream || !row.mcpGeneration || !acceptsSource(row.mcpStream, source.channel)) continue;
				try {
					const authorized = await this.access.authorize(row.id, row.userId, row.mcpGeneration, source);
					if (this.stopping) return;
					if (!authorized) continue;
					const result = await this.queue.streamWebhookDeliver(authorized.webhook, source);
					if (result === 'full') this.dropped++;
				} catch { this.dropped++; console.error('MCP stream subscription enqueue failed'); }
			}
			if (rows.length < 128) break;
		}
	}
	async onApplicationShutdown() { this.stopping = true; this.redis.off('message', this.onMessage); await this.tail; }
}
