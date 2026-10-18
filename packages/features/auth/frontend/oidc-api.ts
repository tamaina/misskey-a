/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type * as Misskey from 'misskey-js';
import { apiUrl } from '@features/boot/frontend/shared/config.js';
import { $i } from './i.js';

type Endpoint = Extract<keyof Misskey.Endpoints, `oidc/${string}` | `i/oidc/${string}` | `admin/oidc/${string}`>;

/** Only these browser-bound APIs carry cookies; the general token API stays credential-omitting. */
export async function oidcApi<E extends Endpoint>(endpoint: E, data: Misskey.Endpoints[E]['req'], signal?: AbortSignal): Promise<Misskey.Endpoints[E]['res']> {
	if (!/^(?:oidc\/|i\/oidc\/|admin\/oidc\/)/.test(endpoint) || new URL(apiUrl, window.location.href).origin !== window.location.origin) throw new Error('Same-origin OIDC API required');
	const response = await window.fetch(`${apiUrl}/${endpoint}`, {
		method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...data, ...($i ? { i: $i.token } : {}) }), ...(signal ? { signal } : {}),
	});
	const body = response.status === 204 ? null : await response.json();
	if (response.status !== 200 && response.status !== 204) throw body?.error ?? new Error('OIDC request failed');
	return body;
}
