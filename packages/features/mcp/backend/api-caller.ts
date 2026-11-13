/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { call, getRouter, isProcedure, unlazy } from '@orpc/server';
import { requestRoutes } from '@features/api/shared/api-routing.js';
import type { AnyRouter } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';

/** Registry/transport failure, separate from native API error semantics. */
export class McpSelectionError extends Error {
	constructor(public readonly code: 'TOOL_UNAVAILABLE' | 'SUBJECT_REQUIRED' | 'SUBJECT_MISMATCH') {
		super(code);
	}
}

export function createAllowedApiCaller(router: AnyRouter, contract: unknown, allowed: readonly string[]) {
	const routes = new Map(requestRoutes(contract).map(route => [route.name, route]));
	const allowlist = new Set(allowed);
	return async (name: string, input: unknown, context: ApiContext, signal?: AbortSignal): Promise<unknown> => {
		const route = routes.get(name);
		if (!allowlist.has(name) || !route || route.multipart || route.ignoreBody) throw new McpSelectionError('TOOL_UNAVAILABLE');
		signal?.throwIfAborted();
		const { default: procedure } = await unlazy(getRouter(router, route.path));
		if (!isProcedure(procedure)) throw new McpSelectionError('TOOL_UNAVAILABLE');
		return call(procedure, input, { context, path: route.path, signal });
	};
}
