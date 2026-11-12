/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbortError, FetchError, Response } from 'node-fetch';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { ApPersonService } from '../../backend/services/ApPersonService.js';
import { RemoteUserResolveService } from '../../backend/services/RemoteUserResolveService.js';
import { WebfingerResponseError, WebfingerService } from '../../backend/services/WebfingerService.js';
import { UtilityService } from '../../backend/services/UtilityService.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';

const uri = 'https://remote.example/users/alice';
const discovery = (href = uri) => new Response(JSON.stringify({ links: [{ rel: 'self', href }] }));
const networkError = (code: string) => new FetchError('request failed', 'system', { code });

function fixture(existing = true, stale = true) {
	const logger = mock<Logger>();
	const row = existing ? mock<MiRemoteUser>({
		id: 'remote-alice', uri, username: 'alice', usernameLower: 'alice', host: 'remote.example',
		lastFetchedAt: new Date(stale ? 0 : Date.now()),
	}) : null;
	const send = vi.fn(async () => discovery());
	const http: HttpRequestService = Object.create(HttpRequestService.prototype);
	Object.defineProperty(http, 'send', { value: send });
	const webfinger = new WebfingerService(http);
	const createPerson = vi.fn();
	const updatePerson = vi.fn();
	const update = vi.fn(async (_id: string, changes: Partial<MiRemoteUser>) => {
		if (row) Object.assign(row, changes);
		return { affected: 1 };
	});
	const fetchInstance = vi.fn(async () => ({ suspensionState: 'none', isNotResponding: false }));
	const meta = { blockedHosts: [] as string[] };
	const service: RemoteUserResolveService = Object.assign(Object.create(RemoteUserResolveService.prototype), {
		config: { host: 'local.example' }, logger, meta,
		federatedInstanceService: { fetch: fetchInstance },
		utilityService: { toPuny: (host: string) => host, isUriLocal: () => false, isBlockedHost: UtilityService.prototype.isBlockedHost },
		usersRepository: { findOneBy: vi.fn(async () => row), update },
		webfingerService: webfinger, apPersonService: { createPerson, updatePerson },
	});
	return { service, webfinger, row, send, update, createPerson, updatePerson, logger, fetchInstance, meta };
}

