/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as Bull from 'bullmq';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { UserWebhookService } from '@features/integrations/backend/services/UserWebhookService.js';
import { UserWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';
import type { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import type { WebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserWebhookPayload } from '@features/integrations/backend/services/UserWebhookService.js';
import type { UserWebhookDeliverJobData } from '@features/runtime/backend/queue/types.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { McpEventsService } from '../../backend/McpEventsService.js';
import type { Config } from '@/config.js';
import type * as Redis from 'ioredis';
vi.mock('@features/federation/backend/services/ApRequestService.js', () => ({ ApRequestCreator: class {} }));
vi.mock('@features/runtime/backend/services/HttpRequestService.js', () => ({ HttpRequestService: class {} }));
vi.mock('@features/runtime/backend/queue/QueueLoggerService.js', () => ({ QueueLoggerService: class {} }));
vi.mock('../../backend/McpEventsService.js', () => ({ McpEventsService: class {} }));
const content = { note: { id: 'note', createdAt: '2026-10-11T12:00:00Z', text: 'PRIVATE_SYNTHETIC_TEXT' } } as UserWebhookPayload<'mention'>;
const mcp = { id: 'sub', userId: 'account', on: ['mention'], mode: 'mcp', secret: 'SYNTHETIC_SECRET', url: 'https://callback.example/path', active: true, mcpGeneration: 'generation', mcpExpiresAt: new Date(Date.now() + 60000) } as MiWebhook;
it('enqueues MCP references only with stable dedup IDs, bounded attempts and expiry suppression', async () => {
	const add = vi.fn(); const queue = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: { add } }) as QueueService;
	await queue.userWebhookDeliver(mcp, 'mention', content); await queue.userWebhookDeliver(mcp, 'mention', content);
	const [, job, options] = add.mock.calls[0]; expect(job.mode).toBe('mcp'); expect(job.noteId).toBe('note');
	expect(job).not.toHaveProperty('content'); expect(job).not.toHaveProperty('secret'); expect(job).not.toHaveProperty('to');
	expect(JSON.stringify(job)).not.toContain('PRIVATE_SYNTHETIC_TEXT'); expect(options.attempts).toBe(4); expect(options.backoff.type).toBe('custom');
	expect(add.mock.calls[1][1].eventId).toBe(job.eventId); expect(options.jobId).toBe(job.eventId);
	await queue.userWebhookDeliver({ ...mcp, mcpExpiresAt: new Date(0) }, 'mention', content); expect(add).toHaveBeenCalledTimes(2);
	await queue.userWebhookDeliver({ ...mcp, mcpGeneration: 'new-generation' }, 'mention', content); expect(add.mock.calls[2][1].eventId).not.toBe(job.eventId);
});
it('reuses existing mention/reply selection, querying MCP state separately from legacy cache', async () => {
	const redis = mockDeep<Redis.Redis>(); const webhooks = mockDeep<WebhooksRepository>(); const queue = mockDeep<QueueService>();
	const legacy = { ...mcp, mode: 'legacy' as const }; const ownMcp = { ...mcp, id: 'mcp' };
	webhooks.findBy.mockImplementation(async where => typeof where === 'object' && 'mode' in where && where.mode === 'mcp' ? [ownMcp] : [legacy]);
	const service = new UserWebhookService(redis, webhooks, queue);
	await service.enqueueUserWebhook('account', 'mention', content);
	expect(queue.userWebhookDeliver).toHaveBeenCalledWith(legacy, 'mention', content); expect(queue.userWebhookDeliver).toHaveBeenCalledWith(ownMcp, 'mention', content);
	expect(webhooks.findBy).toHaveBeenCalledWith({ userId: 'account', mode: 'mcp', active: true });
	await service.enqueueUserWebhook('account', 'mention', content); expect(webhooks.findBy).toHaveBeenCalledTimes(3); service.dispose();
});
it('preserves the legacy payload and headers without entering MCP delivery', async () => {
	const webhooks = mockDeep<WebhooksRepository>(); const http = mockDeep<HttpRequestService>(); const events = mockDeep<McpEventsService>(); const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	http.send.mockResolvedValue({ status: 200 } as never);
	const config = { url: 'https://misskey.example', host: 'misskey.example' } as Config;
	const worker = new UserWebhookDeliverProcessorService(config, webhooks, http, events, logger);
	const data = { type: 'mention', content, webhookId: 'legacy', userId: 'account', to: 'https://legacy.example/hook', secret: 'SYNTHETIC_SECRET', createdAt: 1000, eventId: 'evt' } as const;
	expect(await worker.process({ data } as Bull.Job<UserWebhookDeliverJobData>)).toBe('Success');
	expect(http.send).toHaveBeenCalledWith(data.to, { method: 'POST', headers: { 'User-Agent': 'Misskey-Hooks', 'X-Misskey-Host': config.host, 'X-Misskey-Hook-Id': data.webhookId, 'X-Misskey-Hook-Secret': data.secret, 'Content-Type': 'application/json' },
		body: JSON.stringify({ server: config.url, hookId: data.webhookId, userId: data.userId, eventId: data.eventId, createdAt: data.createdAt, type: data.type, body: data.content }) });
	expect(events.authorizeDelivery).not.toHaveBeenCalled();
});
