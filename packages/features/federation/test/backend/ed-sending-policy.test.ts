/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { generateKeyPairSync, verify } from 'node:crypto';
import { Response } from 'node-fetch';
import Fastify from 'fastify';
import { describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { parseRequestSignature } from '@misskey-dev/node-http-message-signatures';
import type * as Redis from 'ioredis';
import { UserKeypairService } from '@features/federation/backend/services/UserKeypairService.js';
import { ApRequestCreator, ApRequestService } from '@features/federation/backend/services/ApRequestService.js';
import { FetchAllowSoftFailMask } from '@features/federation/backend/protocol/misc/check-against-url.js';
import { FetchInstanceMetadataService } from '@features/federation/backend/services/FetchInstanceMetadataService.js';
import { NodeinfoServerService } from '@features/instance/backend/http/NodeinfoServerService.js';
import { MiUserKeypair } from '@features/federation/backend/models/UserKeypair.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { Config } from '@/config.js';
import { MiInstance } from '@features/federation/backend/models/Instance.js';
import type { UserKeypairsRepository } from '@features/persistence/backend/repositories/models.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import { RemoteUserResolveService } from '../../backend/services/RemoteUserResolveService.js';
import { Resolver } from '../../backend/services/ApResolverService.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const privatePem = (pair: typeof rsa) => pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicPem = (pair: typeof rsa) => pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const actorId = 'https://local.example/users/alice';
const target = 'https://remote.example:8443/inbox?cursor=1';
const activity = { id: `${actorId}/activities/1`, type: 'Update', actor: actorId, object: { id: actorId, type: 'Person', name: 'Alice あ' } };
type SentRequest = { method: string; headers: Record<string, string>; body?: string };

function responseAt(body: string, contentType = 'application/activity+json', url = target) {
	const response = new Response(body, { headers: { 'content-type': contentType } });
	Object.defineProperty(response, 'url', { value: url });
	return response;
}

function requestFixture(withEd = true) {
	const entity = new MiUserKeypair({
		userId: 'alice', privateKey: privatePem(rsa), publicKey: publicPem(rsa),
		ed25519PrivateKey: withEd ? privatePem(ed) : null, ed25519PublicKey: withEd ? publicPem(ed) : null,
	});
	const repository = mock<UserKeypairsRepository>();
	repository.findOneByOrFail.mockResolvedValue(entity);
	const users = mock<UserEntityService>();
	users.genLocalUserUri.mockReturnValue(actorId);
	const keys = new UserKeypairService(mock<Redis.Redis>(), mock<Redis.Redis>(), repository, mock<GlobalEventService>(), users);
	const send = vi.fn(async (_url: string, _options: SentRequest) => {
		const response = new Response(JSON.stringify({ id: target, type: 'Person' }), { headers: { 'content-type': 'application/activity+json' } });
		Object.defineProperty(response, 'url', { value: target });
		return response;
	});
	const service: ApRequestService = Object.assign(Object.create(ApRequestService.prototype), {
		userKeypairService: keys, httpRequestService: { send }, logger: mock<Logger>(),
	});
	return { keys, send, service };
}

function assertSignature(request: SentRequest, useEd: boolean) {
	// The transport regenerates Host; ApRequestCreator deliberately removes it before sending.
	expect(request.headers).not.toHaveProperty('host');
	const parsed = parseRequestSignature({ url: target, ...request, headers: { ...request.headers, host: new URL(target).host } });
	expect(parsed.version).toBe('draft');
	if (parsed.version !== 'draft') throw new Error('Expected draft signature');
	expect(parsed.value.keyId).toBe(`${actorId}${useEd ? '#ed25519-key' : '#main-key'}`);
	const publicKey = (useEd ? ed : rsa).publicKey;
	const signature = Buffer.from(parsed.value.params.signature, 'base64');
	expect(verify(useEd ? null : 'sha256', Buffer.from(parsed.value.signingString), publicKey, signature)).toBe(true);
	expect(verify(useEd ? null : 'sha256', Buffer.from(`${parsed.value.signingString}tampered`), publicKey, signature)).toBe(false);
	if (request.method === 'POST') {
		expect(request.body).toBe(JSON.stringify(activity));
		expect(request.headers.digest).toBe(ApRequestCreator.createDigest(JSON.stringify(activity)));
		expect(parsed.value.signingString).toContain(`digest: ${request.headers.digest}`);
	}
}

describe('Ed sending policy', () => {
	test.each([401, 403])('cold users/show resolution recovers from an Ed key discovery rejection (%s)', async status => {
		const fixture = requestFixture();
		const remoteUser = mock<MiRemoteUser>({ id: 'remote-alice', uri: target, lastFetchedAt: new Date() });
		let cached: MiRemoteUser | null = null;
		const order: string[] = [];
		// Model a peer whose inbox supports Ed, but whose authenticated GET
		// verifier can bootstrap only the legacy publicKey until it caches assertionMethod.
		fixture.send.mockImplementation(async (_url, request) => {
			const parsed = parseRequestSignature({ url: target, ...request, headers: { ...request.headers, host: new URL(target).host } });
			if (parsed.version !== 'draft') throw new Error('Expected draft signature');
			const useEd = parsed.value.keyId === `${actorId}#ed25519-key`;
			order.push(useEd ? 'GET Ed' : 'GET RSA');
			assertSignature(request, useEd);
			if (useEd) throw new StatusError('signer key unavailable during Actor discovery', status);
			const response = responseAt(JSON.stringify({ '@context': 'https://www.w3.org/ns/activitystreams', id: target, type: 'Person' }));
			return response;
		});
		const utility = {
			toPuny: (host: string) => host, isUriLocal: () => false,
			extractDbHost: (url: string) => new URL(url).hostname,
			isSelfHost: () => false, isFederationAllowedHost: () => true,
		};
		const resolver: Resolver = Object.assign(Object.create(Resolver.prototype), {
			history: new Set(), recursionLimit: 256, meta: { signToActivityPubGet: true }, utilityService: utility,
			systemAccountService: { fetch: async () => ({ id: 'alice' }) }, apRequestService: fixture.service,
			federatedInstanceService: { fetch: async () => ({ httpMessageSignaturesImplementationLevel: '02' }) },
		});
		const resolve: RemoteUserResolveService = Object.assign(Object.create(RemoteUserResolveService.prototype), {
			config: { host: 'local.example' }, utilityService: utility, logger: mock<Logger>(),
			usersRepository: { findOneBy: async () => cached },
			webfingerService: { webfinger: async () => { order.push('WebFinger'); return { links: [{ rel: 'self', href: target }] }; } },
			apPersonService: { createPerson: async (uri: string) => {
				await resolver.resolve(uri);
				order.push('save Actor and keys');
				cached = remoteUser;
				return remoteUser;
			} },
		});
		try {
			// users/show maps a rejection from this exact service to FAILED_TO_RESOLVE_REMOTE_USER.
			await expect(resolve.resolveUser('alice', 'remote.example')).resolves.toBe(remoteUser);
			expect(order).toEqual(['WebFinger', 'GET Ed', 'GET RSA', 'save Actor and keys']);
			await expect(resolve.resolveUser('alice', 'remote.example')).resolves.toBe(remoteUser);
			expect(fixture.send).toHaveBeenCalledTimes(2);
		} finally { fixture.keys.dispose(); }
	});

	test.each([400, 404, 429, 500])('does not retry Ed GET on unrelated HTTP status %s', async status => {
		const fixture = requestFixture();
		const failure = new StatusError('failed', status);
		fixture.send.mockRejectedValue(failure);
		try {
			await expect(fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, '02')).rejects.toBe(failure);
			expect(fixture.send).toHaveBeenCalledOnce();
		} finally { fixture.keys.dispose(); }
	});

	test.each(['00', '02'])('does not retry an RSA authentication failure (level %s)', async level => {
		const fixture = requestFixture(false);
		const failure = new StatusError('forbidden', 403);
		fixture.send.mockRejectedValue(failure);
		try {
			await expect(fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, level)).rejects.toBe(failure);
			expect(fixture.send).toHaveBeenCalledOnce();
		} finally { fixture.keys.dispose(); }
	});

	test('propagates the RSA rejection after a single Ed authentication fallback', async () => {
		const fixture = requestFixture();
		const failure = new StatusError('forbidden', 403);
		fixture.send.mockRejectedValue(failure);
		try {
			await expect(fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, '02')).rejects.toBe(failure);
			expect(fixture.send).toHaveBeenCalledTimes(2);
			assertSignature(fixture.send.mock.calls[0][1], true);
			assertSignature(fixture.send.mock.calls[1][1], false);
		} finally { fixture.keys.dispose(); }
	});

	test('does not retry a transport failure or a POST authentication rejection', async () => {
		const fixture = requestFixture();
		try {
			const failure = new Error('connection reset');
			fixture.send.mockRejectedValueOnce(failure);
			await expect(fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, '02')).rejects.toBe(failure);
			const forbidden = new StatusError('forbidden', 403);
			fixture.send.mockRejectedValueOnce(forbidden);
			await expect(fixture.service.signedPost({ id: 'alice' }, target, activity, undefined, { level: '02' })).rejects.toBe(forbidden);
			expect(fixture.send).toHaveBeenCalledTimes(2);
		} finally { fixture.keys.dispose(); }
	});

	test.each(['content-type', 'id'])('validates the RSA fallback response %s', async invalid => {
		const fixture = requestFixture();
		fixture.send.mockRejectedValueOnce(new StatusError('forbidden', 403));
		fixture.send.mockResolvedValueOnce(responseAt(JSON.stringify({ id: invalid === 'id' ? 'https://other.example/actor' : target }), invalid === 'content-type' ? 'text/plain' : 'application/activity+json'));
		try {
			await expect(fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, '02')).rejects.toThrow();
			expect(fixture.send).toHaveBeenCalledTimes(2);
		} finally { fixture.keys.dispose(); }
	});

	test('keeps RSA for an HTML alternate after authentication fallback', async () => {
		const fixture = requestFixture();
		const alternate = 'https://remote.example:8443/actor';
		fixture.send.mockRejectedValueOnce(new StatusError('forbidden', 401));
		fixture.send.mockResolvedValueOnce(responseAt(`<html><head><link rel="alternate" type="application/activity+json" href="${alternate}"></head></html>`, 'text/html'));
		fixture.send.mockResolvedValueOnce(responseAt(JSON.stringify({ id: alternate }), 'application/activity+json', alternate));
		Object.defineProperty(fixture.service, 'utilityService', { value: { punyHost: (url: string) => new URL(url).hostname } });
		try {
			await expect(fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, true, '02')).resolves.toEqual({ id: alternate });
			expect(fixture.send).toHaveBeenCalledTimes(3);
			expect(fixture.send.mock.calls.map(([, request]) => request.headers.signature)).toEqual([
				expect.stringContaining(`${actorId}#ed25519-key`), expect.stringContaining(`${actorId}#main-key`), expect.stringContaining(`${actorId}#main-key`),
			]);
		} finally { fixture.keys.dispose(); }
	});

	test.each(['00', '01', '02', '10', '11', '12', 'x2', 'ed25519', 2, null, undefined])('GET and POST use Ed only for recognized draft marker 02: %s', async level => {
		const fixture = requestFixture();
		try {
			await fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, level);
			assertSignature(fixture.send.mock.calls[0][1], level === '02');
			await fixture.service.signedPost({ id: 'alice' }, target, activity, undefined, { level });
			assertSignature(fixture.send.mock.calls[1][1], level === '02');
		} finally {
			fixture.keys.dispose();
		}
	});

	test('forceMainKey signs a peer advertising 02 with RSA without altering the activity', async () => {
		const fixture = requestFixture();
		try {
			await fixture.service.signedPost({ id: 'alice' }, target, activity, undefined, { level: '02', forceMainKey: true });
			assertSignature(fixture.send.mock.calls[0][1], false);
		} finally {
			fixture.keys.dispose();
		}
	});

	test('a peer advertising 02 falls back to RSA for GET and POST when no local Ed key exists', async () => {
		const fixture = requestFixture(false);
		try {
			await fixture.service.signedGet(target, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, '02');
			await fixture.service.signedPost({ id: 'alice' }, target, activity, undefined, { level: '02' });
			for (const [, request] of fixture.send.mock.calls) assertSignature(request, false);
		} finally {
			fixture.keys.dispose();
		}
	});
});

