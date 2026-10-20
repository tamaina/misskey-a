/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Response } from 'node-fetch';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { RemoteUserResolveService } from '../../backend/services/RemoteUserResolveService.js';
import { WebfingerService } from '../../backend/services/WebfingerService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';

const uri = 'https://remote.example/users/alice';
// Production journal: WebFinger failed at JSON parsing with "<?xml vers...".
// Its precise HTTP status and full body were not logged; 200/XRD is a synthetic response.
const xrd = '<?xml version="1.0"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0"><Subject>acct:alice@remote.example</Subject><Link rel="self" href="https://remote.example/users/alice"/></XRD>';

function fixture(existing = true, stale = true) {
	const logger = mock<Logger>();
	const row = existing ? mock<MiRemoteUser>({
		id: 'remote-alice', uri, username: 'alice', usernameLower: 'alice', host: 'remote.example',
		lastFetchedAt: new Date(stale ? 0 : Date.now()),
	}) : null;
	const send = vi.fn(async () => new Response(xrd, { headers: { 'content-type': 'application/xrd+xml' } }));
	const http: HttpRequestService = Object.create(HttpRequestService.prototype);
	Object.defineProperty(http, 'send', { value: send });
	const webfinger = new WebfingerService(http);
	const createPerson = vi.fn();
	const updatePerson = vi.fn();
	const update = vi.fn(async (_id: string, changes: Partial<MiRemoteUser>) => {
		if (row) Object.assign(row, changes);
		return { affected: 1 };
	});
	const service: RemoteUserResolveService = Object.assign(Object.create(RemoteUserResolveService.prototype), {
		config: { host: 'local.example' }, logger,
		utilityService: { toPuny: (host: string) => host, isUriLocal: () => false },
		usersRepository: { findOneBy: vi.fn(async () => row), update },
		webfingerService: webfinger, apPersonService: { createPerson, updatePerson },
	});
	return { service, row, send, update, createPerson, updatePerson, logger };
}

describe('remote user lookup after inbox discovery', () => {
	test('serves an existing stale user when WebFinger returns XML, including the first lookup', async () => {
		const f = fixture();
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).toHaveBeenCalledOnce();
		expect(f.send).toHaveBeenCalledWith('https://remote.example/.well-known/webfinger?resource=acct%3Aalice%40remote.example', expect.objectContaining({
			headers: { Accept: 'application/jrd+json, application/json' }, size: 1024 * 256,
		}));
		expect(f.update).toHaveBeenCalledOnce();
		expect(f.createPerson).not.toHaveBeenCalled();
		expect(f.updatePerson).not.toHaveBeenCalled();
		expect(f.row?.uri).toBe(uri);
		// The failed refresh still keeps the existing retry throttle.
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).toHaveBeenCalledOnce();
	});

	test('a fresh inbox-discovered user needs neither WebFinger nor Actor GET for users/show', async () => {
		const f = fixture(true, false);
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).not.toHaveBeenCalled();
		expect(f.update).not.toHaveBeenCalled();
		expect(f.createPerson).not.toHaveBeenCalled();
		expect(f.updatePerson).not.toHaveBeenCalled();
	});

	test('does not create a new Actor from an invalid XML WebFinger response', async () => {
		const f = fixture(false);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toThrow('Failed to WebFinger');
		expect(f.createPerson).not.toHaveBeenCalled();
		expect(f.update).not.toHaveBeenCalled();
	});

	test('retains healthy WebFinger refresh and Actor update', async () => {
		const f = fixture();
		f.send.mockResolvedValue(new Response(JSON.stringify({ subject: 'acct:alice@remote.example', links: [{ rel: 'self', href: uri }] })));
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.updatePerson).toHaveBeenCalledExactlyOnceWith(uri);
	});

	test('serves stale data on WebFinger transport failure without creating another Actor', async () => {
		const f = fixture();
		f.send.mockRejectedValue(new Error('connection reset'));
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.createPerson).not.toHaveBeenCalled();
	});

	test('logs malformed JSON discovery data when falling back to the existing user', async () => {
		const f = fixture();
		f.send.mockResolvedValue(new Response('{}'));
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.logger.warn).toHaveBeenCalledWith(expect.stringContaining('after failed WebFinger'), { err: expect.any(TypeError) });
		expect(f.updatePerson).not.toHaveBeenCalled();
	});

	test('does not hide a repository failure or an Actor update failure', async () => {
		const f = fixture();
		const failure = new Error('database unavailable');
		f.update.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toBe(failure);
		expect(f.send).not.toHaveBeenCalled();
		const g = fixture();
		g.send.mockResolvedValue(new Response(JSON.stringify({ subject: 'acct:alice@remote.example', links: [{ rel: 'self', href: uri }] })));
		g.updatePerson.mockRejectedValue(failure);
		await expect(g.service.resolveUser('alice', 'remote.example')).rejects.toBe(failure);
	});
});
