/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import dns from 'node:dns/promises';
import https from 'node:https';
import tls from 'node:tls';
import { isIP } from 'node:net';
import { publicAddress } from './oauth/ClientMetadataFetcher.js';
import type { ClientMetadataNetwork } from './oauth/ClientMetadataFetcher.js';
import type { ClientRequest } from 'node:http';

const MAX_BYTES = 64 * 1024;
const MAX_FORM_BYTES = 16 * 1024;
const network: ClientMetadataNetwork = {
	lookup: hostname => dns.lookup(hostname, { all: true, verbatim: true }),
	connect: tls.connect,
	request: https.request,
};

export function oidcHttpsUrl(value: string): URL {
	if (typeof value !== 'string' || value.includes('#')) throw new Error('Invalid OIDC HTTPS URL');
	const url = new URL(value);
	if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid OIDC HTTPS URL');
	return url;
}

type RequestData = { method: 'GET' } | { method: 'POST'; form: string; authorization: string };

/** The caller supplies ONE monotonic operation deadline shared across token/JWKS.
 * Only after public DNS and authenticated pinned TLS may HTTP see credentials. */
export function createOidcPinnedJsonRequester(dependencies: ClientMetadataNetwork = network) {
	return async (endpoint: string, data: RequestData, deadlineAt: number): Promise<unknown> => {
		let socket: tls.TLSSocket | undefined;
		let request: ClientRequest | undefined;
		let agent: https.Agent | undefined;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let expired = false;
		const deadlineExceeded = () => expired || performance.now() >= deadlineAt;
		try {
			const url = oidcHttpsUrl(endpoint);
			const method = data.method;
			const form = data.method === 'POST' ? data.form : undefined;
			const authorization = data.method === 'POST' ? data.authorization : undefined;
			if (!['GET', 'POST'].includes(method)) throw new Error('Invalid request');
			if (method === 'POST' && (typeof form !== 'string' || Buffer.byteLength(form) > MAX_FORM_BYTES ||
				typeof authorization !== 'string' || authorization.length > 8192 || !/^Basic [A-Za-z0-9+/]+=*$/.test(authorization))) throw new Error('Invalid request');
			const remaining = deadlineAt - performance.now();
			if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 5000) throw new Error('Invalid deadline');
			const deadline = new Promise<never>((_resolve, reject) => {
				timer = setTimeout(() => {
					expired = true;
					request?.destroy();
					socket?.destroy();
					reject(new Error('Expired request'));
				}, remaining);
			});
			const operation = async () => {
				const hostname = url.hostname.replace(/^\[|\]$/g, '');
				const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }]
					: await dependencies.lookup(hostname);
				if (expired || !addresses.length) throw new Error('Invalid DNS');
				const normalized = addresses.map(answer => publicAddress(answer.address));
				const target = addresses[0];
				if (target.family !== 4 && target.family !== 6) throw new Error('Invalid DNS family');
				await new Promise<void>((resolve, reject) => {
					socket = dependencies.connect({
						host: target.address, port: Number(url.port || 443),
						servername: isIP(hostname) ? undefined : hostname, rejectUnauthorized: true,
						checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(hostname, certificate),
					});
					const ownedSocket = socket;
					ownedSocket.once('error', () => reject(new Error('TLS failed')));
					ownedSocket.once('secureConnect', () => {
						try {
							if (expired || ownedSocket.destroyed || !ownedSocket.authorized || !ownedSocket.remoteAddress ||
								publicAddress(ownedSocket.remoteAddress) !== normalized[0]) throw new Error('Invalid TLS peer');
							resolve();
						} catch { reject(new Error('TLS failed')); }
					});
				});
				if (deadlineExceeded() || !socket || socket.destroyed) throw new Error('Expired TLS');
				const verifiedSocket = socket;
				agent = new https.Agent({ keepAlive: false, maxSockets: 1 });
				agent.createConnection = (_options, callback) => {
					if (!callback) throw new Error('Connection callback required');
					if (expired || verifiedSocket.destroyed) callback(new Error('Expired connection'), verifiedSocket);
					else callback(null, verifiedSocket);
					return undefined;
				};
				return await new Promise<unknown>((resolve, reject) => {
					request = dependencies.request(url, {
						agent, method,
						headers: {
							accept: 'application/json', 'accept-encoding': 'identity',
							...(method === 'POST' ? { authorization, 'content-type': 'application/x-www-form-urlencoded', 'content-length': Buffer.byteLength(form ?? '') } : {}),
						},
					}, response => {
						const media = response.headers['content-type']?.split(';')[0].trim().toLowerCase();
						if (response.statusCode !== 200 || media !== 'application/json' ||
							(response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') ||
							Number(response.headers['content-length']) > MAX_BYTES) {
							response.destroy(); reject(new Error('Invalid response')); return;
						}
						const chunks: Buffer[] = [];
						let bytes = 0;
						response.on('data', (chunk: Buffer) => {
							bytes += chunk.length;
							if (expired || bytes > MAX_BYTES) { response.destroy(); reject(new Error('Invalid response')); } else chunks.push(chunk);
						});
						response.once('error', () => reject(new Error('Response failed')));
						response.once('aborted', () => reject(new Error('Response failed')));
						response.once('end', () => {
							try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown); } catch { reject(new Error('Invalid JSON')); }
						});
					});
					request.once('error', () => reject(new Error('Request failed')));
					request.end(form);
				});
			};
			const result = await Promise.race([operation(), deadline]);
			if (performance.now() >= deadlineAt) throw new Error('Expired response');
			return result;
		} catch {
			// Never retain the original error/cause, URL, form, header, or provider body.
			throw new Error('OIDC pinned request failed');
		} finally {
			if (timer) clearTimeout(timer);
			request?.destroy(); socket?.destroy(); agent?.destroy();
		}
	};
}