function metadataFixture(stored: string, advertised: unknown, fails = false) {
	const instance = Object.assign(new MiInstance(), { id: 'peer', host: 'remote.example', httpMessageSignaturesImplementationLevel: stored, infoUpdatedAt: new Date() });
	const getJson = vi.fn(async (url: string) => {
		if (url.endsWith('/manifest.json')) return {};
		if (fails) throw new Error('network failure');
		if (url.endsWith('/.well-known/nodeinfo')) return { links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href: 'https://remote.example/nodeinfo/2.1' }] };
		return { metadata: advertised === undefined ? {} : { httpMessageSignaturesImplementationLevel: advertised } };
	});
	const update = vi.fn(async (_id: string, updates: Record<string, unknown>) => { Object.assign(instance, updates); });
	const service: FetchInstanceMetadataService = Object.assign(Object.create(FetchInstanceMetadataService.prototype), {
		logger: mock<Logger>(),
		httpRequestService: { getJson, getHtml: vi.fn(async () => { throw new Error('no HTML'); }), send: vi.fn(async () => ({ ok: false })) },
		federatedInstanceService: { fetchOrRegister: vi.fn(async () => instance), update }, redisClient: mock<Redis.Redis>(),
	});
	return { instance, getJson, update, service };
}

describe('HTTP signature capability metadata', () => {
	test.each(['01', '11'])('keeps cached deprecated marker %s until a successful refetch', async stored => {
		const fixture = metadataFixture(stored, '02');
		await fixture.service.fetchInstanceMetadata(fixture.instance);
		expect(fixture.getJson).not.toHaveBeenCalled();
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe(stored);
		await fixture.service.fetchInstanceMetadata(fixture.instance, true);
		expect(fixture.getJson).toHaveBeenCalledWith('https://remote.example/nodeinfo/2.1');
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe('02');
	});

	test.each(['00', '01', '02', '10', '11', '12', undefined, null, 'x2', 2, {}])('stores recognized markers and normalizes invalid or absent metadata to 00: %s', async advertised => {
		const fixture = metadataFixture('02', advertised);
		await fixture.service.fetchInstanceMetadata(fixture.instance, true);
		const expected = typeof advertised === 'string' && ['00', '01', '02', '10', '11', '12'].includes(advertised) ? advertised : '00';
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe(expected);
	});

	test.each(['11', '02'])('failed NodeInfo retrieval preserves stored marker %s', async stored => {
		const fixture = metadataFixture(stored, '02', true);
		await fixture.service.fetchInstanceMetadata(fixture.instance, true);
		expect(fixture.instance.httpMessageSignaturesImplementationLevel).toBe(stored);
		expect(fixture.update).toHaveBeenCalledOnce();
		expect(fixture.update.mock.calls[0][1]).not.toHaveProperty('httpMessageSignaturesImplementationLevel');
	});

	test('both NodeInfo endpoints advertise draft assertionMethod marker 02', async () => {
		const service: NodeinfoServerService = Object.assign(Object.create(NodeinfoServerService.prototype), {
			config: { url: 'https://local.example', version: 'test' },
			systemAccountService: { fetch: vi.fn(async () => ({ username: 'proxy' })) },
			metaService: { fetch: vi.fn(async () => ({ policies: {}, repositoryUrl: 'https://example.com/repo' })) },
			notesChart: { getChart: vi.fn(async () => ({ local: { total: [1] } })) },
			usersChart: { getChart: vi.fn(async () => ({ local: { total: [1] } })) },
		});
		const fastify = Fastify();
		service.createServer(fastify, {}, () => {});
		try {
			for (const path of ['/nodeinfo/2.0', '/nodeinfo/2.1']) {
				const response = await fastify.inject({ url: path });
				expect(response.statusCode).toBe(200);
				expect(response.json().metadata.httpMessageSignaturesImplementationLevel).toBe('02');
			}
		} finally {
			await fastify.close();
		}
	});
});

