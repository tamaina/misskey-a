/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter, once } from 'node:events';
import { Readable } from 'node:stream';
import tls from 'node:tls';
import { expect, test, vi } from 'vitest';
import { createClientMetadataFetcher } from '../../backend/oauth/ClientMetadataFetcher.js';
import type { ClientMetadataNetwork } from '../../backend/oauth/ClientMetadataFetcher.js';
import type { IncomingMessage } from 'node:http';
import type { ConnectionOptions } from 'node:tls';
import type { Agent, RequestOptions } from 'node:https';
import type { Socket } from 'node:net';

const id = 'https://client.example/oauth/client.json';
const address = '93.184.216.34';

function fixture(options: {
	addresses?: string[];
	peer?: string;
	authorized?: boolean;
	status?: number;
	type?: string;
	encoding?: string;
	length?: string;
	body?: Buffer;
	connectError?: boolean;
} = {}) {
	const socket = Object.assign(new EventEmitter(), {
		authorized: options.authorized ?? true,
		remoteAddress: options.peer ?? address,
		destroy: vi.fn(),
	});
	const request = Object.assign(new EventEmitter(), { destroy: vi.fn(), end: vi.fn() });
	let tlsOptions: ConnectionOptions | undefined;
	let httpOptions: RequestOptions | undefined;
	let httpStarted = false;
	const dependencies = {
		lookup: vi.fn(async () => (options.addresses ?? [address]).map(value => ({ address: value, family: value.includes(':') ? 6 : 4 }))),
		connect: vi.fn((value: ConnectionOptions) => {
			tlsOptions = value;
			queueMicrotask(() => socket.emit(options.connectError ? 'error' : 'secureConnect', new Error('Sensitive DNS/TLS detail')));
			return socket;
		}),
		request: vi.fn((_url: URL, value: RequestOptions, receive: (response: IncomingMessage) => void) => {
			httpOptions = value;
			request.end.mockImplementation(() => {
				(value.agent as Agent).createConnection({}, (error: Error | null) => {
					if (error) {
						request.emit('error', error);
						return;
					}
					httpStarted = true;
					const response = Object.assign(Readable.from([options.body ?? Buffer.from('{"client_id":"fixture"}')]), {
						statusCode: options.status ?? 200,
						headers: { 'content-type': options.type ?? 'application/json',
							...(options.encoding ? { 'content-encoding': options.encoding } : {}),
							...(options.length ? { 'content-length': options.length } : {}) },
					});
					receive(response as IncomingMessage);
				});
			});
			return request;
		}),
	} as unknown as ClientMetadataNetwork;
	return { dependencies, socket, request, fetch: createClientMetadataFetcher(dependencies),
		tlsOptions: () => tlsOptions, httpOptions: () => httpOptions, httpStarted: () => httpStarted };
}

test('direct pinned TLS preserves original certificate hostname and bypasses proxy agents', async () => {
	const f = fixture();
	const response = await f.fetch(id);
	expect(await response.json()).toEqual({ client_id: 'fixture' });
	expect(response.url).toBe(id);
	expect(f.tlsOptions()).toMatchObject({ host: address, port: 443, servername: 'client.example', rejectUnauthorized: true });
	expect(f.tlsOptions()?.checkServerIdentity?.('irrelevant', { subjectaltname: 'DNS:wrong.example' } as never)).toBeInstanceOf(Error);
	expect(f.httpOptions()).toMatchObject({ method: 'GET', headers: { 'accept-encoding': 'identity' } });
	expect(f.socket.destroy).toHaveBeenCalled();
});

test.each(['http://client.example/client.json', 'https://client.example/', 'https://user:pass@client.example/client.json',
	'https://client.example/client.json#secret', 'https://client.example/client.json#'])('reject unsafe client URL %s before network', async url => {
	const f = fixture();
	await expect(f.fetch(url)).rejects.toThrow('Invalid HTTPS');
	expect(f.dependencies.lookup).not.toHaveBeenCalled();
	expect(f.dependencies.request).not.toHaveBeenCalled();
});

test.each(['127.0.0.1', '0.0.0.0', '10.0.0.1', '172.16.0.1', '192.168.0.1', '169.254.169.254',
	'100.64.0.1', '224.0.0.1', '::1', '::', 'fc00::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1',
	'::ffff:10.0.0.1', '2002:7f00:1::', 'fe80::1%eth0', '::127.0.0.1', '::2', '4000::1',
	'2001:db8::1', '64:ff9b::a00:1', '2001::1'])('reject DNS address %s, including mixed answer sets', async value => {
	const f = fixture({ addresses: [address, value] });
	await expect(f.fetch(id)).rejects.toThrow(/client metadata address/);
	expect(f.dependencies.connect).not.toHaveBeenCalled();
	expect(f.dependencies.request).not.toHaveBeenCalled();
});

test.each(['127.0.0.1', '::ffff:127.0.0.1', '1.1.1.1'])('reject changed actual peer %s before HTTP bytes', async peer => {
	const f = fixture({ peer });
	await expect(f.fetch(id)).rejects.toThrow('Client metadata request failed');
	expect(f.httpStarted()).toBe(false);
});

test('accept public IPv6 and normalize mapped public socket addresses', async () => {
	const ipv6 = '2606:4700:4700::1111';
	const v6 = fixture({ addresses: [ipv6], peer: ipv6 });
	await expect(v6.fetch(id)).resolves.toBeDefined();
	const mapped = fixture({ peer: '::ffff:93.184.216.34' });
	await expect(mapped.fetch(id)).resolves.toBeDefined();
});

