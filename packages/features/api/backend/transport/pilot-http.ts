/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OpenAPIHandler } from '@orpc/openapi/fastify';
import { pilotContract } from '../../../index/backend/api.contract.js';
import { requestRoutes } from '../../shared/api-routing.js';
import { withStagedUpload, UploadRequestError } from './multipart.js';
import type { ApiActor, ApiContext, UploadResource } from './context.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const requests = requestRoutes(pilotContract);
const jsonBodyLimit = 1024 * 1024;
const bodylessMethods = new Set(['GET', 'HEAD', 'TRACE']);

export function bodyCredential(request: FastifyRequest): string | null | undefined {
	const body = request.method === 'GET' ? request.query : request.body;
	const value = request.headers.authorization?.startsWith('Bearer ')
		? request.headers.authorization.slice(7)
		: body !== null && typeof body === 'object' && 'i' in body ? body.i : undefined;
	if (value === null || value === undefined || typeof value === 'string') return value;
	throw new UploadRequestError(400, 'Invalid credential representation');
}

export function registerPilotHttp<Actor extends ApiActor, Context extends ApiContext<Actor> = ApiContext<Actor>>(
	fastify: FastifyInstance, handler: OpenAPIHandler<Context>,
	options: {
		maxFileSize: number;
		context(request: FastifyRequest, reply: FastifyReply, name: string, upload?: UploadResource): Context;
		runSpan<T>(name: string, run: () => T): T;
	},
) {
	const uploadCleanups = new WeakMap<FastifyRequest, () => Promise<void>>();
	for (const route of requests) fastify.all(route.httpPath, {
		bodyLimit: jsonBodyLimit,
		onRequest: async (request, reply) => {
			const reject = (status: number) => reply.header('Connection', 'close').code(status).send();
			if (request.method === 'GET' && !route.allowGet) return reject(405);
			// HEAD/TRACE bypass Fastify parsers: inspect the header before parser side effects.
			const mediaType = request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
			if (!route.multipart && mediaType !== undefined
				&& mediaType !== 'application/json' && !/^application\/[^/]+\+json$/.test(mediaType)) return reject(415);
			// Preserve bodyless semantics. Never normalize a framed bodyless request into
			// an unbounded reader; reject framing, including chunked/unknown-size bodies.
			if (bodylessMethods.has(request.method)
				&& (request.headers['transfer-encoding'] !== undefined || Number(request.headers['content-length'] ?? 0) > 0)) {
				return reject(Number(request.headers['content-length'] ?? 0) > jsonBodyLimit ? 413 : 400);
			}
		},
		onSend: async (request, _reply, payload) => {
			// Handler consumers and output validation have finished before onSend.
			await uploadCleanups.get(request)?.();
			uploadCleanups.delete(request);
			return payload;
		},
	}, async (request, reply) => {
		if (request.method === 'GET' && !route.allowGet) return reply.code(405).send();
		const run = async (upload?: UploadResource) => {
			const context = options.context(request, reply, route.name, upload);
			if (route.cacheSec !== undefined && !context.credential) reply.header('Cache-Control', `public, max-age=${route.cacheSec}`);
			// Legacy Fastify routes accept non-GET verbs with POST semantics. Keep that
			// boundary behavior without adding aliases to the public contract/router.
			const raw = new Proxy(request.raw, {
				get: (target, property, receiver) => property === 'method' && request.method !== 'GET'
					? 'POST' : Reflect.get(target, property, receiver),
			});
			const adapted = new Proxy(request, {
				get: (target, property, receiver) => {
					if (property === 'raw') return raw;
					// Parsed JSON, an empty body, or staged upload fields are the complete input.
					// Do not let the official adapter fall back to decoding an unchecked stream.
					if (property === 'body') return target.body === undefined ? {} : target.body;
					return Reflect.get(target, property, receiver);
				},
			});
			await options.runSpan('API: ' + route.name, () => handler.handle(adapted, reply, { prefix: '/api', context }));
		};
		try {
			if (route.multipart) await withStagedUpload(request, { maxFileSize: options.maxFileSize }, async (body, upload, cleanup) => {
				uploadCleanups.set(request, cleanup);
				request.body = body;
				await run(upload);
			});
			else await run();
		} catch (error) {
			if (error instanceof UploadRequestError) return reply.code(error.status).send();
			throw error;
		}
		return reply;
	});
}