test('native RSA and Ed GET/POST signatures and GET authentication fallback survive real loopback HTTP transport', async () => {
	const fixture = requestFixture();
	const http = new HttpRequestService(mock<Config>({ userAgent: 'ed-sending-policy-test', proxy: undefined, outgoingAddress: undefined, deliverJobConcurrency: 1, proxyBypassHosts: [], allowedPrivateNetworks: [] }));
	Object.defineProperty(fixture.service, 'httpRequestService', { value: http });
	const server = Fastify();
	const received: { method: string; keyId: string; body: unknown }[] = [];
	server.addContentTypeParser('application/activity+json', { parseAs: 'string' }, (_request, body, done) => {
		try { done(null, JSON.parse(body as string)); } catch (error) { done(error as Error); }
	});
	server.route({ method: ['GET', 'POST'], url: '/inbox', handler: async (request, reply) => {
		const parsed = parseRequestSignature(request.raw, {
			requiredComponents: { draft: request.method === 'POST' ? ['(request-target)', 'host', 'date', 'digest'] : ['(request-target)', 'host', 'date'] },
			clockSkew: { forward: 300000, delay: 300000 },
		});
		if (parsed.version !== 'draft') throw new Error('Expected draft signature');
		const isEd = parsed.value.keyId === `${actorId}#ed25519-key`;
		expect(verify(isEd ? null : 'sha256', Buffer.from(parsed.value.signingString), (isEd ? ed : rsa).publicKey, Buffer.from(parsed.value.params.signature, 'base64'))).toBe(true);
		if (request.method === 'POST') {
			expect(request.body).toEqual(activity);
			expect(request.headers.digest).toBe(ApRequestCreator.createDigest(JSON.stringify(activity)));
		}
		received.push({ method: request.method, keyId: parsed.value.keyId, body: request.body });
		if (request.method === 'POST') return reply.code(202).send();
		if (request.url.includes('bootstrap=1') && isEd) return reply.code(403).send();
		return reply.type('application/activity+json').send({ id: `http://${request.headers.host}${request.url}`, type: 'Person' });
	} });
	try {
		const origin = await server.listen({ host: '127.0.0.1', port: 0 });
		const url = `${origin}/inbox?cursor=1`;
		for (const level of ['02', '12', '01', undefined]) {
			await fixture.service.signedGet(url, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, level);
			await fixture.service.signedPost({ id: 'alice' }, url, activity, undefined, { level });
			const keyId = `${actorId}${level === '02' ? '#ed25519-key' : '#main-key'}`;
			expect(received.slice(-2).map(value => [value.method, value.keyId])).toEqual([['GET', keyId], ['POST', keyId]]);
		}
		await fixture.service.signedPost({ id: 'alice' }, url, activity, undefined, { level: '02', forceMainKey: true });
		expect(received.at(-1)?.keyId).toBe(`${actorId}#main-key`);
		await expect(fixture.service.signedGet(`${origin}/inbox?bootstrap=1`, { id: 'alice' }, FetchAllowSoftFailMask.Strict, false, '02')).resolves.toMatchObject({ type: 'Person' });
		expect(received.slice(-2).map(value => value.keyId)).toEqual([`${actorId}#ed25519-key`, `${actorId}#main-key`]);
		expect(received).toHaveLength(11);
	} finally {
		http.httpAgent.destroy();
		http.httpsAgent.destroy();
		await server.close();
		fixture.keys.dispose();
	}
}, 15000);
