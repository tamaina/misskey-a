/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Bull from 'bullmq';
import { McpEventsService } from '@features/mcp/backend/McpEventsService.js';
import { signedHeaders } from '@features/mcp/backend/events-protocol.js';
import type { McpWebhookDeliverJobData } from '@features/runtime/backend/queue/types.js';
import { DI } from '@/di-symbols.js';
import type { WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import type { Config } from '@/config.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import { UserWebhookDeliverJobData } from '@features/runtime/backend/queue/types.js';

@Injectable()
export class UserWebhookDeliverProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,

		private httpRequestService: HttpRequestService,
		private mcpEvents: McpEventsService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('webhook');
	}

	private async processMcp(data: McpWebhookDeliverJobData): Promise<string> {
		const authorize = () => this.mcpEvents.authorizeDelivery(data.webhookId, data.userId, data.generation, data.noteId, data.type);
		const webhook = await authorize();
		if (!webhook) return 'Suppressed';
		const body = JSON.stringify({ eventId: data.eventId, name: data.type === 'mention' ? 'note.mentioned' : 'note.replied',
			timestamp: new Date(data.createdAt).toISOString(), data: { noteId: data.noteId, url: new URL(`/notes/${encodeURIComponent(data.noteId)}`, this.config.url).href }, cursor: null });
		const previous = webhook.mcpPreviousSecretUntil && webhook.mcpPreviousSecretUntil.getTime() > Date.now() ? webhook.mcpPreviousSecret ?? undefined : undefined;
		let response: Awaited<ReturnType<HttpRequestService['sendMcpWebhook']>>;
		try {
			response = await this.httpRequestService.sendMcpWebhook(webhook.url, body, signedHeaders(data.eventId, webhook.id, webhook.secret, body, previous), undefined, async () => {
				const current = await authorize();
				if (!current || current.url !== webhook.url || current.secret !== webhook.secret) throw new Bull.UnrecoverableError('MCP delivery suppressed');
			});
		} catch (error) {
			if (error instanceof Bull.UnrecoverableError) return 'Suppressed';
			// Do not let network errors (which may contain callback URLs) reach queue logs.
			throw new Error('MCP callback request failed');
		}
		await this.webhooksRepository.update({ id: webhook.id, mode: 'mcp', mcpGeneration: data.generation }, { latestSentAt: new Date(), latestStatus: response.status });
		if (response.ok) return 'Success';
		if (response.status === 410) await this.webhooksRepository.update({ id: webhook.id, mode: 'mcp', mcpGeneration: data.generation }, { active: false });
		if (response.status < 500 && response.status !== 408 && response.status !== 429) throw new Bull.UnrecoverableError(`MCP callback status ${response.status}`);
		throw new Error(`MCP callback status ${response.status}`);
	}

	@bindThis
	public async process(job: Bull.Job<UserWebhookDeliverJobData>): Promise<string> {
		if (job.data.mode === 'mcp') return this.processMcp(job.data);
		try {
			this.logger.debug(`delivering ${job.data.webhookId}`);

			const res = await this.httpRequestService.send(job.data.to, {
				method: 'POST',
				headers: {
					'User-Agent': 'Misskey-Hooks',
					'X-Misskey-Host': this.config.host,
					'X-Misskey-Hook-Id': job.data.webhookId,
					'X-Misskey-Hook-Secret': job.data.secret,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					server: this.config.url,
					hookId: job.data.webhookId,
					userId: job.data.userId,
					eventId: job.data.eventId,
					createdAt: job.data.createdAt,
					type: job.data.type,
					body: job.data.content,
				}),
			});

			this.webhooksRepository.update({ id: job.data.webhookId }, {
				latestSentAt: new Date(),
				latestStatus: res.status,
			});

			return 'Success';
		} catch (res) {
			this.webhooksRepository.update({ id: job.data.webhookId }, {
				latestSentAt: new Date(),
				latestStatus: res instanceof StatusError ? res.statusCode : 1,
			});

			if (res instanceof StatusError) {
				// 4xx
				if (!res.isRetryable) {
					throw new Bull.UnrecoverableError(`${res.statusCode} ${res.statusMessage}`);
				}

				// 5xx etc.
				throw new Error(`${res.statusCode} ${res.statusMessage}`);
			} else {
				// DNS error, socket error, timeout ...
				throw res;
			}
		}
	}
}
