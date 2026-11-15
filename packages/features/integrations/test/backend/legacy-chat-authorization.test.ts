/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { call } from '@orpc/server';
import { describe, expect, it, vi } from 'vitest';
import { MiWebhook } from '../../backend/models/Webhook.js';
import { createIWebhooksCreateProcedure } from '../../backend/endpoints/i/webhooks/create.js';
import { createIWebhooksUpdateProcedure } from '../../backend/endpoints/i/webhooks/update.js';
import { UserWebhookDeliverProcessorService } from '../../backend/jobs/UserWebhookDeliverProcessorService.js';
import { QueueService } from '../../../runtime/backend/services/QueueService.js';
import { MiUser } from '../../../users/backend/models/User.js';
import { MiAccessToken } from '../../../auth/backend/models/AccessToken.js';
import type { ApiToken } from '../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { LegacyUserWebhookDeliverJobData } from '../../../runtime/backend/queue/types.js';
import { testContext } from './native-context.js';

const actor = { id: 'owner', isSuspended: false, movedToUri: null, host: null } as MiLocalUser;
const accountToken: ApiToken = { id: 'grant', permission: ['write:account'] };
const chatToken: ApiToken = { id: 'grant', permission: ['write:account', 'read:chat'] };
const input = { name: 'hook', url: 'https://example.com/hook', secret: 'secret', on: ['chatMessage'] as ['chatMessage'] };

function fixture(token: ApiToken | null = null, on: MiWebhook['on'] = ['chatMessage']) {
	let webhook = { id: 'hook1', userId: actor.id, ...input, on, active: true, mode: 'legacy',
		chatGeneration: 'generation', chatTokenId: null, latestSentAt: null, latestStatus: null } as MiWebhook;
	const rowLock = { where: vi.fn().mockReturnThis(), setLock: vi.fn().mockReturnThis(), getOneOrFail: vi.fn(async () => actor) };
	const users = { createQueryBuilder: () => rowLock, findOneBy: vi.fn(async () => actor) };
	const tokens = { findOneBy: vi.fn(async () => ({ id: 'grant', userId: actor.id, appId: null, permission: chatToken.permission })) };
	const apps = { findOneBy: vi.fn(async () => ({ permission: chatToken.permission })) };
	const repository = {
		findOne: vi.fn(async () => webhook as MiWebhook | null),
		findOneBy: vi.fn(async () => webhook as MiWebhook | null),
		findOneByOrFail: vi.fn(async () => webhook),
		find: vi.fn(async () => []), countBy: vi.fn(async () => 0),
		insert: vi.fn(async (values: Partial<MiWebhook>) => { webhook = { ...webhook, ...values }; }),
		update: vi.fn(async (_id: unknown, values: Partial<MiWebhook>) => {
			webhook = { ...webhook, ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) };
		}),
	};
	const manager = {
		getRepository: (entity: unknown) => entity === MiWebhook ? repository : entity === MiUser ? users : entity === MiAccessToken ? tokens : apps,
		transaction: vi.fn(async (callback: (manager: unknown) => Promise<unknown>) => callback(manager)),
	};
	const webhooksRepository = Object.assign(repository, { manager });
	const events = { publishInternalEvent: vi.fn() };
	const dependencies = { webhooksRepository: webhooksRepository as never, globalEventService: events,
		idService: { gen: () => 'hook1' }, roleService: { getUserPolicies: vi.fn(async () => ({ webhookLimit: 3 })) } as never };
	const create = createIWebhooksCreateProcedure(dependencies);
	const update = createIWebhooksUpdateProcedure(dependencies);
	const context = testContext(actor, token);
	const send = vi.fn(async () => ({ status: 200 }));
	const processor = Object.assign(Object.create(UserWebhookDeliverProcessorService.prototype), {
		webhooksRepository, httpRequestService: { send }, config: { url: 'https://server.example', host: 'server.example' },
		logger: { debug: vi.fn() },
	}) as UserWebhookDeliverProcessorService;
	const chatContent = { message: { id: 'message' } as never };
	const job: LegacyUserWebhookDeliverJobData = { type: 'chatMessage', content: chatContent,
		webhookId: webhook.id, userId: actor.id, to: webhook.url, secret: webhook.secret,
		chatGeneration: 'generation', eventId: 'event', createdAt: 0 };
	return { repository, manager, users, tokens, apps, send, events, rowLock,
		chatContent, get webhook() { return webhook; },
		setWebhook: (value: Partial<MiWebhook>) => { webhook = { ...webhook, ...value }; },
		create: (values = input) => call(create, values, { context }),
		update: (values: Record<string, unknown>) => call(update, { webhookId: 'hook1', ...values } as never, { context }),
		deliver: () => processor.process({ data: job } as never), job,
	};
}

