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

const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = generateKeyPairSync('ed25519');
const privatePem = (pair: typeof rsa) => pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicPem = (pair: typeof rsa) => pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const actorId = 'https://local.example/users/alice';
const target = 'https://remote.example:8443/inbox?cursor=1';
const activity = { id: `${actorId}/activities/1`, type: 'Update', actor: actorId, object: { id: actorId, type: 'Person', name: 'Alice あ' } };
type SentRequest = { method: string; headers: Record<string, string>; body?: string };

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

test('native RSA and Ed GET/POST signatures survive real loopback HTTP transport', async () => {
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
		expect(received).toHaveLength(9);
	} finally {
		http.httpAgent.destroy();
		http.httpsAgent.destroy();
		await server.close();
		fixture.keys.dispose();
	}
}, 15000);