describe('cached remote user refresh', () => {
	test.each([
		...['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH', 'EPIPE'].map(networkError),
		new AbortError('request timed out'),
		...[404, 408, 410, 429, 500, 503, 599].map(status => new StatusError('HTTP failure', status)),
	])('serves cached data for a WebFinger communication error: %s', async failure => {
		const f = fixture();
		f.send.mockRejectedValue(failure);
		const before = Date.now();
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.update).toHaveBeenCalledExactlyOnceWith('remote-alice', { lastFetchedAt: expect.any(Date) });
		expect(f.row?.lastFetchedAt?.getTime()).toBeGreaterThanOrEqual(before);
		expect(f.row?.lastFetchedAt?.getTime()).toBeLessThanOrEqual(Date.now());
		expect(f.logger.warn).toHaveBeenCalledWith(expect.stringContaining('after failed WebFinger'), { err: expect.objectContaining({ cause: failure }) });
		expect(f.updatePerson).not.toHaveBeenCalled();
		expect(f.createPerson).not.toHaveBeenCalled();
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).toHaveBeenCalledOnce();
	});

	test.each([
		networkError('ENOTFOUND'), new AbortError('timeout'), new StatusError('Gone', 410), new StatusError('Unavailable', 503),
	])('serves cached data for an Actor GET communication error: %s', async failure => {
		const f = fixture();
		f.updatePerson.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.logger.warn).toHaveBeenCalledWith(expect.stringContaining('after failed Actor fetch'), { err: failure });
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.updatePerson).toHaveBeenCalledOnce();
		expect(f.update).toHaveBeenCalledOnce();
	});

	test.each([
		new Error('unexpected failure'), new TypeError('invalid data'),
		new FetchError('invalid json', 'invalid-json'), new FetchError('too large', 'max-size'),
		...[301, 400, 401, 403, 422].map(status => new StatusError('HTTP failure', status)),
	])('propagates non-communication WebFinger errors: %s', async failure => {
		const f = fixture();
		f.send.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toMatchObject({ cause: failure });
		expect(f.updatePerson).not.toHaveBeenCalled();
	});

	test.each(['{}', '<?xml version="1.0"?><XRD/>', '{"links":[]}'])('rejects malformed or missing self discovery: %s', async body => {
		const f = fixture();
		f.send.mockResolvedValue(new Response(body));
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toThrow();
		expect(f.updatePerson).not.toHaveBeenCalled();
		expect(f.logger.warn).not.toHaveBeenCalled();
	});

	test('rejects URI recovery to another host', async () => {
		const f = fixture();
		f.send.mockResolvedValue(discovery('https://other.example/users/alice'));
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toThrow('Invalid uri');
		expect(f.updatePerson).not.toHaveBeenCalled();
		expect(f.update).toHaveBeenCalledOnce();
	});

	test.each([
		[{ type: 'Note' }, 'invalid Actor type'],
		[{ id: null }, 'invalid Actor: wrong id'],
		[{ id: 'https://other.example/users/alice' }, 'invalid Actor: id has different host'],
		[{ inbox: 'https://other.example/inbox' }, 'invalid Actor: inbox has different host'],
		[{ preferredUsername: 'invalid username' }, 'invalid Actor: wrong username'],
	] as const)('propagates actual Actor validation failures: %s', async (changes, message) => {
		const f = fixture();
		const object = { type: 'Person', id: uri, inbox: 'https://remote.example/inbox', preferredUsername: 'alice', ...changes };
		const person: ApPersonService = Object.assign(Object.create(ApPersonService.prototype), {
			utilityService: { isUriLocal: () => false, punyHost: (value: string) => new URL(value).host },
			apResolverService: { createResolver: async () => ({ resolve: async () => object }) },
		});
		Object.defineProperty(person, 'fetchPerson', { value: async () => f.row });
		f.updatePerson.mockImplementation(value => person.updatePerson(value));
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toThrow(message);
		expect(f.logger.warn).not.toHaveBeenCalled();
	});

	test.each([
		new Error('person url <> uri host mismatch'), new Error('username/host mismatch'),
		Object.assign(new Error('database unavailable'), { code: 'ECONNREFUSED' }),
		new FetchError('invalid json', 'invalid-json'), new StatusError('Forbidden', 403),
	])('propagates other Actor update failures: %s', async failure => {
		const f = fixture();
		f.updatePerson.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toBe(failure);
		expect(f.logger.warn).not.toHaveBeenCalled();
	});

	test.each(['manuallySuspended', 'goneSuspended', 'autoSuspendedForNotResponding'])('skips %s hosts without changing the fetch timestamp', async suspensionState => {
		const f = fixture();
		f.fetchInstance.mockResolvedValue({ suspensionState, isNotResponding: false });
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).not.toHaveBeenCalled();
		expect(f.updatePerson).not.toHaveBeenCalled();
		expect(f.update).not.toHaveBeenCalled();
		f.fetchInstance.mockResolvedValue({ suspensionState: 'none', isNotResponding: false });
		await f.service.resolveUser('alice', 'remote.example');
		expect(f.send).toHaveBeenCalledOnce();
	});

	test.each(['remote.example', 'example'])('skips blocked hosts including parent-domain blocks: %s', async blockedHost => {
		const f = fixture();
		f.meta.blockedHosts = [blockedHost];
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).not.toHaveBeenCalled();
		expect(f.updatePerson).not.toHaveBeenCalled();
		expect(f.update).not.toHaveBeenCalled();
	});

	test('does not stop refresh for isNotResponding alone', async () => {
		const f = fixture();
		f.fetchInstance.mockResolvedValue({ suspensionState: 'none', isNotResponding: true });
		await f.service.resolveUser('alice', 'remote.example');
		expect(f.updatePerson).toHaveBeenCalledExactlyOnceWith(uri);
	});

	test.each([networkError('ENOTFOUND'), new StatusError('Gone', 410), new AbortError('timeout')])('initial discovery still fails: %s', async failure => {
		const f = fixture(false);
		f.send.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toMatchObject({ cause: failure });
		expect(f.update).not.toHaveBeenCalled();
		expect(f.createPerson).not.toHaveBeenCalled();
	});

	test('initial Actor GET still fails', async () => {
		const f = fixture(false);
		const failure = new StatusError('Gone', 410);
		f.createPerson.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toBe(failure);
	});

	test('returns the updated DB user after a successful refresh', async () => {
		const f = fixture();
		const updated = { ...f.row, name: 'Updated name' };
		const repository = Reflect.get(f.service, 'usersRepository');
		repository.findOneBy.mockResolvedValueOnce(f.row).mockResolvedValueOnce(updated);
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(updated);
		expect(f.updatePerson).toHaveBeenCalledExactlyOnceWith(uri);
		expect(f.update).toHaveBeenCalledOnce();
	});

	test('fresh users need no discovery or host lookup', async () => {
		const f = fixture(true, false);
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(f.row);
		expect(f.send).not.toHaveBeenCalled();
		expect(f.fetchInstance).not.toHaveBeenCalled();
		expect(f.update).not.toHaveBeenCalled();
	});

	test('does not hide a repository failure before discovery', async () => {
		const f = fixture();
		const failure = new Error('database unavailable');
		f.update.mockRejectedValue(failure);
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toBe(failure);
		expect(f.send).not.toHaveBeenCalled();
	});
});

