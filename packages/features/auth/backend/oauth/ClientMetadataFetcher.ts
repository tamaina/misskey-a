/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import dns from 'node:dns/promises';
import https from 'node:https';
import tls from 'node:tls';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';
import { Response } from 'node-fetch';
import type { ResponseInit } from 'node-fetch';
import type { LookupAddress } from 'node:dns';
import type { ClientRequest } from 'node:http';

const MAX_BYTES = 64 * 1024;
const DEADLINE_MS = 5000;

/** Explicit dependency injection for synthetic tests; production has no relaxed-network mode. */
export interface ClientMetadataNetwork {
	lookup: (hostname: string) => Promise<LookupAddress[]>;
	connect: typeof tls.connect;
	request: typeof https.request;
}

const network: ClientMetadataNetwork = {
	lookup: hostname => dns.lookup(hostname, { all: true, verbatim: true }),
	connect: tls.connect,
	request: https.request,
};

function publicAddress(address: string): string {
	// Zone identifiers and transition/translated ranges must not bypass IPv4 policy.
	if (address.includes('%') || !ipaddr.isValid(address)) throw new Error('Invalid client metadata address');
	const parsed = ipaddr.process(address);
	// Only the allocated IPv6 global-unicast block is eligible. In particular,
	// deprecated IPv4-compatible ::/96 addresses must not become a private-IP path.
	if (parsed.range() !== 'unicast' || (parsed.kind() === 'ipv6' && (parsed.toByteArray()[0] & 0xe0) !== 0x20)) {
		throw new Error('Non-public client metadata address');
	}
	return parsed.toNormalizedString();
}

export function validateMetadataClientUrl(id: string): URL {
	const url = new URL(id);
	if (url.protocol !== 'https:' || url.username || url.password || id.includes('#') || url.pathname === '/') {
		throw new Error('Invalid HTTPS client metadata URL');
	}
	return url;
}

/**
 * Direct HTTPS, independent of instance proxies/private-network allowlists. All DNS
 * answers must be public; the connection is pinned to one validated address. The
 * TLS socket is handed to HTTP only after both certificate and peer checks pass.
 */
export function createClientMetadataFetcher(dependencies: ClientMetadataNetwork = network, deadlineMs = DEADLINE_MS) {
	return async (id: string): Promise<Response> => {
		const url = validateMetadataClientUrl(id);
		const hostname = url.hostname.replace(/^\[|\]$/g, '');
		let socket: tls.TLSSocket | undefined;
		let request: ClientRequest | undefined;
		let expired = false;
		const agent = new https.Agent({ keepAlive: false, maxSockets: 1 });
		let timer: ReturnType<typeof setTimeout> | undefined;
		const deadline = new Promise<never>((_resolve, reject) => {
			timer = setTimeout(() => {
				expired = true;
				reject(new Error('Client metadata deadline exceeded'));
				request?.destroy();
				socket?.destroy();
			}, deadlineMs);
		});
		const operation = async (): Promise<Response> => {
			const addresses = isIP(hostname)
				? [{ address: hostname, family: isIP(hostname) }]
				: await dependencies.lookup(hostname);
			if (expired) throw new Error('Client metadata deadline exceeded');
			if (!addresses.length) throw new Error('Client metadata DNS returned no addresses');
			const normalized = addresses.map(answer => publicAddress(answer.address));
			const target = addresses[0];
			if (target.family !== 4 && target.family !== 6) throw new Error('Invalid client metadata address family');
			agent.createConnection = (_options, callback) => {
				if (!callback) throw new Error('Client metadata connection callback required');
				socket = dependencies.connect({
					host: target.address,
					port: Number(url.port || 443),
					servername: isIP(hostname) ? undefined : hostname,
					rejectUnauthorized: true,
					checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(hostname, certificate),
				});
				const connectedSocket = socket;
				const fail = () => {
					connectedSocket.destroy();
					callback(new Error('Client metadata TLS connection failed'), connectedSocket);
				};
				connectedSocket.once('error', fail);
				connectedSocket.once('secureConnect', () => {
					try {
						if (expired || !connectedSocket.authorized || !connectedSocket.remoteAddress
							|| publicAddress(connectedSocket.remoteAddress) !== normalized[0]) {
							throw new Error('Invalid client metadata peer');
						}
						connectedSocket.removeListener('error', fail);
						callback(null, connectedSocket);
					} catch {
						fail();
					}
				});
				return undefined;
			};
			return await new Promise<Response>((resolve, reject) => {
				request = dependencies.request(url, {
					agent,
					method: 'GET',
					headers: { accept: 'application/json, text/html', 'accept-encoding': 'identity' },
				}, response => {
					const mediaType = response.headers['content-type']?.split(';')[0].trim().toLowerCase();
					if (response.statusCode !== 200 || !['application/json', 'text/html'].includes(mediaType ?? '')
						|| (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')
						|| Number(response.headers['content-length']) > MAX_BYTES) {
						response.destroy();
						reject(new Error('Invalid client metadata response'));
						return;
					}
					const chunks: Buffer[] = [];
					let bytes = 0;
					response.on('data', (chunk: Buffer) => {
						bytes += chunk.length;
						if (bytes > MAX_BYTES) {
							response.destroy();
							reject(new Error('Client metadata response too large'));
						} else {
							chunks.push(chunk);
						}
					});
					response.once('error', () => reject(new Error('Client metadata response failed')));
					response.once('aborted', () => reject(new Error('Client metadata response interrupted')));
					response.once('end', () => {
						const headers: Record<string, string> = {};
						for (const [key, value] of Object.entries(response.headers)) {
							if (typeof value === 'string') headers[key] = value;
						}
						// node-fetch preserves this URL internally, but omits it from ResponseInit's public type.
						const init: ResponseInit & { url: string } = { status: 200, headers, url: id };
						resolve(new Response(Buffer.concat(chunks), init));
					});
				});
				request.once('error', () => reject(new Error('Client metadata request failed')));
				request.end();
			});
		};
		try {
			return await Promise.race([operation(), deadline]);
		} finally {
			if (timer) clearTimeout(timer);
			request?.destroy();
			socket?.destroy();
			agent.destroy();
		}
	};
}

export const fetchOAuthClientMetadata = createClientMetadataFetcher();
