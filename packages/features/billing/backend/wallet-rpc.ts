/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Readable } from 'node:stream';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';

export const WALLET_RPC_MAX_BYTES = 256 * 1024;
export const WALLET_RPC_TIMEOUT = 10000;

/** Native proxy/outgoingAddress/allowedPrivateNetworks policy owns every request.
 * Reject redirects rather than forwarding administrator RPC credentials elsewhere.
 */
export function createWalletRpcFetch(native: Pick<HttpRequestService, 'send'>): typeof globalThis.fetch {
	return async (input, init) => {
		let response: Awaited<ReturnType<HttpRequestService['send']>> | undefined;
		try {
			if (typeof input !== 'string' || init?.method !== 'POST' || typeof init.body !== 'string' || init.signal?.aborted) throw new Error('Invalid RPC request');
			response = await native.send(input, {
				method: 'POST', body: init.body, headers: Object.fromEntries(new Headers(init.headers)),
				timeout: WALLET_RPC_TIMEOUT, size: WALLET_RPC_MAX_BYTES,
				redirect: 'error', follow: 0, isLocalAddressAllowed: false,
			}, { throwErrorWhenResponseNotOk: false });
			if (response.status >= 300 && response.status < 400) throw new Error('RPC redirects are not supported');
			const body = await response.text(); // Native node-fetch enforces size while streaming.
			if (init.signal?.aborted || Buffer.byteLength(body) > WALLET_RPC_MAX_BYTES) throw new Error('RPC response rejected');
			return new Response(body, { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()) });
		} catch {
			if (response?.body instanceof Readable) response.body.destroy();
			// Native/viem driver details may contain the private URL or authorization headers.
			throw new Error('Wallet RPC request failed');
		}
	};
}