const xrd = (href = uri, type = 'application/activity+json') => `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
	<Subject>acct:alice@remote.example</Subject>
	<Link rel="self" type="application/atom+xml" href="https://remote.example/alice.atom"/>
	<Link rel="self" type='${type}' href="${href}"/>
	<Link rel="http://ostatus.org/schema/1.0/subscribe" template="https://remote.example/authorize?acct={uri}"/>
</XRD>`;

describe('WebFinger JRD and XRD discovery', () => {
	test.each(['application/xrd+xml; charset=utf-8', 'application/xml', 'application/jrd+json', 'text/plain'])('parses XRD despite the requested/returned media type: %s', async contentType => {
		const f = fixture();
		f.send.mockResolvedValue(new Response(xrd(), { headers: { 'Content-Type': contentType } }));
		await expect(f.webfinger.webfinger('alice@remote.example')).resolves.toEqual({
			subject: 'acct:alice@remote.example',
			links: [
				{ rel: 'self', type: 'application/atom+xml', href: 'https://remote.example/alice.atom' },
				{ rel: 'self', type: 'application/activity+json', href: uri },
			],
		});
		expect(f.send).toHaveBeenCalledExactlyOnceWith('https://remote.example/.well-known/webfinger?resource=acct%3Aalice%40remote.example', {
			method: 'GET', headers: { Accept: 'application/jrd+json, application/json, application/xrd+xml;q=0.9' },
			timeout: 5000, size: 1024 * 256,
		});
	});

	test('parses prefixed XRD and decodes XML entities', async () => {
		const f = fixture();
		f.send.mockResolvedValue(new Response(`\uFEFF  <x:XRD xmlns:x="http://docs.oasis-open.org/ns/xri/xrd-1.0">
			<x:Subject>acct:alice@remote.example</x:Subject>
			<x:Link rel="self" type="application/activity+json" href="${uri}?a=1&amp;b=2"/>
			<other:Link xmlns:other="urn:other" rel="self" href="https://other.example/ignored"/>
		</x:XRD>`));
		await expect(f.webfinger.webfinger('alice@remote.example')).resolves.toEqual({
			subject: 'acct:alice@remote.example',
			links: [{ rel: 'self', type: 'application/activity+json', href: `${uri}?a=1&b=2` }],
		});
	});

	test.each([true, false])('JRD still resolves users (existing=%s)', async existing => {
		const f = fixture(existing);
		const created = { id: 'created-alice' };
		f.createPerson.mockResolvedValue(created);
		await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(existing ? f.row : created);
		expect(existing ? f.updatePerson : f.createPerson).toHaveBeenCalledExactlyOnceWith(uri);
	});

	test.each(['application/activity+json', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'])('XRD self links resolve new and existing users: %s', async type => {
		for (const existing of [true, false]) {
			const f = fixture(existing);
			const created = { id: 'created-alice' };
			f.createPerson.mockResolvedValue(created);
			f.send.mockResolvedValue(new Response(xrd(uri, type)));
			await expect(f.service.resolveUser('alice', 'remote.example')).resolves.toBe(existing ? f.row : created);
			expect(existing ? f.updatePerson : f.createPerson).toHaveBeenCalledExactlyOnceWith(uri);
			expect(f.logger.warn).not.toHaveBeenCalled();
		}
	});

	test.each([
		'<?xml version="1.0"?><error>upstream failure</error>',
		'<XRD><Link rel="self" href="https://remote.example/users/alice"></XRD>',
		'<XRD xmlns="urn:not-xrd"><Link rel="self" href="https://remote.example/users/alice"/></XRD>',
		'<!DOCTYPE XRD [<!ENTITY actor SYSTEM "file:///etc/passwd">]><XRD><Subject>&actor;</Subject></XRD>',
		'<html><body>Bad gateway</body></html>', 'not JSON or XML', '{', '',
	])('only cached users tolerate an unparseable discovery body: %s', async body => {
		const cached = fixture();
		cached.send.mockResolvedValue(new Response(body));
		await expect(cached.service.resolveUser('alice', 'remote.example')).resolves.toBe(cached.row);
		expect(cached.logger.warn).toHaveBeenCalledWith(expect.stringContaining('after failed WebFinger'), {
			err: expect.objectContaining({ cause: expect.any(WebfingerResponseError) }),
		});
		expect(cached.update).toHaveBeenCalledExactlyOnceWith('remote-alice', { lastFetchedAt: expect.any(Date) });
		expect(cached.updatePerson).not.toHaveBeenCalled();
		await cached.service.resolveUser('alice', 'remote.example');
		expect(cached.send).toHaveBeenCalledOnce();

		const first = fixture(false);
		first.send.mockResolvedValue(new Response(body));
		await expect(first.service.resolveUser('alice', 'remote.example')).rejects.toMatchObject({ cause: expect.any(WebfingerResponseError) });
		expect(first.createPerson).not.toHaveBeenCalled();
		expect(first.update).not.toHaveBeenCalled();
	});

	test.each([true, false])('parsed XRD without a self link still fails (existing=%s)', async existing => {
		const f = fixture(existing);
		f.send.mockResolvedValue(new Response('<XRD><Link rel="lrdd" template="https://remote.example/?resource={uri}"/></XRD>'));
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toThrow('self link not found');
		expect(f.logger.warn).not.toHaveBeenCalled();
		expect(f.createPerson).not.toHaveBeenCalled();
		expect(f.updatePerson).not.toHaveBeenCalled();
	});

	test('XRD does not bypass URI host validation', async () => {
		const f = fixture();
		f.send.mockResolvedValue(new Response(xrd('https://other.example/users/alice')));
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toThrow('Invalid uri');
		expect(f.logger.warn).not.toHaveBeenCalled();
		expect(f.updatePerson).not.toHaveBeenCalled();
	});

	test('does not classify response-size errors as parse failures', async () => {
		const f = fixture();
		f.send.mockResolvedValue(new Response(xrd(), { size: 10 }));
		await expect(f.service.resolveUser('alice', 'remote.example')).rejects.toMatchObject({ cause: { type: 'max-size' } });
		expect(f.logger.warn).not.toHaveBeenCalled();
	});
});
