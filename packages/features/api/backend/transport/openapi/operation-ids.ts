/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OpenAPI } from '@orpc/contract';

// Preserve four historical public spellings only at the external documentation boundary.
const publicPathSpellings = new Map([
	['/clear-browser-cache', 'clear_browser_cache'],
	['/signup-pending', 'signup_pending'],
	['/signin-flow', 'signin_flow'],
	['/signin-with-passkey', 'signin_with_passkey'],
]);

export function externalOperationName(path: string): string {
	return publicPathSpellings.get(path) ?? path.replace(/^\//, '').replaceAll('/', '___');
}

/** External identifiers depend on the HTTP method/path, never internal router keys. */
export function assignExternalOperationIds(spec: Pick<OpenAPI.Document, 'paths'>) {
	const identifiers = new Set<string>();
	for (const [path, item] of Object.entries(spec.paths ?? {})) {
		for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const) {
			const operation = item?.[method];
			if (!operation) continue;
			const identifier = `${method}___${externalOperationName(path)}`;
			if (identifiers.has(identifier)) throw new Error(`Duplicate external operation identifier: ${identifier}`);
			identifiers.add(identifier);
			operation.operationId = identifier;
		}
	}
}
