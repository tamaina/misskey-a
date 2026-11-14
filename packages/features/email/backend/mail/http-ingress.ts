/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { authenticateMailDelivery, readBoundedMailData, MailIngressError } from './ingress.js';
import { MailStoreError } from './store.js';
import type { MailStore } from './store.js';
import type { UserMailSettings } from './settings.js';
import type { MailDeliveryEnvelope } from './ingress.js';

/** Private MTA handoff, not SMTP/LMTP and never a public relay. */
export function createMailIngress(settings: UserMailSettings, store: MailStore) {
	let active = 0;
	let windowStart = Date.now();
	let requests = 0;
	const tokenHash = createHash('sha256').update(`Bearer ${settings.ingress.token}`).digest();
	const server = createServer({ maxHeaderSize: 48 * 1024, requestTimeout: 30_000, headersTimeout: 10_000 }, (request, response) => {
		response.setHeader('Connection', 'close');
		response.setHeader('Cache-Control', 'no-store');
		const end = (status: number, result: unknown) => {
			response.writeHead(status, { 'Content-Type': 'application/json' });
			response.end(JSON.stringify(result));
		};
		if (request.method !== 'POST' || request.url !== '/v1/deliver') { end(404, { error: 'NOT_FOUND' }); return; }
		// Verify before reading DATA or querying DB/S3. Never log headers/body/errors.
		const supplied = createHash('sha256').update(request.headers.authorization ?? '').digest();
		if (!timingSafeEqual(tokenHash, supplied)) { end(401, { error: 'UNAUTHENTICATED' }); return; }
		if (Date.now() - windowStart >= 60_000) { windowStart = Date.now(); requests = 0; }
		if (++requests > (settings.ingress.perMinute ?? 60) || active >= (settings.ingress.maxConcurrent ?? 2)) { end(503, { error: 'BUSY' }); return; }
		active++;
		const deadline = setTimeout(() => request.destroy(), 30_000);
		void (async () => {
			try {
				const metadata = request.headers['x-mail-envelope'];
				const signature = request.headers['x-mail-signature'];
				if (typeof metadata !== 'string' || metadata.length > 40_000 || typeof signature !== 'string') throw new MailIngressError('UNAUTHENTICATED');
				let envelope: MailDeliveryEnvelope;
				try { envelope = JSON.parse(Buffer.from(metadata, 'base64url').toString('utf8')); } catch { throw new MailIngressError('UNAUTHENTICATED'); }
				if (!envelope || typeof envelope !== 'object') throw new MailIngressError('UNAUTHENTICATED');
				const raw = await readBoundedMailData(request.iterator({ destroyOnReturn: false }), settings.maxBytes);
				authenticateMailDelivery(raw, envelope, signature, settings.ingress.secret);
				const staged = await store.stage(raw);
				const results = [];
				for (const recipient of envelope.recipients) {
					try {
						await store.accept(staged.id, envelope.deliveryId, recipient, envelope.mailFrom);
						results.push({ recipient, code: 250 });
					} catch (error) {
						const permanent = error instanceof MailStoreError && ['RECIPIENT_UNAVAILABLE', 'RETRY_CONFLICT'].includes(error.code) || error instanceof MailIngressError;
						results.push({ recipient, code: permanent ? 550 : 451 });
					}
				}
				end(200, { results });
			} catch (error) {
				const status = error instanceof MailIngressError ? error.code === 'TOO_LARGE' ? 413 : 400 : 503;
				if (!response.destroyed) end(status, { error: status === 503 ? 'TEMPORARY_FAILURE' : 'INVALID_DELIVERY' });
			} finally { clearTimeout(deadline); active--; }
		})();
	});
	server.maxConnections = 16;
	server.keepAliveTimeout = 1000;
	return server;
}
