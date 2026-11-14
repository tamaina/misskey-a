#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, createHmac } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { pathToFileURL } from 'node:url';

export const EX_OK = 0;
export const EX_NOUSER = 67;
export const EX_UNAVAILABLE = 69;
export const EX_TEMPFAIL = 75;
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 16 * 1024;

export function parseArguments(args) {
	const values = {};
	for (let index = 0; index < args.length; index += 2) {
		const name = args[index];
		if (!['--delivery-id', '--mail-from', '--recipient'].includes(name) || Object.hasOwn(values, name) || typeof args[index + 1] !== 'string') throw new Error('Invalid invocation');
		values[name] = args[index + 1];
	}
	const deliveryId = values['--delivery-id'];
	const mailFrom = values['--mail-from'];
	const recipient = values['--recipient'];
	if (typeof deliveryId !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/u.test(deliveryId) || typeof mailFrom !== 'string' || typeof recipient !== 'string' || !recipient) throw new Error('Invalid envelope');
	for (const address of [mailFrom, recipient]) {
		// SMTP envelope only; never parse display headers or accept header injection.
		// eslint-disable-next-line no-control-regex
		if (address.length > 254 || /[\x00-\x1f\x7f]/u.test(address)) throw new Error('Invalid envelope');
	}
	return { deliveryId, mailFrom, recipient };
}

export function resolveConfiguration(env) {
	const secret = env.MISSKEY_MAIL_INGRESS_SECRET ?? '';
	const token = env.MISSKEY_MAIL_INGRESS_TOKEN ?? '';
	if (Buffer.byteLength(secret) < 32 || Buffer.byteLength(secret) > 4096 || !/^[!-~]{32,4096}$/u.test(token) || secret === token) throw new Error('Invalid credentials');
	const endpoint = new URL(env.MISSKEY_MAIL_INGRESS_URL ?? 'http://127.0.0.1:8025/v1/deliver');
	// No DNS rebinding, public HTTP, URL credentials, redirect following or implicit proxy.
	if (!['http:', 'https:'].includes(endpoint.protocol) || !['127.0.0.1', '[::1]'].includes(endpoint.hostname) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/v1/deliver') throw new Error('Ingress must be a private loopback endpoint');
	const maxBytes = Number(env.MISSKEY_MAIL_MAX_BYTES ?? MAX_BYTES);
	const timeoutMs = Number(env.MISSKEY_MAIL_TIMEOUT_MS ?? 30_000);
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new Error('Invalid bounds');
	return { secret, token, endpoint, maxBytes, timeoutMs };
}

/** Mirrors mailDeliverySigningPayload v1. The MTA owns identity; this script never invents one. */
export function signDelivery(raw, envelope, secret) {
	const payload = JSON.stringify(['misskey-mail-v1', envelope.deliveryId, envelope.timestamp, envelope.mailFrom, envelope.recipients, createHash('sha256').update(raw).digest('hex')]);
	return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Exactly one attempt. A lost response is temporary, even if the server may have committed. */
export async function deliverMail(raw, metadata, config) {
	if (!Buffer.isBuffer(raw) || !raw.length || raw.length > config.maxBytes) return EX_UNAVAILABLE;
	const envelope = { deliveryId: metadata.deliveryId, timestamp: Math.floor(Date.now() / 1000), mailFrom: metadata.mailFrom, recipients: [metadata.recipient] };
	return new Promise(resolve => {
		let complete = false;
		let request;
		const finish = result => {
			if (complete) return;
			complete = true;
			clearTimeout(deadline);
			request?.destroy();
			resolve(result);
		};
		const deadline = setTimeout(() => finish(EX_TEMPFAIL), config.timeoutMs);
		try {
			request = (config.endpoint.protocol === 'https:' ? httpsRequest : httpRequest)(config.endpoint, {
				method: 'POST', agent: false, rejectUnauthorized: true, minVersion: 'TLSv1.2',
				headers: {
					'authorization': `Bearer ${config.token}`,
					'content-type': 'message/rfc822',
					'content-length': String(raw.length),
					'x-mail-envelope': Buffer.from(JSON.stringify(envelope)).toString('base64url'),
					'x-mail-signature': signDelivery(raw, envelope, config.secret),
				},
			}, response => {
				if (response.statusCode !== 200) {
					finish(response.statusCode === 413 ? EX_UNAVAILABLE : EX_TEMPFAIL);
					return;
				}
				const chunks = [];
				let size = 0;
				response.on('data', chunk => {
					size += chunk.length;
					if (size > MAX_RESPONSE_BYTES) finish(EX_TEMPFAIL);
					else chunks.push(chunk);
				});
				response.on('error', () => finish(EX_TEMPFAIL));
				response.on('aborted', () => finish(EX_TEMPFAIL));
				response.on('end', () => {
					try {
						const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
						if (!Array.isArray(result?.results) || result.results.length !== 1 || result.results[0]?.recipient !== metadata.recipient) { finish(EX_TEMPFAIL); return; }
						const code = result.results[0].code;
						finish(code === 250 ? EX_OK : code === 550 ? EX_NOUSER : EX_TEMPFAIL);
					} catch { finish(EX_TEMPFAIL); }
				});
			});
			request.on('error', () => finish(EX_TEMPFAIL));
			request.end(raw);
		} catch { finish(EX_TEMPFAIL); }
	});
}

async function readRaw(input, config) {
	const chunks = [];
	let size = 0;
	const deadline = setTimeout(() => input.destroy(new Error('Input timeout')), config.timeoutMs);
	try {
		for await (const chunk of input) {
			if (!(chunk instanceof Uint8Array)) throw new Error('Invalid input');
			size += chunk.byteLength;
			if (size > config.maxBytes) return null;
			chunks.push(Buffer.from(chunk));
		}
		return size ? Buffer.concat(chunks, size) : null;
	} finally { clearTimeout(deadline); }
}

export async function main(args = process.argv.slice(2), env = process.env, input = process.stdin) {
	try {
		const metadata = parseArguments(args);
		const config = resolveConfiguration(env);
		const raw = await readRaw(input, config);
		return raw ? await deliverMail(raw, metadata, config) : EX_UNAVAILABLE;
	} catch {
		// Configuration/invocation faults must defer, not bounce a potentially valid delivery.
		return EX_TEMPFAIL;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const code = await main();
	// Constant diagnostics only: never output raw, envelope, credentials or server response.
	if (code !== EX_OK) process.stderr.write(code === EX_TEMPFAIL ? 'Mail handoff deferred\n' : 'Mail handoff refused\n');
	process.exitCode = code;
}
