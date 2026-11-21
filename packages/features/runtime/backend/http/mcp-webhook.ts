/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lookup } from 'node:dns/promises';
import { Agent } from 'node:https';
import ipaddr from 'ipaddr.js';
import fetch from 'node-fetch';

export function callbackUrl(value: string): URL {
	let url: URL;
	try { url = new URL(value); } catch { throw new Error('Invalid callback'); }
	if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')) throw new Error('Invalid callback');
	return url;
}

export function isPublicAddress(address: string): boolean {
	if (!ipaddr.isValid(address)) return false;
	const parsed = ipaddr.process(address);
	return parsed.range() === 'unicast';
}

/** Pin a freshly validated DNS result; never use instance private-network exceptions or proxies. */
export async function sendPublicWebhook(value: string, body: string, headers: Record<string, string>, options: {
	localAddress?: string; signal?: AbortSignal; beforeSend?: () => Promise<void>;
} = {}) {
	const url = callbackUrl(value);
	const signal = AbortSignal.any([AbortSignal.timeout(10000), ...(options.signal ? [options.signal] : [])]);
	const hostname = url.hostname.replace(/^\[|\]$/g, '');
	const addresses = await Promise.race([
		lookup(hostname, { all: true, verbatim: true }),
		new Promise<never>((_resolve, reject) => {
			if (signal.aborted) reject(new Error('Callback timeout'));
			else signal.addEventListener('abort', () => reject(new Error('Callback timeout')), { once: true });
		}),
	]);
	if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('Callback address blocked');
	const destination = addresses[0];
	const agent = new Agent({ keepAlive: false, localAddress: options.localAddress,
		lookup: (_host, opts, done) => {
			if (opts.all) done(null, [destination]);
			else done(null, destination.address, destination.family);
		},
	});
	try {
		await options.beforeSend?.();
		signal.throwIfAborted();
		const response = await fetch(url, { method: 'POST', body, headers, agent, redirect: 'manual', signal, size: 4096 });
		// Status is the receipt acknowledgement; a bad/oversized response body must not
		// turn a terminal 410/413 into a retry. Verification still requires a valid echo.
		return { status: response.status, ok: response.ok, text: await response.text().catch(() => '') };
	} finally { agent.destroy(); }
}
