/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { beforeEach, expect, it, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import * as Bull from 'bullmq';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';
import { McpEventsService } from '../../backend/McpEventsService.js';
import { McpEventError, challengeMatches, signedHeaders, signingKey, subscriptionId } from '../../backend/events-protocol.js';
import { subscribeInput } from '../../backend/api.definition.js';
import { streamChannelInputSchema, streamNoteInputSchema } from '../../backend/stream-parameters.js';
import { streamEventCatalog } from '../../backend/stream-catalog.js';
import { modernRequest } from '../../backend/modern-request.js';
import { UserWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';
import { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import { UserWebhookService, type UserWebhookPayload } from '@features/integrations/backend/services/UserWebhookService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type * as Redis from 'ioredis';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { WebhooksRepository, AccessTokensRepository, AppsRepository, UsersRepository, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { AntennaNoteAccessService } from '@features/timelines/backend/services/AntennaNoteAccessService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { Config } from '@/config.js';
import type { UserWebhookDeliverJobData } from '@features/runtime/backend/queue/types.js';
vi.mock('@features/runtime/backend/services/QueueService.js', () => ({ QueueService: class {} }));
vi.mock('@features/runtime/backend/services/HttpRequestService.js', () => ({ HttpRequestService: class {} }));
vi.mock('@features/roles/backend/services/RoleService.js', () => ({ RoleService: class {} }));
vi.mock('@features/notes/backend/serializers/NoteEntityService.js', () => ({ NoteEntityService: class {} }));
vi.mock('@features/runtime/backend/queue/QueueLoggerService.js', () => ({ QueueLoggerService: class {} }));
const notificationNames = ['subscribedNote', 'followed', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollEnded', 'scheduledNotePosted', 'scheduledNotePostFailed', 'receiveFollowRequest', 'followRequestAccepted', 'roleAssigned', 'chatRoomInvitationReceived', 'achievementEarned', 'exportCompleted', 'app', 'test'];
const secret = 'whsec_' + Buffer.alloc(32, 42).toString('base64');
const input = { name: 'note.mentioned' as const, arguments: {}, delivery: { mode: 'webhook' as const, url: 'https://callback.example/events', secret }, cursor: null, ttlMs: 3600000 };
const stores = () => ({ webhooks: mockDeep<WebhooksRepository>(), tokens: mockDeep<AccessTokensRepository>(), apps: mockDeep<AppsRepository>(), users: mockDeep<UsersRepository>(), notes: mockDeep<NotesRepository>(), http: mockDeep<HttpRequestService>(), roles: mockDeep<RoleService>(), noteEntity: mockDeep<NoteEntityService>(), antennas: mockDeep<AntennasRepository>(), antennaAccess: mockDeep<AntennaNoteAccessService>() });
let deps: ReturnType<typeof stores>;
let service: McpEventsService;
let rows: Map<string, MiWebhook>;
let actor: MiLocalUser;
let permission: string[];
beforeEach(() => {
	deps = stores(); Object.defineProperty(deps.antennas, 'target', { value: 'antenna' }); rows = new Map(); permission = ['access:mcp', 'read:notifications'];
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
	repo.update.mockImplementation(deps.webhooks.update);
	const manager = mockDeep<WebhooksRepository['manager']>(); manager.getRepository.mockImplementation(target => target === deps.antennas.target ? deps.antennas as never : repo as never);
	deps.webhooks.manager.transaction.mockImplementation(async (...args) => (args.at(-1) as unknown as (manager: unknown) => Promise<unknown>)(manager) as never);
	deps.http.sendMcpWebhook.mockImplementation(async (_url, body) => ({ status: 200, ok: true, text: JSON.stringify({ challenge: JSON.parse(body).challenge }) }));
	deps.notes.findOneBy.mockResolvedValue({ id: 'note', userId: 'other-author', mentions: ['account'], replyUserId: 'account' } as never);
	deps.noteEntity.isVisibleForMe.mockResolvedValue(true); deps.noteEntity.pack.mockResolvedValue({ isHidden: false } as never);
	service = new McpEventsService(deps.webhooks, deps.tokens, deps.apps, deps.users, deps.notes, deps.http, deps.roles, deps.noteEntity, deps.antennas, deps.antennaAccess);
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
it.each(['mention', 'reply'] as const)('filters self %s only from MCP fanout, preserving other recipients and subscriptions', async type => {
	const redis = mockDeep<Redis.Redis>();
	const queue = mockDeep<QueueService>();
	const legacy = Object.assign(new MiWebhook(), { id: 'legacy', userId: 'account', mode: 'legacy', on: [type] });
	const otherLegacy = Object.assign(new MiWebhook(), { id: 'other-legacy', userId: 'other', mode: 'legacy', on: [type] });
	const subscriptions = ['account', 'other'].flatMap(userId => [1, 2].map(index =>
		Object.assign(new MiWebhook(), { id: `${userId}-${index}`, userId, mode: 'mcp', on: [type] })));
	deps.webhooks.findBy.mockImplementation(async where => {
		if (Array.isArray(where)) return [];
		return where.mode === 'legacy' ? [legacy, otherLegacy] : subscriptions.filter(row => row.userId === where.userId);
	});
	const producer = new UserWebhookService(redis, deps.webhooks, queue);
	const content = { note: { id: 'note', userId: 'account', mentions: ['account', 'other'] } } as UserWebhookPayload<'mention'>;
	await producer.enqueueUserWebhook('account', type, content);
	await producer.enqueueUserWebhook('other', type, content);
	expect(queue.userWebhookDeliver.mock.calls.map(([webhook]) => webhook.id)).toEqual(['legacy', 'other-legacy', 'other-1', 'other-2']);
	expect(queue.userWebhookDeliver.mock.calls.every(([, event, payload]) => event === type && payload === content)).toBe(true);
	producer.dispose();
});
it.each(['mention', 'reply'] as const)('suppresses already queued self %s on every attempt while delivering other authors', async type => {
	const { id } = await subscribe({ ...input, name: type === 'mention' ? 'note.mentioned' : 'note.replied' });
	const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, deps.webhooks, deps.http, service, logger);
	const job = { data: { mode: 'mcp', type, webhookId: id, userId: 'account', generation: rows.get(id)!.mcpGeneration!, noteId: 'note', createdAt: 1000, eventId: 'stable' } } as Bull.Job<UserWebhookDeliverJobData>;
	deps.http.sendMcpWebhook.mockClear();
	deps.notes.findOneBy.mockResolvedValue({ id: 'note', userId: 'account', mentions: ['account', 'other'], replyUserId: 'account' } as never);
	expect(await worker.process(job)).toBe('Suppressed');
	expect(await worker.process(job)).toBe('Suppressed');
	expect(deps.http.sendMcpWebhook).not.toHaveBeenCalled();
	deps.notes.findOneBy.mockResolvedValue({ id: 'note', userId: 'other-author', mentions: ['account'], replyUserId: 'account' } as never);
	deps.http.sendMcpWebhook.mockResolvedValue({ ok: false, status: 500, text: '' });
	await expect(worker.process(job)).rejects.toThrow('500');
	deps.http.sendMcpWebhook.mockResolvedValue({ ok: true, status: 200, text: '' });
	expect(await worker.process(job)).toBe('Success');
	expect(deps.http.sendMcpWebhook.mock.calls.map(([, body, headers]) => [JSON.parse(body).name, headers['webhook-id']])).toEqual([
		[type === 'mention' ? 'note.mentioned' : 'note.replied', 'stable'],
		[type === 'mention' ? 'note.mentioned' : 'note.replied', 'stable'],
	]);
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

it('retries a live key rotation after DNS with current signatures instead of suppressing the event', async () => {
	const { id } = await subscribe(); const generation = rows.get(id)!.mcpGeneration!;
	const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, deps.webhooks, deps.http, service, logger);
	const nextSecret = 'whsec_' + Buffer.alloc(32, 43).toString('base64');
	const job = { data: { mode: 'mcp', type: 'mention', webhookId: id, userId: 'account', generation, noteId: 'note', createdAt: 1000, eventId: 'rotation-event' } } as Bull.Job<UserWebhookDeliverJobData>;
	let attemptedSend = false;
	deps.http.sendMcpWebhook.mockImplementationOnce(async (_url, _body, _headers, _signal, beforeSend) => {
		rows.set(id, Object.assign(new MiWebhook(), rows.get(id), { secret: nextSecret, mcpPreviousSecret: secret, mcpPreviousSecretUntil: new Date(Date.now() + 60000) }));
		await beforeSend?.(); attemptedSend = true; return { ok: true, status: 200, text: '' };
	});
	await expect(worker.process(job)).rejects.toThrow('MCP callback request failed'); expect(attemptedSend).toBe(false);
	deps.http.sendMcpWebhook.mockImplementationOnce(async (_url, body, headers, _signal, beforeSend) => {
		await beforeSend?.(); expect(headers).toEqual(signedHeaders('rotation-event', id, nextSecret, body, secret, Number(headers['webhook-timestamp']) * 1000));
		return { ok: true, status: 200, text: '' };
	});
	expect(await worker.process(job)).toBe('Success'); expect(rows.get(id)!.mcpGeneration).toBe(generation);
});

it('binds antenna arguments to ownership, read:account scope and subscription identity', async () => {
	const antenna = { ...input, name: 'antenna.note' as const, arguments: { antennaId: 'antenna' } };
	for (const args of [{}, { antennaId: 'antenna', userId: 'other' }, { antennaId: '' }]) expect(v.safeParse(subscribeInput, { ...antenna, arguments: args }).success).toBe(false);
	await expect(subscribe(antenna)).rejects.toThrow('Event access denied');
	expect(deps.http.sendMcpWebhook).not.toHaveBeenCalled();
	permission.push('read:account');
	await expect(subscribe(antenna)).rejects.toThrow('Antenna access denied');
	deps.antennas.existsBy.mockResolvedValue(true);
	const { id } = await subscribe(antenna);
	expect(rows.get(id)).toMatchObject({ mcpAntennaId: 'antenna', on: [] });
	const other = await subscribe({ ...antenna, arguments: { antennaId: 'another' } });
	expect(other.id).not.toBe(id);
	expect(id).not.toBe(subscriptionId('account', 'grant', input.delivery.url, 'antenna.note', 'another'));
	deps.antennaAccess.isDeliverable.mockResolvedValue(true);
	const generation = rows.get(id)!.mcpGeneration!;
	expect(await service.authorizeDelivery(id, 'account', generation, 'note', 'antenna', 'antenna')).not.toBeNull();
	expect(await service.authorizeDelivery(id, 'account', generation, 'note', 'antenna', 'other')).toBeNull();
	deps.antennaAccess.isDeliverable.mockImplementationOnce(async () => { rows.get(id)!.active = false; return true; });
	expect(await service.authorizeDelivery(id, 'account', generation, 'note', 'antenna', 'antenna')).toBeNull();
	rows.get(id)!.active = true;
	deps.antennaAccess.isDeliverable.mockResolvedValue(false);
	expect(await service.authorizeDelivery(id, 'account', generation, 'note', 'antenna', 'antenna')).toBeNull();
	const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, deps.webhooks, deps.http, service, logger);
	const job = { data: { mode: 'mcp', type: 'antenna', antennaId: 'antenna', webhookId: id, userId: 'account', generation, noteId: 'note', createdAt: 1000, eventId: 'antenna-event' } } as Bull.Job<UserWebhookDeliverJobData>;
	deps.antennaAccess.isDeliverable.mockResolvedValueOnce(true).mockResolvedValue(false);
	let sent = false;
	deps.http.sendMcpWebhook.mockImplementationOnce(async (_url, body, _headers, _signal, beforeSend) => {
		expect(JSON.parse(body).name).toBe('antenna.note'); await beforeSend?.(); sent = true; return { status: 200, ok: true, text: '' };
	});
	expect(await worker.process(job)).toBe('Suppressed'); expect(sent).toBe(false);
	permission.splice(permission.indexOf('read:account'), 1); deps.antennaAccess.isDeliverable.mockResolvedValue(true);
	expect(await worker.process(job)).toBe('Suppressed'); permission.push('read:account');

	await service.invoke('events/unsubscribe', { name: antenna.name, arguments: antenna.arguments, delivery: { mode: 'webhook', url: input.delivery.url } }, context());
	expect(await service.authorizeDelivery(id, 'account', generation, 'note', 'antenna', 'antenna')).toBeNull();
	expect(rows.get(other.id)!.active).toBe(true);
});

it('advertises strict antenna arguments separately from empty mention/reply arguments', async () => {
	permission.push('read:account');
	const result = await service.invoke('events/list', {}, context()) as { events: { name: string; inputSchema: unknown }[] };
	expect(result.events.find(event => event.name === 'antenna.note')?.inputSchema).toEqual({ type: 'object', properties: { antennaId: { type: 'string' } }, required: ['antennaId'], additionalProperties: false });
	expect(result.events.find(event => event.name === 'note.mentioned')?.inputSchema).toEqual({ type: 'object', properties: {}, additionalProperties: false });
});

it('advertises object input schemas for all available event definitions', async () => {
	permission.push('read:account');
	const result = await service.invoke('events/list', {}, context()) as { events: { name: string; inputSchema: unknown }[] };
	expect(result.events).toHaveLength(27);
	for (const event of result.events) expect(ToolSchema.shape.inputSchema.safeParse(event.inputSchema).success, event.name).toBe(true);
});

it('keeps the stream catalog outside JSON Schema and preserves it through the native output contract', async () => {
	permission.push('read:account');
	// Use the existing SDK's pinned AJV dependency; add no test/package dependency.
	const backendRequire = createRequire(`${process.cwd()}/package.json`);
	const sdkRequire = createRequire(backendRequire.resolve('@modelcontextprotocol/sdk/validation/ajv-provider.js'));
	const { default: Ajv2020 } = sdkRequire('ajv/dist/2020.js') as { default: new (options: { strict: boolean }) => { compile(schema: object): unknown } };
	const result = await service.invoke('events/list', {}, context()) as { events: {
		name: string; inputSchema: Record<string, unknown>; payloadSchema: Record<string, unknown>; _meta?: Record<string, unknown>;
	}[] };
	for (const event of result.events) {
		const validator = new Ajv2020({ strict: true });
		expect(() => validator.compile(event.inputSchema), event.name).not.toThrow();
		expect(() => validator.compile(event.payloadSchema), event.name).not.toThrow();
		if (event.name.startsWith('stream.')) {
			const catalog = event.name === 'stream.channel' ? streamEventCatalog : event.name === 'stream.note' ? streamEventCatalog.note : streamEventCatalog.broadcast;
			expect(event._meta).toEqual({ 'dev.a9z.p1/event-catalog': catalog });
			expect(event.payloadSchema).not.toHaveProperty('x-misskey-event-catalog');
		} else expect(event._meta).toBeUndefined();
	}
	expect(result.events.find(event => event.name === 'stream.channel')?.inputSchema).toEqual(streamChannelInputSchema);
	expect(result.events.find(event => event.name === 'stream.note')?.inputSchema).toEqual(streamNoteInputSchema);
});

it.each([
	{ scopes: ['read:notifications'], names: [...notificationNames, 'note.mentioned', 'note.replied'] },
	{ scopes: ['read:chat'], names: ['chatMessage'] },
	{ scopes: ['read:following'], names: ['unfollow', 'follow'] },
	{ scopes: ['read:account'], names: ['note', 'stream.channel', 'stream.broadcast', 'stream.note'] },
	{ scopes: ['read:notifications', 'read:account'], names: ['note', ...notificationNames.slice(0, -2), 'login', 'createToken', 'app', 'test', 'note.mentioned', 'note.replied', 'antenna.note', 'stream.channel', 'stream.broadcast', 'stream.note'] },
])('lists only events admitted by current native scopes: $scopes', async ({ scopes, names }) => {
	permission = ['access:mcp', ...scopes];
	const result = await service.invoke('events/list', {}, context()) as { events: { name: string }[] };
	expect(result.events.map(event => event.name)).toEqual(names);
});

it.each([
	{ scopes: ['access:mcp'], code: -32602 },
	{ scopes: ['read:notifications'], code: 'PERMISSION_DENIED' },
	{ scopes: ['read:account'], code: 'PERMISSION_DENIED' },
])('rejects discovery without the existing MCP/event grant boundary: $scopes', async ({ scopes, code }) => {
	permission = scopes;
	await expect(service.invoke('events/list', {}, context())).rejects.toMatchObject({ code });
});

it('rechecks native scope changes between event discoveries', async () => {
	const list = async () => (await service.invoke('events/list', {}, context()) as { events: { name: string }[] }).events.map(event => event.name);
	permission = ['access:mcp', 'read:notifications', 'read:account'];
	expect(await list()).toHaveLength(27);
	permission = ['access:mcp', 'read:account'];
	expect(await list()).toEqual(['note', 'stream.channel', 'stream.broadcast', 'stream.note']);
	permission = ['access:mcp', 'read:notifications'];
	expect(await list()).toEqual([...notificationNames, 'note.mentioned', 'note.replied']);
	permission = ['access:mcp'];
	await expect(list()).rejects.toThrow('Event access denied');
});

it('filters using current app permissions rather than the token/context scope snapshot', async () => {
	permission = ['access:mcp', 'read:notifications', 'read:account'];
	deps.tokens.findOneBy.mockResolvedValue({ id: 'grant', userId: actor.id, appId: 'app', permission } as never);
	deps.apps.findOneBy.mockResolvedValue({ id: 'app', permission: ['access:mcp', 'read:account'] } as never);
	const list = async () => (await service.invoke('events/list', {}, context()) as { events: { name: string }[] }).events.map(event => event.name);
	expect(await list()).toEqual(['note', 'stream.channel', 'stream.broadcast', 'stream.note']);
	deps.apps.findOneBy.mockResolvedValue({ id: 'app', permission: ['access:mcp', 'read:notifications'] } as never);
	expect(await list()).toEqual([...notificationNames, 'note.mentioned', 'note.replied']);
	deps.apps.findOneBy.mockResolvedValue(null);
	await expect(list()).rejects.toThrow('Event access denied');
});

it('retains current grant and account-state checks when listing events', async () => {
	permission = ['access:mcp', 'read:account'];
	actor.isSuspended = true;
	await expect(service.invoke('events/list', {}, context())).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_SUSPENDED' });
	actor.isSuspended = false; actor.movedToUri = 'https://moved.example';
	await expect(service.invoke('events/list', {}, context())).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED' });
	actor.movedToUri = null; deps.tokens.findOneBy.mockResolvedValue(null);
	await expect(service.invoke('events/list', {}, context())).rejects.toThrow('Event access denied');
});

it('delivers canonical names and aliases independently, suppressing both after grant revocation', async () => {
	const canonical = await subscribe({ ...input, name: 'mention' });
	const alias = await subscribe();
	expect(canonical.id).not.toBe(alias.id);
	for (const id of [canonical.id, alias.id]) {
		const row = rows.get(id)!;
		expect(await service.authorizeDelivery(id, actor.id, row.mcpGeneration!, 'note', 'mention')).toMatchObject({ name: row.name });
	}
	permission = ['access:mcp'];
	for (const id of [canonical.id, alias.id]) expect(await service.authorizeDelivery(id, actor.id, rows.get(id)!.mcpGeneration!, 'note', 'mention')).toBeNull();
});

it.each(['login', 'createToken'] as const)('requires account and notification permissions again at delivery for %s', async name => {
	await expect(subscribe({ ...input, name })).rejects.toThrow('Event access denied');
	permission.push('read:account');
	const { id } = await subscribe({ ...input, name });
	const generation = rows.get(id)!.mcpGeneration!;
	const getNotification = vi.fn(async () => ({ id: 'notification', type: name }));
	Object.assign(service, { moduleRef: { get: () => ({ getNotification }) } });
	const data = { notificationId: 'notification' };
	expect(await service.authorizeDelivery(id, actor.id, generation, 'note', name)).toBeNull();
	expect(await service.authorizeDelivery(id, actor.id, generation, '', name, undefined, data)).not.toBeNull();
	permission = ['access:mcp', 'read:notifications'];
	expect(await service.authorizeDelivery(id, actor.id, generation, '', name, undefined, data)).toBeNull();
});

it('rechecks chat access immediately before delivery with only the native chat scope', async () => {
	permission = ['access:mcp', 'read:chat'];
	const canReceiveMessageEvent = vi.fn(async () => true);
	Object.assign(service, { moduleRef: { get: () => ({ canReceiveMessageEvent }) } });
	const { id } = await subscribe({ ...input, name: 'chatMessage' });
	const generation = rows.get(id)!.mcpGeneration!;
	const data = { messageId: 'message' };
	expect(await service.authorizeDelivery(id, actor.id, generation, '', 'chatMessage', undefined, data)).not.toBeNull();
	expect(canReceiveMessageEvent).toHaveBeenCalledWith(actor.id, 'message');
	canReceiveMessageEvent.mockResolvedValue(false);
	expect(await service.authorizeDelivery(id, actor.id, generation, '', 'chatMessage', undefined, data)).toBeNull();
	canReceiveMessageEvent.mockResolvedValue(true); permission = ['access:mcp'];
	expect(await service.authorizeDelivery(id, actor.id, generation, '', 'chatMessage', undefined, data)).toBeNull();
});

it.each(['quote', 'subscribedNote', 'reaction'] as const)('rechecks note visibility for %s references', async name => {
	const { id } = await subscribe({ ...input, name }); const generation = rows.get(id)!.mcpGeneration!;
	deps.notes.findOneBy.mockResolvedValue({ id: 'note', userId: actor.id } as never);
	expect(await service.authorizeDelivery(id, actor.id, generation, 'note', name)).not.toBeNull();
	deps.noteEntity.isVisibleForMe.mockResolvedValue(false);
	expect(await service.authorizeDelivery(id, actor.id, generation, 'note', name)).toBeNull();
});

it('binds chat delivery to the subscription name and recipient even with a permissive on list', async () => {
	permission = ['access:mcp', 'read:chat', 'read:notifications'];
	const canReceiveMessageEvent = vi.fn(async (userId: string, messageId: string) => userId === actor.id && messageId === 'received');
	Object.assign(service, { moduleRef: { get: () => ({ canReceiveMessageEvent }) } });
	const { id } = await subscribe({ ...input, name: 'chatMessage' });
	const row = rows.get(id)!;
	const authorize = (data: Record<string, string>, userId = actor.id) => service.authorizeDelivery(id, userId, row.mcpGeneration!, '', 'chatMessage', undefined, data);
	expect(await authorize({ messageId: 'received', userId: actor.id })).not.toBeNull();
	const invalidReferences: Record<string, string>[] = [{ messageId: 'foreign' }, { messageId: 'received', userId: 'other' }, { messageId: 'received', notificationId: 'foreign' }];
	for (const data of invalidReferences) {
		expect(await authorize(data)).toBeNull();
	}
	expect(await authorize({ messageId: 'received' }, 'other')).toBeNull();
	row.name = 'note.mentioned';
	expect(await authorize({ messageId: 'received' })).toBeNull();
});

it.each(['login', 'createToken', 'followed', 'roleAssigned', 'mention', 'note.mentioned', 'note.replied', 'subscribedNote'] as const)('validates stored notification ownership and type for %s references', async name => {
	permission.push('read:account');
	const { id } = await subscribe({ ...input, name });
	const row = rows.get(id)!;
	const type = row.on[0];
	const notificationType = name === 'followed' ? 'follow' : name === 'subscribedNote' ? 'note' : name === 'note.mentioned' ? 'mention' : name === 'note.replied' ? 'reply' : name;
	const notification = { id: 'notification', type: notificationType, notifierId: 'sender', noteId: 'note' };
	const getNotification = vi.fn(async (userId: string, notificationId: string) => userId === actor.id && notificationId === notification.id ? notification : null);
	Object.assign(service, { moduleRef: { get: () => ({ getNotification }) } });
	const authorize = (data?: Record<string, string>, noteId = '') => service.authorizeDelivery(id, actor.id, row.mcpGeneration!, noteId, type, undefined, data);
	const data = { notificationId: 'notification', notificationType };
	expect(await authorize(data)).not.toBeNull();
	expect(getNotification).toHaveBeenCalledWith(actor.id, 'notification');
	for (const invalid of [undefined, {}, { ...data, notificationId: 'foreign' }, { ...data, notificationType: 'test' }, { ...data, userId: 'other' }, { ...data, noteId: 'other' }]) {
		expect(await authorize(invalid)).toBeNull();
	}
	expect(await authorize(data, 'other')).toBeNull();
	getNotification.mockResolvedValue({ ...notification, id: 'other' });
	expect(await authorize(data)).toBeNull();
	getNotification.mockResolvedValue({ ...notification, type: 'test' });
	expect(await authorize(data)).toBeNull();
	getNotification.mockResolvedValue(null);
	expect(await authorize(data)).toBeNull();
});

it('suppresses a notification removed after DNS without sending the callback', async () => {
	permission.push('read:account');
	const { id } = await subscribe({ ...input, name: 'login' });
	let present = true;
	const getNotification = vi.fn(async () => present ? { id: 'notification', type: 'login' } : null);
	Object.assign(service, { moduleRef: { get: () => ({ getNotification }) } });
	const logger = mockDeep<QueueLoggerService>(); logger.logger.createSubLogger.mockReturnValue({ debug: vi.fn() } as never);
	const worker = new UserWebhookDeliverProcessorService({ url: 'https://misskey.example' } as Config, deps.webhooks, deps.http, service, logger);
	let sent = false;
	deps.http.sendMcpWebhook.mockImplementation(async (_url, _body, _headers, _signal, beforeSend) => {
		present = false;
		await beforeSend?.();
		sent = true;
		return { ok: true, status: 200, text: '' };
	});
	const job = mockDeep<Bull.Job<UserWebhookDeliverJobData>>();
	job.data = { mode: 'mcp', type: 'login', webhookId: id, userId: actor.id, generation: rows.get(id)!.mcpGeneration!, noteId: '', data: { notificationId: 'notification' }, createdAt: 1000, eventId: 'event' };
	expect(await worker.process(job)).toBe('Suppressed');
	expect(getNotification).toHaveBeenCalledTimes(2);
	expect(sent).toBe(false);
});
