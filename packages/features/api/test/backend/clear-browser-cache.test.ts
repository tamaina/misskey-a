/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Fastify from 'fastify';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { createClearBrowserCacheProcedure, createClearBrowserCacheGetProcedure, clearSiteData } from '../../backend/endpoints/clear-browser-cache.js';
import { clearBrowserCacheContract } from '../../backend/endpoints/clear-browser-cache.contract.js';
import { registerPilotHttp } from '../../backend/transport/pilot-http.js';
import type { ApiContext } from '../../backend/transport/context.js';
import { requestRoutes } from '../../shared/api-routing.js';

const router = { clearBrowserCache: createClearBrowserCacheProcedure(), clearBrowserCacheGet: createClearBrowserCacheGetProcedure() };

test('cache clearing uses native GET/POST procedures with the exact header and empty204 response', async () => {
	const context = mockDeep<ApiContext>();
	const handler = new OpenAPIHandler(router);
	const app = Fastify();
	await app.register(async api => {
		registerPilotHttp(api, handler, {
			maxFileSize: 1024,
			context: (_request, reply) => ({ ...context, response: { header: (name, value) => { reply.header(name, value); } } }),
			runSpan: (_name, run) => run(),
		});
	}, { prefix: '/api' });
	try {
		for (const method of ['GET', 'POST'] as const) {
			const response = await app.inject({ method, url: '/api/clear-browser-cache' });
			expect(response.statusCode).toBe(204);
			expect(response.body).toBe('');
			expect(response.headers['clear-site-data']).toBe(clearSiteData);
		}
		for (const payload of [null, [], { i: 42 }, 'ignored input']) {
			const response = await app.inject({ method: 'POST', url: '/api/clear-browser-cache', headers: { 'content-type': 'application/json' }, payload: JSON.stringify(payload) });
			expect(response.statusCode).toBe(204);
			expect(response.headers['clear-site-data']).toBe(clearSiteData);
		}
		const text = await app.inject({ method: 'POST', url: '/api/clear-browser-cache', headers: { 'content-type': 'text/plain' }, payload: 'ignored input' });
		expect(text.statusCode).toBe(204);
		for (const method of ['PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'] as const) {
			const response = await app.inject({ method, url: '/api/clear-browser-cache' });
			expect(response.statusCode).toBe(405);
			expect(response.body).toBe('');
			expect(response.headers['clear-site-data']).toBeUndefined();
		}
		expect(context.services.authenticate).not.toHaveBeenCalled();
	} finally { await app.close(); }
});

test('cache boundary method policy comes from its portable contract and stays outside canonical introspection', () => {
	const [route] = requestRoutes({ clearBrowserCache: clearBrowserCacheContract });
	expect(route.acceptedMethods).toEqual(['GET', 'POST']);
	expect(route.allowGet).toBe(true);
	expect(route.introspection).toBe(false);
});
