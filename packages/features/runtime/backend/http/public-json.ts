/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lookup } from 'node:dns/promises';
import { Agent } from 'node:https';
import fetch from 'node-fetch';
import { isPublicAddress } from './mcp-webhook.js';

/** Public HTTPS only: validate every DNS answer, pin one, and retain TLS hostname checks. */
export async function postPublicJson(value: string, body: string, options: { userAgent: string; localAddress?: string }): Promise<unknown> {
	const url = new URL(value);
	if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Invalid public JSON URL');
	const signal = AbortSignal.timeout(5000);
	let cancelDns: () => void = () => {};
	try {
		const addresses = await Promise.race([
			lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true, verbatim: true }),
			new Promise<never>((_resolve, reject) => {
				cancelDns = () => reject(new Error('Public JSON DNS timeout'));
				signal.addEventListener('abort', cancelDns, { once: true });
			}),
		]);
		if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('Public JSON address blocked');
		const destination = addresses[0];
		const agent = new Agent({
			keepAlive: false, localAddress: options.localAddress,
			lookup: (_host, opts, done) => {
				if (opts.all) done(null, [destination]);
				else done(null, destination.address, destination.family);
			},
		});
		try {
			signal.throwIfAborted();
			const response = await fetch(url, {
				method: 'POST', body, agent, signal, redirect: 'error', size: 256 * 1024,
				headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': options.userAgent },
			});
			if (!response.ok) throw new Error('Public JSON HTTP error');
			return await response.json();
		} finally {
			agent.destroy();
		}
	} finally {
		signal.removeEventListener('abort', cancelDns);
	}
}
