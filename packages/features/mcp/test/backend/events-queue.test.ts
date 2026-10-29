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
	webhooks.findOne.mockResolvedValue({ mode: 'legacy' } as MiWebhook);
	http.send.mockResolvedValue({ status: 200 } as never);
	const config = { url: 'https://misskey.example', host: 'misskey.example' } as Config;
	const worker = new UserWebhookDeliverProcessorService(config, webhooks, http, events, logger);
	const data = { type: 'mention', content, webhookId: 'legacy', userId: 'account', to: 'https://legacy.example/hook', secret: 'SYNTHETIC_SECRET', createdAt: 1000, eventId: 'evt' } as const;
	expect(await worker.process({ data } as Bull.Job<UserWebhookDeliverJobData>)).toBe('Success');
	expect(http.send).toHaveBeenCalledWith(data.to, { method: 'POST', headers: { 'User-Agent': 'Misskey-Hooks', 'X-Misskey-Host': config.host, 'X-Misskey-Hook-Id': data.webhookId, 'X-Misskey-Hook-Secret': data.secret, 'Content-Type': 'application/json' },
		body: JSON.stringify({ server: config.url, hookId: data.webhookId, userId: data.userId, eventId: data.eventId, createdAt: data.createdAt, type: data.type, body: data.content }) });
	expect(events.authorizeDelivery).not.toHaveBeenCalled();
});

it.each([true, false, null])('suppresses mode-less legacy jobs for MCP rows (active=%s) or deleted grants', async active => {
	const webhooks = mockDeep<WebhooksRepository>(); const http = mockDeep<HttpRequestService>(); const events = mockDeep<McpEventsService>(); const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	webhooks.findOne.mockResolvedValue(active === null ? null : { ...mcp, active });
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, webhooks, http, events, logger);
	const data = { type: 'mention', content, webhookId: 'sub', userId: 'account', to: mcp.url, secret: mcp.secret, createdAt: 1000, eventId: 'old-producer' } as const;
	expect(await worker.process({ data } as Bull.Job<UserWebhookDeliverJobData>)).toBe('Suppressed');
	expect(webhooks.findOne).toHaveBeenCalledWith({ where: { id: 'sub' }, select: { mode: true } });
	expect(http.send).not.toHaveBeenCalled(); expect(http.sendMcpWebhook).not.toHaveBeenCalled();
	expect(webhooks.update).not.toHaveBeenCalled();
});

it.each(['subscribedNote', 'quote', 'login', 'createToken'] as const)('queues only notification references for MCP %s', async type => {
	const add = vi.fn(); const queue = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: { add } }) as QueueService;
	const notification = { id: 'notification', type: type === 'subscribedNote' ? 'note' : type, createdAt: '2026-10-23T00:00:00Z', body: 'PRIVATE', token: 'SECRET', ip: '192.0.2.1' } as UserWebhookPayload<typeof type>['notification'];
	await queue.userWebhookDeliver({ ...mcp, on: [type] }, type, { notification });
	const job = add.mock.calls[0][1];
	expect(job.data).toEqual({ notificationId: 'notification', notificationType: notification.type });
	expect(JSON.stringify(job)).not.toMatch(/PRIVATE|SECRET|192\.0\.2\.1/);
});

it('selects MCP reaction subscriptions even when the recipient owns the reacted note', async () => {
	const redis = mockDeep<Redis.Redis>(); const webhooks = mockDeep<WebhooksRepository>(); const queue = mockDeep<QueueService>();
	const row = { ...mcp, on: ['reaction'] } as MiWebhook;
	webhooks.findBy.mockResolvedValue([row]);
	const service = new UserWebhookService(redis, webhooks, queue);
	const payload = { note: { ...content.note, userId: 'account' }, user: { id: 'reactor' }, reaction: '👍' } as UserWebhookPayload<'reaction'>;
	await service.enqueueUserWebhook('account', 'reaction', payload);
	expect(queue.userWebhookDeliver).toHaveBeenCalledWith(row, 'reaction', payload); service.dispose();
});

it('sends canonical notification references with the MCP envelope and rechecks before opening the connection', async () => {
	const webhooks = mockDeep<WebhooksRepository>(); const http = mockDeep<HttpRequestService>(); const events = mockDeep<McpEventsService>(); const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const row = { ...mcp, name: 'login', secret: 'whsec_' + Buffer.alloc(32, 42).toString('base64') };
	events.authorizeDelivery.mockResolvedValue(row);
	http.sendMcpWebhook.mockImplementation(async (_url, body, _headers, _signal, beforeSend) => {
		await beforeSend?.();
		expect(JSON.parse(body)).toEqual({ eventId: 'event', name: 'login', timestamp: '1970-01-01T00:00:01.000Z', data: { notificationId: 'notification', notificationType: 'login' }, cursor: null });
		return { status: 200, ok: true, text: '' };
	});
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, webhooks, http, events, logger);
	const data = { mode: 'mcp', type: 'login', webhookId: row.id, userId: row.userId, generation: 'generation', noteId: '', createdAt: 1000, eventId: 'event', data: { notificationId: 'notification', notificationType: 'login' } } as const;
	expect(await worker.process({ data } as unknown as Bull.Job<UserWebhookDeliverJobData>)).toBe('Success');
	expect(events.authorizeDelivery).toHaveBeenCalledTimes(2);
	expect(events.authorizeDelivery).toHaveBeenCalledWith(row.id, row.userId, 'generation', '', 'login', undefined, data.data);
});

it('does not collapse separate reaction notifications on the same note', async () => {
	const add = vi.fn(); const queue = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: { add } }) as QueueService;
	const payload = { note: content.note, user: { id: 'reactor' }, reaction: '👍' } as UserWebhookPayload<'reaction'>;
	for (const id of ['notification1', 'notification2', 'notification1']) await queue.userWebhookDeliver(mcp, 'reaction', payload, { notification: { id, type: 'reaction', createdAt: '2026-10-23T00:00:00Z' } });
	expect(add.mock.calls[0][1].eventId).not.toBe(add.mock.calls[1][1].eventId);
	expect(add.mock.calls[0][1].eventId).toBe(add.mock.calls[2][1].eventId);
	expect(add.mock.calls[0][1].data).toEqual({ noteId: 'note', notificationId: 'notification1', notificationType: 'reaction' });
});

it.each(['user', 'room'])('queues only message references for received %s chat', async destination => {
	const add = vi.fn(); const queue = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: { add } }) as QueueService;
	const message = { id: 'message', fromUserId: 'sender', text: 'PRIVATE_CHAT', ...(destination === 'user' ? { toUserId: 'account' } : { toRoomId: 'room' }) } as UserWebhookPayload<'chatMessage'>['message'];
	await queue.userWebhookDeliver(mcp, 'chatMessage', { message });
	expect(add.mock.calls[0][1].data).toEqual({ messageId: 'message' });
	expect(JSON.stringify(add.mock.calls[0][1])).not.toContain('PRIVATE_CHAT');
});
