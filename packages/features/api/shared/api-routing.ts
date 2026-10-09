/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isContractProcedure } from '@orpc/contract';

export interface RequestRoute { name: string; path: readonly string[]; httpPath: string; allowGet: boolean; cacheSec?: number; multipart: boolean }

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
			const allowGet = meta.allowGet === true;
			const cacheSec = meta.cacheSec;
			if (cacheSec !== undefined && (typeof cacheSec !== 'number' || !Number.isFinite(cacheSec) || cacheSec < 0)) throw new Error('Invalid API cache metadata');
			routes.push({ name, path, httpPath: route.path, allowGet, multipart: meta.multipart === true,
																	...(typeof cacheSec === 'number' ? { cacheSec } : {}) });
		} else if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
			for (const [key, child] of Object.entries(node)) visit(child, [...path, key]);
		} else {
			throw new Error('Invalid contract routing node');
		}
	}

	visit(router, []);
	return routes;
}

/** Derive nullable logical responses for the legacy204 wire boundary from real output schemas. */
export async function nullableResponsePaths(router: unknown): Promise<string[][]> {
	const paths: string[][] = [];

	async function visit(node: unknown, path: string[]) {
		if (isContractProcedure(node)) {
			const schema = node['~orpc'].outputSchema;
			if (schema !== undefined) {
				const result = await schema['~standard'].validate(null);
				if (!result.issues) paths.push(path);
			}
		} else if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
			for (const [key, child] of Object.entries(node)) await visit(child, [...path, key]);
		} else {
			throw new Error('Invalid contract routing node');
		}
	}

	await visit(router, []);
	return paths;
}
