/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { createHmac } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import * as Bull from 'bullmq';
import { McpEventsService } from '../../backend/McpEventsService.js';
import { McpEventError, challengeMatches, signedHeaders, signingKey, subscriptionId } from '../../backend/events-protocol.js';
import { subscribeInput } from '../../backend/api.definition.js';
import { modernRequest } from '../../backend/modern-request.js';
import { UserWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';
import { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { WebhooksRepository, AccessTokensRepository, AppsRepository, UsersRepository, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { Config } from '@/config.js';
import type { UserWebhookDeliverJobData } from '@features/runtime/backend/queue/types.js';
vi.mock('@features/runtime/backend/services/HttpRequestService.js', () => ({ HttpRequestService: class {} }));
vi.mock('@features/roles/backend/services/RoleService.js', () => ({ RoleService: class {} }));
vi.mock('@features/notes/backend/serializers/NoteEntityService.js', () => ({ NoteEntityService: class {} }));
vi.mock('@features/runtime/backend/queue/QueueLoggerService.js', () => ({ QueueLoggerService: class {} }));
const secret = 'whsec_' + Buffer.alloc(32, 42).toString('base64');
const input = { name: 'note.mentioned' as const, arguments: {}, delivery: { mode: 'webhook' as const, url: 'https://callback.example/events', secret }, cursor: null, ttlMs: 3600000 };
const stores = () => ({ webhooks: mockDeep<WebhooksRepository>(), tokens: mockDeep<AccessTokensRepository>(), apps: mockDeep<AppsRepository>(), users: mockDeep<UsersRepository>(), notes: mockDeep<NotesRepository>(), http: mockDeep<HttpRequestService>(), roles: mockDeep<RoleService>(), noteEntity: mockDeep<NoteEntityService>() });
let deps: ReturnType<typeof stores>;
let service: McpEventsService;
let rows: Map<string, MiWebhook>;
let actor: MiLocalUser;
let permission: string[];
beforeEach(() => {
	deps = stores(); rows = new Map(); permission = ['access:mcp', 'read:notifications'];
	actor = { id: 'account', host: null, isSuspended: false, movedToUri: null } as MiLocalUser;
	deps.users.findOneBy.mockImplementation(async where => !Array.isArray(where) && where.id === actor.id ? actor : null);
	deps.tokens.findOneBy.mockImplementation(async where => !Array.isArray(where) && where.id === 'grant' && where.userId === actor.id ? { id: 'grant', userId: actor.id, appId: null, permission } as never : null);
	deps.roles.getUserPolicies.mockResolvedValue({ webhookLimit: 5 } as never);
	const query = mockDeep<ReturnType<WebhooksRepository['createQueryBuilder']>>();
	let queryId = '';
	query.addSelect.mockReturnValue(query); query.setLock.mockReturnValue(query);
	query.where.mockImplementation((_sql, values) => { queryId = values?.id; return query; });
	query.getOne.mockImplementation(async () => rows.get(queryId) ?? null); query.getOneOrFail.mockResolvedValue(actor as never);
	deps.webhooks.createQueryBuilder.mockReturnValue(query);
	const repo = mockDeep<WebhooksRepository>(); repo.createQueryBuilder.mockReturnValue(query);
	repo.countBy.mockImplementation(async () => rows.size);
	repo.save.mockImplementation(async values => { const row = Object.assign(new MiWebhook(), values); rows.set(row.id, row); return row; });
	deps.webhooks.update.mockImplementation(async (where, values) => { for (const row of rows.values()) if (typeof where === 'object' && Object.entries(where).every(([key, value]) => row[key as keyof MiWebhook] === value)) Object.assign(row, values); return {} as never; });
	const manager = mockDeep<WebhooksRepository['manager']>(); manager.getRepository.mockReturnValue(repo as never);
	deps.webhooks.manager.transaction.mockImplementation(async (...args) => (args.at(-1) as unknown as (manager: unknown) => Promise<unknown>)(manager) as never);
	deps.http.sendMcpWebhook.mockImplementation(async (_url, body) => ({ status: 200, ok: true, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) }));
	deps.notes.findOneBy.mockResolvedValue({ id: 'note', mentions: ['account'], replyUserId: 'account' } as never);
	deps.noteEntity.isVisibleForMe.mockResolvedValue(true); deps.noteEntity.pack.mockResolvedValue({ isHidden: false } as never);
	service = new McpEventsService(deps.webhooks, deps.tokens, deps.apps, deps.users, deps.notes, deps.http, deps.roles, deps.noteEntity);
});
const context = (): ApiContext<MiLocalUser> => ({ credential: 'synthetic', ip: '127.0.0.1', headers: {}, services: {
	authenticate: async () => [actor, { id: 'grant', permission }], limitActor: () => 'account', rateLimitFactor: async () => 1, limit: async () => null,
} });
const subscribe = (ps: v.InferOutput<typeof subscribeInput> = input) => service.invoke('events/subscribe', ps, context()) as Promise<{ id: string; refreshBefore: string }>;

it('uses Standard Webhooks bytes, independent HMAC verification and fresh timestamps', () => {
	const body = '{"data":"synthetic"}'; const headers = signedHeaders('evt', 'sub', secret, body, undefined, 1000000);
	expect(headers['webhook-signature']).toBe('v1,' + createHmac('sha256', Buffer.alloc(32, 42)).update('evt.1000.' + body).digest('base64'));
	expect(headers).not.toHaveProperty('X-Misskey-Hook-Secret');
	expect(signedHeaders('evt', 'sub', secret, body, secret, 1001000)['webhook-signature'].split(' ')).toHaveLength(2);
	expect(() => signedHeaders('evt', 'sub', secret, 'x'.repeat(262145))).toThrow();
	for (const value of ['whsec_AA==', 'not-secret', 'whsec_' + Buffer.alloc(65).toString('base64')]) expect(() => signingKey(value)).toThrow();
	expect(challengeMatches('fresh', 'fresh')).toBe(true); expect(challengeMatches('fresh', 'wrong')).toBe(false);
});
it('strictly rejects filters, replay, credentials and unknown event names', async () => {
	for (const ps of [{ ...input, arguments: { userId: 'other' } }, { ...input, cursor: 'replay' }, { ...input, i: 'credential' }, { ...input, name: 'note.created' }]) expect(v.safeParse(subscribeInput, ps).success).toBe(false);
	await expect(service.invoke('events/subscribe', { ...input, arguments: { userId: 'other' } }, context())).rejects.toBeDefined();
	expect(deps.http.sendMcpWebhook).not.toHaveBeenCalled();
});
it('registers idempotently, verifies before activation, caches verification and bounds requested TTL', async () => {
	const first = await subscribe(); const row = rows.get(first.id)!;
	expect(first.id).toBe(subscriptionId('account', 'grant', input.delivery.url, input.name));
	expect(row.mode).toBe('mcp'); const generation = row.mcpGeneration;
	expect(await subscribe()).toMatchObject({ id: first.id }); expect(rows.size).toBe(1);
	expect(rows.get(first.id)!.mcpGeneration).toBe(generation); expect(deps.http.sendMcpWebhook).toHaveBeenCalledTimes(1);
	const tiny = await subscribe({ ...input, ttlMs: 50 }); expect(new Date(tiny.refreshBefore).getTime() - Date.now()).toBeLessThanOrEqual(50);
});
it('does not persist failed challenge, redirect or revocation during verification', async () => {
	deps.http.sendMcpWebhook.mockResolvedValue({ ok: false, status: 302, text: '{}' });
	await expect(subscribe()).rejects.toMatchObject({ code: -32015, data: { reason: 'challenge_failed' } }); expect(rows.size).toBe(0);
	deps.http.sendMcpWebhook.mockImplementation(async (_url, body) => { permission = []; return { ok: true, status: 200, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) }; });
	await expect(subscribe()).rejects.toBeDefined(); expect(rows.size).toBe(0);
});
it('keeps scopes, account state and grant boundaries native', async () => {
	permission = ['access:mcp']; await expect(subscribe()).rejects.toBeDefined();
	permission = ['access:mcp', 'read:notifications']; actor.isSuspended = true; await expect(subscribe()).rejects.toBeDefined();
	actor.isSuspended = false; actor.movedToUri = 'https://moved.example'; await expect(subscribe()).rejects.toBeDefined();
	expect(subscriptionId('account', 'grant', input.delivery.url, input.name)).not.toBe(subscriptionId('account', 'other-grant', input.delivery.url, input.name));
});
it('suppresses unsubscribe/expiry/recreation, current note visibility, deletion, ownership and lost permissions', async () => {
	const { id } = await subscribe(); const generation = rows.get(id)!.mcpGeneration!;
	const authorize = () => service.authorizeDelivery(id, 'account', generation, 'note', 'mention');
	expect(await authorize()).not.toBeNull();
	deps.noteEntity.isVisibleForMe.mockResolvedValue(false); expect(await authorize()).toBeNull(); deps.noteEntity.isVisibleForMe.mockResolvedValue(true);
	deps.noteEntity.pack.mockResolvedValue({ isHidden: true } as never); expect(await authorize()).toBeNull(); deps.noteEntity.pack.mockResolvedValue({ isHidden: false } as never);
	deps.notes.findOneBy.mockResolvedValue(null); expect(await authorize()).toBeNull(); deps.notes.findOneBy.mockResolvedValue({ id: 'note', mentions: ['account'] } as never);
	permission = []; expect(await authorize()).toBeNull(); permission = ['access:mcp', 'read:notifications'];
	expect(await service.authorizeDelivery(id, 'other', generation, 'note', 'mention')).toBeNull();
	rows.get(id)!.mcpExpiresAt = new Date(0); expect(await authorize()).toBeNull(); await subscribe(); expect(await authorize()).toBeNull();
	const currentGeneration = rows.get(id)!.mcpGeneration!;
	await service.invoke('events/unsubscribe', { name: input.name, arguments: {}, delivery: { mode: 'webhook', url: input.delivery.url } }, context());
	expect(rows.get(id)!.secret).toBe('');
	await subscribe(); expect(rows.get(id)!.mcpGeneration).not.toBe(currentGeneration);
});
it('rotates keys without changing live generation or extending expired subscriptions', async () => {
	const { id } = await subscribe(); const generation = rows.get(id)!.mcpGeneration;
	await subscribe({ ...input, delivery: { ...input.delivery, secret: 'whsec_' + Buffer.alloc(32, 43).toString('base64') } });
	expect(rows.get(id)!.mcpGeneration).toBe(generation); expect(rows.get(id)!.mcpPreviousSecret).toBe(secret);
	expect(rows.get(id)!.mcpPreviousSecretUntil!.getTime()).toBeGreaterThan(Date.now());
});
it('delivers minimal MCP payload, preserves IDs across retry and suppresses revocation after DNS', async () => {
	const { id } = await subscribe(); const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const worker = new UserWebhookDeliverProcessorService({ host: 'misskey.example', url: 'https://misskey.example' } as Config, deps.webhooks, deps.http, service, logger);
	const data: UserWebhookDeliverJobData = { mode: 'mcp', type: 'mention', webhookId: id, userId: 'account', generation: rows.get(id)!.mcpGeneration!, noteId: 'note', createdAt: 1000, eventId: 'stable' };
	const job = { data } as Bull.Job<UserWebhookDeliverJobData>;
	deps.http.sendMcpWebhook.mockImplementation(async (_url, body, headers, _signal, beforeSend) => {
		await beforeSend?.(); expect(headers['webhook-id']).toBe('stable'); expect(JSON.parse(body)).toEqual({ eventId: 'stable', name: 'note.mentioned', timestamp: '1970-01-01T00:00:01.000Z', data: { noteId: 'note', url: 'https://misskey.example/notes/note' }, cursor: null });
		return { ok: false, status: 500, text: '' };
	});
	await expect(worker.process(job)).rejects.toThrow('500'); await expect(worker.process(job)).rejects.toThrow('500');
	deps.http.sendMcpWebhook.mockImplementation(async (_url, _body, _headers, _signal, beforeSend) => { permission = []; await beforeSend?.(); throw new Error('must not send'); });
	expect(await worker.process(job)).toBe('Suppressed');
});
it.each([302, 410, 413, 401])('does not retry permanent callback status %i', async status => {
	const { id } = await subscribe({ ...input, name: 'note.replied' }); const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, deps.webhooks, deps.http, service, logger);
	deps.http.sendMcpWebhook.mockResolvedValue({ ok: false, status, text: '' });
	await expect(worker.process({ data: { mode: 'mcp', type: 'reply', webhookId: id, userId: 'account', generation: rows.get(id)!.mcpGeneration!, noteId: 'note', createdAt: 1000, eventId: 'stable' } } as Bull.Job<UserWebhookDeliverJobData>)).rejects.toBeInstanceOf(Bull.UnrecoverableError);
});
it('validates modern per-request metadata/header matching and unsupported versions', () => {
	const params = { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } };
	const body = { jsonrpc: '2.0', id: 1, method: 'server/discover', params };
	expect(modernRequest(body, { 'mcp-method': body.method, 'mcp-protocol-version': '2026-07-28' }).params).toEqual({});
	expect(() => modernRequest(body, { 'mcp-method': 'events/subscribe', 'mcp-protocol-version': '2026-07-28' })).toThrow(McpEventError);
	expect(() => modernRequest({ ...body, params: {} }, {})).toThrow();
	expect(modernRequest({ ...body, params: { _meta: { ...params._meta, 'io.modelcontextprotocol/protocolVersion': 'next' } } }, { 'mcp-method': body.method, 'mcp-protocol-version': 'next' }).unsupported).toBe('next');
});