test.each([{ authorized: false }, { connectError: true }])('reject failed TLS without HTTP bytes or sensitive errors: %j', async options => {
	const f = fixture(options);
	await expect(f.fetch(id)).rejects.toThrow('Client metadata request failed');
	expect(f.httpStarted()).toBe(false);
});

test.each([{ status: 302 }, { status: 404 }, { type: 'image/png' }, { encoding: 'gzip' }, { length: '65537' }])(
	'reject redirects, unsupported types/encoding and oversized declared length: %j', async options => {
		const f = fixture(options);
		await expect(f.fetch(id)).rejects.toThrow('Invalid client metadata response');
		expect(f.dependencies.request).toHaveBeenCalledTimes(1);
	});

test('bound actual streamed bytes without trusting content-length', async () => {
	const f = fixture({ body: Buffer.alloc(65537), length: '1' });
	await expect(f.fetch(id)).rejects.toThrow('Client metadata response too large');
});

test('total deadline includes DNS and prevents late resolution from starting a connection', async () => {
	const f = fixture();
	let resolveLookup: ((value: { address: string; family: number }[]) => void) | undefined;
	f.dependencies.lookup = () => new Promise(resolve => { resolveLookup = resolve; });
	await expect(createClientMetadataFetcher(f.dependencies, 5)(id)).rejects.toThrow('deadline exceeded');
	resolveLookup?.([{ address, family: 4 }]);
	await new Promise(resolve => setImmediate(resolve));
	expect(f.dependencies.connect).not.toHaveBeenCalled();
});

// Public, synthetic test-only EC key/certificate for client.example; never an application credential.
const fixtureKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgFIEgNdW+jtYdxQuT
rl4yFADudR+s12xcc8tVq3csxGOhRANCAATqiI/tjjJLTCJ1bVrOrXNKvxayuVbl
UXQiCOlN6KE7yW1esFRiWUHmke796wCzID6LRVpQW1Uyb718z4h2DFfa
-----END PRIVATE KEY-----`;
const fixtureCertificate = `-----BEGIN CERTIFICATE-----
MIIBpDCCAUqgAwIBAgIUZulUIdMXxOi5bWPrU1bEXFp+wT8wCgYIKoZIzj0EAwIw
GTEXMBUGA1UEAwwOY2xpZW50LmV4YW1wbGUwIBcNMjYxMDEwMTQ0NTUxWhgPMjEy
NjA5MTYxNDQ1NTFaMBkxFzAVBgNVBAMMDmNsaWVudC5leGFtcGxlMFkwEwYHKoZI
zj0CAQYIKoZIzj0DAQcDQgAE6oiP7Y4yS0widW1azq1zSr8WsrlW5VF0IgjpTeih
O8ltXrBUYllB5pHu/esAsyA+i0VaUFtVMm+9fM+IdgxX2qNuMGwwHQYDVR0OBBYE
FFbsri33CaPHWHtwb9oRzHX0/yX9MB8GA1UdIwQYMBaAFFbsri33CaPHWHtwb9oR
zHX0/yX9MA8GA1UdEwEB/wQFMAMBAf8wGQYDVR0RBBIwEIIOY2xpZW50LmV4YW1w
bGUwCgYIKoZIzj0EAwIDSAAwRQIhAMMqHYVC99zdZ5jhzI9eHRpH5RX2tTLrxBDU
B2IwF7igAiAyvJj/xjxZg+cfuGDWNAHfB6VFHknEcd+kq5axWNk2Sg==
-----END CERTIFICATE-----`;

test.each([true, false])('real TLS peer/trust rejection emits no HTTP bytes (trusted test CA: %s)', async trustCertificate => {
	let httpBytes = 0;
	let authenticatedTls = false;
	const sockets = new Set<Socket>();
	const server = tls.createServer({ key: fixtureKey, cert: fixtureCertificate }, socket => {
		socket.on('data', chunk => { httpBytes += chunk.length; });
	});
	server.on('connection', socket => {
		sockets.add(socket);
		socket.once('close', () => sockets.delete(socket));
	});
	server.listen(0, '127.0.0.1');
	try {
		await once(server, 'listening');
		const listenerAddress = server.address();
		if (!listenerAddress || typeof listenerAddress === 'string') throw new Error('Missing synthetic TLS listener');
		const f = fixture();
		// Only the test transport redirects the dial to loopback. Production peer
		// validation must still reject it, after real hostname/trust verification.
		f.dependencies.connect = ((options: ConnectionOptions) => {
			const socket = tls.connect({ ...options, host: '127.0.0.1', port: listenerAddress.port,
				ca: trustCertificate ? fixtureCertificate : undefined });
			socket.once('secureConnect', () => { authenticatedTls = true; });
			return socket;
		}) as typeof tls.connect;
		// Exercise the actual HTTPS Agent/request handshake, not the mock request.
		const https = await import('node:https');
		f.dependencies.request = https.request;
		await expect(createClientMetadataFetcher(f.dependencies)(id)).rejects.toThrow('Client metadata request failed');
		await new Promise(resolve => setImmediate(resolve));
		expect(authenticatedTls).toBe(trustCertificate);
		expect(httpBytes).toBe(0);
	} finally {
		for (const socket of sockets) socket.destroy();
		await new Promise<void>(resolve => server.close(() => resolve()));
	}
});
