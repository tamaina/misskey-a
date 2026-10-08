/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isContractProcedure } from '@orpc/contract';

export interface RequestRoute { name: string; path: readonly string[]; httpPath: string }

/** Validate the compatibility aliases in a contract or its minified representation. */
export function requestRoutes(router: unknown): RequestRoute[] {
	const routes: RequestRoute[] = [];
	const names = new Set<string>();

	function visit(node: unknown, path: string[]) {
		if (isContractProcedure(node)) {
			const { meta, route } = node['~orpc'];
			const name: unknown = meta.requestName;
			if (name === undefined) return;
			if (typeof name !== 'string' || !name || route.method !== 'POST' || route.path !== `/${name}`) {
				throw new Error('Invalid APIClient alias method/path in contract');
			}
			if (names.has(name)) throw new Error(`Duplicate APIClient alias: ${name}`);
			names.add(name);
			routes.push({ name, path, httpPath: route.path });
		} else if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
			for (const [key, child] of Object.entries(node)) visit(child, [...path, key]);
		} else {
			throw new Error('Invalid contract routing node');
		}
	}

	visit(router, []);
	return routes;
}
