/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import fetch, { Response } from 'node-fetch';
import type { LookupAddress } from 'node:dns';
import { createProcedureClient } from '@orpc/server';
import { MiUser, type MiRemoteUser, type MiLocalUser } from '@features/users/backend/models/User.js';
import { createUsersShowProcedure, type UsersShowDependencies } from '@features/users/backend/endpoints/users/show.js';
import { createUserSerializationFixture } from '@features/users/test/backend/user-serialization-fixture.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { ApPersonService } from '../../backend/services/ApPersonService.js';
import { UtilityService } from '../../backend/services/UtilityService.js';
import type { IActor } from '../../backend/protocol/type.js';
import type { Config } from '@/config.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { MiMeta } from '@features/instance/backend/models/Meta.js';
import type { Resolver } from '../../backend/services/ApResolverService.js';

const { lookupAll } = vi.hoisted(() => ({ lookupAll: vi.fn<(host: string, options: { all: true; verbatim: true }) => Promise<LookupAddress[]>>() }));
vi.mock('node:dns/promises', () => ({ lookup: lookupAll }));
vi.mock('node-fetch', async importOriginal => ({
	...await importOriginal<typeof import('node-fetch')>(), default: vi.fn(),
}));

beforeEach(() => {
	lookupAll.mockReset();
	vi.mocked(fetch).mockReset();
});

function receiver(host: string, source: string, postPublicJson: HttpRequestService['postPublicJson']) {
	let stored: MiRemoteUser | undefined;
	const users = {
		update: vi.fn(async (_id: unknown, updates: Partial<MiUser>) => {
			if (stored) Object.assign(stored, updates);
			return { affected: 1 };
		}),
		findOneByOrFail: vi.fn(async () => stored),
	};
	const policy = { canUpdateBioMedia: true };
	const software = { softwareName: 'misskey' as string | null };
	const events = vi.fn();
	const config = mockDeep<Config>({ host, url: `https://${host}` });
	const utility = new UtilityService(config, mockDeep<MiMeta>({ federation: 'all', blockedHosts: [] }));
	const service: ApPersonService = Object.assign(Object.create(ApPersonService.prototype), {
		config, meta: { enableStatsForFederatedInstances: false }, utilityService: utility,
		logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn() }, httpRequestService: { postPublicJson },
		federatedInstanceService: { fetch: async () => software },
		roleService: { getUserPolicies: async () => policy }, usersRepository: users,
		followingsRepository: { update: vi.fn() }, userEntityService: { isRemoteUser: () => true },
		userProfilesRepository: { update: vi.fn() },
		db: { transaction: async (action: (manager: { save: (row: unknown) => Promise<unknown> }) => Promise<unknown>) => action({ save: async row => {
			if (row instanceof MiUser) {
				stored = Object.assign(row, { avatarDecorations: [], movedAt: null, movedToUri: null, alsoKnownAs: [] }) as MiRemoteUser;
			}
			return row;
		} }) },
		idService: { gen: () => 'receiver123' },
		apNoteService: { extractEmojis: async () => [] },
		cacheService: { uriPersonCache: { set: vi.fn() } },
		usersChart: { update: vi.fn() }, hashtagService: { updateUsertags: vi.fn() },
		globalEventService: { publishInternalEvent: events },
	});
	Object.defineProperty(service, 'fetchPerson', { value: vi.fn(async () => stored ?? null) });
	Object.defineProperty(service, 'updateFeatured', { value: vi.fn().mockResolvedValue(undefined) });
	const actor: IActor = { type: 'Person', id: `https://${source}/users/user123`, preferredUsername: 'alice', inbox: `https://${source}/inbox`, outbox: `https://${source}/outbox`, name: 'Alice', manuallyApprovesFollowers: false };
	const resolver = mockDeep<Resolver>();
	resolver.resolve.mockResolvedValue(actor);
	return { service, actor, resolver, policy, software, events, users, stored: () => {
		if (!stored) throw new Error('Actor not created');
		return stored;
	} };
}

