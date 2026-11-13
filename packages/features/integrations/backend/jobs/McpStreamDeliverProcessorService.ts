/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import * as Bull from 'bullmq';
import { McpStreamAccessService } from '@features/mcp/backend/McpStreamAccessService.js';
import { signedHeaders } from '@features/mcp/backend/events-protocol.js';
import { STREAM_QUEUE_MAX_AGE_MS } from '@features/mcp/backend/stream-queue-admission.js';
import type { McpStreamDeliverJobData } from '@features/runtime/backend/queue/types.js';
import type { WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';

@Injectable()
export class McpStreamDeliverProcessorService {
	constructor(
		@Inject(DI.webhooksRepository) private webhooksRepository: WebhooksRepository,
		private httpRequestService: HttpRequestService,
		private access: McpStreamAccessService,
	) {}

	public async process(job: Bull.Job<McpStreamDeliverJobData>): Promise<string> {
		const data = job.data;
		const authorize = async () => {
			try { return await this.access.authorize(data.webhookId, data.userId, data.generation, data.source); } catch { throw new Error('MCP stream authorization failed'); }
		};
		const ageLimit = /^statisticsStream:(serverStats|queueStats)$/.test(data.source.channel) ? 30000 : STREAM_QUEUE_MAX_AGE_MS;
		const fresh = () => Number.isFinite(data.source.createdAt) && data.source.createdAt >= 0 && data.source.createdAt <= Date.now() && Date.now() - data.source.createdAt <= ageLimit;
		if (!fresh()) return 'Expired';
		const authorized = await authorize();
		if (!authorized || authorized.frames.length === 0) return 'Suppressed';
		const { webhook, frames } = authorized;
		const name = webhook.mcpStream?.channel === 'broadcast' ? 'stream.broadcast'
			: webhook.mcpStream?.channel === 'note' ? 'stream.note' : 'stream.channel';
		const projection = JSON.stringify(frames);
		const body = JSON.stringify({ eventId: data.eventId, name, timestamp: new Date(data.source.createdAt).toISOString(),
			data: { frames }, cursor: null });
		const previous = webhook.mcpPreviousSecretUntil && webhook.mcpPreviousSecretUntil.getTime() > Date.now()
			? webhook.mcpPreviousSecret ?? undefined : undefined;
		let response: Awaited<ReturnType<HttpRequestService['sendMcpWebhook']>>;
		try {
			response = await this.httpRequestService.sendMcpWebhook(webhook.url, body,
				signedHeaders(data.eventId, webhook.id, webhook.secret, body, previous), undefined, async () => {
					if (!fresh()) throw new Bull.UnrecoverableError('MCP stream expired');
					const current = await authorize();
					if (!current || current.frames.length === 0) throw new Bull.UnrecoverableError('MCP stream suppressed');
					if (current.webhook.url !== webhook.url || current.webhook.secret !== webhook.secret
						|| JSON.stringify(current.frames) !== projection) throw new Error('MCP stream state changed');
				});
		} catch (error) {
			if (error instanceof Bull.UnrecoverableError) return 'Suppressed';
			// Network/authorization errors must not persist URLs or sensitive payloads.
			throw new Error('MCP stream callback request failed');
		}
		await this.webhooksRepository.update({ id: webhook.id, mode: 'mcp', mcpGeneration: data.generation },
			{ latestSentAt: new Date(), latestStatus: response.status });
		if (response.ok) return 'Success';
		if (response.status === 410) await this.webhooksRepository.update({ id: webhook.id, mode: 'mcp', mcpGeneration: data.generation }, { active: false });
		if (response.status < 500 && response.status !== 408 && response.status !== 429) throw new Bull.UnrecoverableError(`MCP callback status ${response.status}`);
		throw new Error(`MCP callback status ${response.status}`);
	}
}
