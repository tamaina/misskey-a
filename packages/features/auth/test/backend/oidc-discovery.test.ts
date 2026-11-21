/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { expect, test, vi } from 'vitest';
import { createOidcDiscovery } from '../../backend/oidc-discovery.js';
import { createClientMetadataFetcher } from '../../backend/oauth/ClientMetadataFetcher.js';
import type { ClientMetadataNetwork } from '../../backend/oauth/ClientMetadataFetcher.js';
import type { IncomingMessage } from 'node:http';
import type { ConnectionOptions } from 'node:tls';
import type { Agent, RequestOptions } from 'node:https';
import type { Socket } from 'node:net';

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

const issuer = 'https://issuer.example/realm';
const provider = { id: 'synthetic', version: '1', issuer, clientId: 'fixture', enabled: true };
const metadata = { issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/keys`, response_types_supported: ['code'], id_token_signing_alg_values_supported: ['RS256'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_basic'] };
const body = (overrides = {}) => Buffer.from(JSON.stringify({ ...metadata, ...overrides }));

test('disabled providers never access network', async () => {
	const f = fixture({ body: body() });
	await expect(createOidcDiscovery(f.dependencies)({ ...provider, enabled: false })).rejects.toThrow('disabled');
	expect(f.dependencies.lookup).not.toHaveBeenCalled();
});

test('discovers finite metadata through pinned public TLS', async () => {
	const f = fixture({ body: body() });
	expect(await createOidcDiscovery(f.dependencies)(provider)).toEqual(metadata);
	expect(f.dependencies.request).toHaveBeenCalledWith(new URL(`${issuer}/.well-known/openid-configuration`), expect.anything(), expect.anything());
	expect(f.socket.destroy).toHaveBeenCalled();
});

test.each([
	{ addresses: ['127.0.0.1'] }, { addresses: [address, '10.0.0.1'] },
	{ peer: '127.0.0.1' }, { authorized: false }, { status: 302 },
	{ type: 'text/html' }, { length: '65537' }, { body: Buffer.alloc(65537) },
	{ body: Buffer.from('malformed') }, { body: body({ issuer: 'https://other.example' }) },
	...['authorization_endpoint', 'token_endpoint', 'jwks_uri'].map(key => ({ body: body({ [key]: 'https://other.example/path' }) })),
])('rejects unsafe discovery response/network %j', async options => {
	const f = fixture({ body: body(), ...options });
	await expect(createOidcDiscovery(f.dependencies)(provider)).rejects.toThrow();
});

test.each(['http://issuer.example', 'https://user:secret@issuer.example', `${issuer}?query=x`, `${issuer}#`])('rejects invalid configured issuer before network: %s', async value => {
	const f = fixture({ body: body() });
	await expect(createOidcDiscovery(f.dependencies)({ ...provider, issuer: value })).rejects.toThrow();
	expect(f.dependencies.lookup).not.toHaveBeenCalled();
});