test.each([
	['tempura.example', 'nine.example'], ['nine.example', 'tempura.example'],
])('API-assisted actor federation %s -> %s: create, transform update, detach, stale-state retention and display', async (source, destination) => {
	const sender = createUserSerializationFixture();
	sender.user.username = 'alice';
	let catalog = [{ id: 'deco123', url: `https://${source}/decorations/animated.webp` }];
	Object.assign(sender.service, { avatarDecorationService: { getAll: async () => catalog } });
	// An optional stored remote URL must never override a local catalog entry.
	sender.user.avatarDecorations = [{ id: 'deco123', url: 'https://untrusted.example/ignore', angle: 0.25, flipH: true, offsetX: 0.1, offsetY: -0.1 }];
	const mocks = mockDeep<UsersShowDependencies>();
	const deps: UsersShowDependencies = {
		serverSettings: mocks.serverSettings, usersRepository: mocks.usersRepository,
		userEntityService: sender.service, remoteUserResolveService: mocks.remoteUserResolveService,
		roleService: mocks.roleService, perUserPvChart: mocks.perUserPvChart, apiLoggerService: mocks.apiLoggerService,
	};
	mocks.usersRepository.findOneBy.mockResolvedValue(sender.user);
	const context = mockDeep<ApiContext<MiLocalUser>>({ credential: null, ip: '192.0.2.1', headers: {} });
	context.services.authenticate.mockResolvedValue([null, null]);
	const show = createProcedureClient(createUsersShowProcedure(deps), { context });
	const http: HttpRequestService = Object.assign(Object.create(HttpRequestService.prototype), { config: { userAgent: 'Misskey/test' } });
	const postPublicJson = vi.fn<HttpRequestService['postPublicJson']>().mockImplementation((url, body) => http.postPublicJson(url, body));
	const receiverSide = receiver(destination, source, postPublicJson);
	const { service, actor, resolver } = receiverSide;
	lookupAll.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
	// In-process HTTP stub: no Tempura process, sockets, public DNS or inbox delivery.
	vi.mocked(fetch).mockImplementation(async (input, init) => {
		const url = String(input);
		if (url === actor.id && init?.method === 'GET') {
			const responseOptions = { url, headers: { 'Content-Type': 'application/activity+json' } };
			return new Response(JSON.stringify(actor), responseOptions);
		}
		expect(url).toBe(`https://${source}/api/users/show`);
		expect(init?.method).toBe('POST');
		const responseOptions = { url, headers: { 'Content-Type': 'application/json' } };
		return new Response(JSON.stringify(await show(JSON.parse(String(init?.body)))), responseOptions);
	});
	resolver.resolve.mockImplementation(uri => typeof uri === 'string' ? http.getActivityJson(uri) : Promise.resolve(uri));
	const created = await service.createPerson(actor.id!, resolver);
	expect(created.avatarDecorations).toEqual([{ ...sender.user.avatarDecorations[0], url: catalog[0].url }]);
	const viewer = createUserSerializationFixture();
	Object.assign(viewer.user, created);
	viewer.user.avatarDecorations = JSON.parse(JSON.stringify(created.avatarDecorations));
	Object.assign(viewer.service, { config: { url: `https://${destination}`, mediaProxy: `https://${destination}/proxy` } });
	Object.assign(viewer.service, { federatedInstanceService: { federatedInstanceCache: { fetch: async () => undefined } } });
	const wire = await viewer.service.pack(viewer.user, null, { schema: 'UserDetailed', ...viewer.hints });
	expect(wire.avatarDecorations).toHaveLength(1);
	expect(new URL(wire.avatarDecorations[0].url).searchParams.get('url')).toBe(catalog[0].url);
	expect(wire.avatarDecorations[0]).toMatchObject({ id: 'deco123', angle: 0.25, flipH: true });
	// Same remote ID cannot resolve against a local catalog entry.
	Object.assign(viewer.service, { avatarDecorationService: { getAll: () => { throw new Error('must not read local catalog'); } } });
	await expect(viewer.service.pack(viewer.user, null, viewer.hints)).resolves.toHaveProperty('avatarDecorations');
	sender.user.avatarDecorations[0].angle = -0.25;
	catalog[0].url = `https://${source}/decorations/new.webp`;
	await service.updatePerson(actor.id!, resolver);
	expect(receiverSide.stored().avatarDecorations[0]).toMatchObject({ angle: -0.25, url: catalog[0].url });
	expect(receiverSide.events).toHaveBeenCalledWith('remoteUserUpdated', { id: 'receiver123' });
	postPublicJson.mockRejectedValueOnce(new Error('unavailable'));
	await service.updatePerson(actor.id!, resolver, { ...actor, name: 'Changed while API unavailable' });
	expect(receiverSide.stored().name).toBe('Changed while API unavailable');
	expect(receiverSide.stored().avatarDecorations).toHaveLength(1);
	sender.user.avatarDecorations = [];
	await service.updatePerson(actor.id!, resolver);
	expect(receiverSide.stored().avatarDecorations).toEqual([]);
	// Catalog deletion is reflected by the ordinary local users/show projection too.
	sender.user.avatarDecorations = [{ id: 'deco123' }];
	catalog = [];
	await service.updatePerson(actor.id!, resolver, actor);
	expect(receiverSide.stored().avatarDecorations).toEqual([]);
});

test('known unsupported software, disabled bio media and missing extension preserve previous decorations', async () => {
	const postPublicJson = vi.fn<HttpRequestService['postPublicJson']>().mockResolvedValue({ username: 'alice', host: null });
	const f = receiver('nine.example', 'remote.example', postPublicJson);
	await f.service.createPerson(f.actor.id!, f.resolver);
	f.stored().avatarDecorations = [{ id: 'old', url: 'https://remote.example/old.webp' }];
	await f.service.updatePerson(f.actor.id!, f.resolver, f.actor);
	expect(f.stored().avatarDecorations).toHaveLength(1);
	postPublicJson.mockClear();
	f.software.softwareName = 'mastodon';
	await f.service.updatePerson(f.actor.id!, f.resolver, f.actor);
	expect(postPublicJson).not.toHaveBeenCalled();
	f.software.softwareName = 'misskey';
	f.policy.canUpdateBioMedia = false;
	await f.service.updatePerson(f.actor.id!, f.resolver, f.actor);
	expect(postPublicJson).not.toHaveBeenCalled();
	expect(f.stored().avatarDecorations).toHaveLength(1);
});