describe('legacy chat webhook registration', () => {
	it.each([accountToken, { permission: chatToken.permission }])('rejects insufficient or unbindable grants before create side effects', async token => {
		const f = fixture(token);
		await expect(f.create()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.manager.transaction).not.toHaveBeenCalled(); expect(f.events.publishInternalEvent).not.toHaveBeenCalled();
	});

	it.each([null, chatToken])('binds a fresh authorization to native owners and scoped grants', async token => {
		const f = fixture(token);
		await f.create();
		expect(f.webhook.chatGeneration).toMatch(/^[0-9a-f-]{36}$/);
		expect(f.webhook.chatTokenId).toBe(token?.id ?? null);
	});

	it.each([{ url: 'https://example.com/new' }, { secret: 'new' }, { active: true }, { name: 'new' }, { on: [] }])('guards partial edits of an existing chat hook: %j', async edit => {
		const f = fixture(accountToken);
		await expect(f.update(edit)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.repository.update).not.toHaveBeenCalled(); expect(f.events.publishInternalEvent).not.toHaveBeenCalled();
		expect(f.repository.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
	});

	it('cannot add chat to a non-chat hook without the grant', async () => {
		const f = fixture(accountToken, ['note']);
		await expect(f.update({ on: ['note', 'chatMessage'] })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.repository.update).not.toHaveBeenCalled();
	});

	it('keeps non-chat webhook create/update available to account-only tokens', async () => {
		const f = fixture(accountToken, ['note']);
		await f.create({ ...input, on: ['note'] as never });
		await f.update({ url: 'https://example.com/new' });
		expect(f.webhook.chatGeneration).toBeNull(); expect(f.webhook.chatTokenId).toBeNull();
	});

	it('rotates authorization on changes and clears it when chat is removed', async () => {
		const f = fixture(chatToken);
		await f.update({ url: 'https://example.com/new' });
		expect(f.webhook.chatGeneration).not.toBe('generation'); expect(f.webhook.chatTokenId).toBe('grant');
		const previous = f.webhook.chatGeneration;
		await f.update({ active: false });
		expect(f.webhook.chatGeneration).not.toBe(previous);
		await f.update({ on: ['note'] });
		expect(f.webhook.chatGeneration).toBeNull(); expect(f.webhook.chatTokenId).toBeNull();
	});

	it('an authorized update cannot revive an already queued generation', async () => {
		const f = fixture(chatToken);
		await f.update({ active: false }); await f.update({ active: true });
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});
});

describe('legacy chat delivery authorization', () => {
	it('delivers owner-authorized chat with the existing wire format', async () => {
		const f = fixture();
		expect(await f.deliver()).toBe('Success');
		const [url, request] = f.send.mock.calls[0] as unknown as [string, { headers: Record<string, string>; body: string }];
		expect(url).toBe(input.url); expect(request.headers['X-Misskey-Hook-Secret']).toBe(input.secret);
		expect(JSON.parse(request.body)).toMatchObject({ hookId: 'hook1', userId: 'owner', type: 'chatMessage', body: f.job.content });
	});

	it.each([{ chatGeneration: null }, { chatGeneration: 'new' }, { active: false }, { on: ['note'] }, { mode: 'mcp' },
		{ userId: 'other' }, { url: 'https://example.com/new' }, { secret: 'new' }])('suppresses stale or no-longer-authorized jobs: %j', async state => {
		const f = fixture(); f.setWebhook(state as Partial<MiWebhook>);
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});

	it('suppresses pre-upgrade jobs even after reauthorization', async () => {
		const f = fixture(); delete f.job.chatGeneration;
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});

	it('suppresses deleted hooks', async () => {
		const f = fixture(); f.repository.findOne.mockResolvedValue(null);
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});

	it.each([{ active: false }, { chatGeneration: 'new' }, { url: 'https://example.com/new' }, { on: [] }])('rechecks hook changes while grant reads are pending: %j', async state => {
		const f = fixture(); f.setWebhook({ chatTokenId: 'grant' });
		f.tokens.findOneBy.mockImplementationOnce(async () => {
			f.setWebhook(state as Partial<MiWebhook>);
			return { id: 'grant', userId: actor.id, appId: null, permission: chatToken.permission };
		});
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});

	it('rechecks cascade deletion while grant reads are pending', async () => {
		const f = fixture(); f.setWebhook({ chatTokenId: 'grant' });
		f.tokens.findOneBy.mockImplementationOnce(async () => {
			f.repository.findOneBy.mockResolvedValue(null);
			return { id: 'grant', userId: actor.id, appId: null, permission: chatToken.permission };
		});
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});

	it('rechecks token permissions on retry and binds the owner', async () => {
		const f = fixture(); f.setWebhook({ chatTokenId: 'grant' });
		expect(await f.deliver()).toBe('Success'); f.send.mockClear();
		f.tokens.findOneBy.mockResolvedValue({ id: 'grant', userId: actor.id, appId: null, permission: ['write:account'] });
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
		expect(f.tokens.findOneBy).toHaveBeenCalledWith({ id: 'grant', userId: 'owner' });
		f.tokens.findOneBy.mockResolvedValue(null as never);
		expect(await f.deliver()).toBe('Suppressed');
	});

	it('reads current app permissions instead of a cached or token-local scope', async () => {
		const f = fixture(); f.setWebhook({ chatTokenId: 'grant' });
		f.tokens.findOneBy.mockResolvedValue({ id: 'grant', userId: actor.id, appId: 'app' as never, permission: [] });
		expect(await f.deliver()).toBe('Success'); f.send.mockClear();
		f.apps.findOneBy.mockResolvedValue({ permission: ['write:account'] });
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
		f.apps.findOneBy.mockResolvedValue(null as never);
		expect(await f.deliver()).toBe('Suppressed');
	});

	it.each([{ isSuspended: true }, { movedToUri: 'https://example.com/new' }, { host: 'remote.example' }])('suppresses ineligible owners: %j', async state => {
		const f = fixture(); f.users.findOneBy.mockResolvedValue({ ...actor, ...state } as never);
		expect(await f.deliver()).toBe('Suppressed'); expect(f.send).not.toHaveBeenCalled();
	});

	it('retains non-chat legacy delivery compatibility', async () => {
		const f = fixture(); f.setWebhook({ chatGeneration: null, chatTokenId: null });
		f.job.type = 'note'; delete f.job.chatGeneration;
		expect(await f.deliver()).toBe('Success'); expect(f.users.findOneBy).not.toHaveBeenCalled();
	});

	it('never queues pre-upgrade chat hooks and propagates the current generation', () => {
		const f = fixture(); const add = vi.fn();
		const queue = Object.assign(Object.create(QueueService.prototype), { userWebhookDeliverQueue: { add } }) as QueueService;
		f.setWebhook({ chatGeneration: null });
		queue.userWebhookDeliver(f.webhook, 'chatMessage', f.chatContent);
		expect(add).not.toHaveBeenCalled();
		f.setWebhook({ chatGeneration: 'new' });
		queue.userWebhookDeliver(f.webhook, 'chatMessage', f.chatContent);
		expect(add).toHaveBeenCalledWith('hook1', expect.objectContaining({ chatGeneration: 'new', type: 'chatMessage' }), expect.anything());
	});
});
