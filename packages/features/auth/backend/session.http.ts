/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { OpenAPIHandler } from '@orpc/openapi/fastify';
import type { StandardHandlerOptions } from '@orpc/server/standard';
import { STATUS_CODES } from 'node:http';
import * as v from 'valibot';
import type { FastifyInstance } from 'fastify';
import { createAuthSessionRouter, type AuthSessionContext } from './session.router.js';
import { requestRoutes } from '../../api/shared/api-routing.js';
import { sessionContract } from './session.contract.js';
import { fastifyFailureSchema } from './session-errors.schema.js';

/** Apply the applications' original HTTP statuses after native output validation. */
function sessionStatusInterceptor(): NonNullable<StandardHandlerOptions<AuthSessionContext>['interceptors']>[number] {
	return async ({ next, context }) => {
		const result = await next();
		if (!result.matched || result.response.status < 200 || result.response.status >= 300 || context.response.status === undefined) return result;
		return { ...result, response: { ...result.response, status: context.response.status } };
	};
}

/** The standalone routes retain the standard Fastify envelope, independent of canonical API errors. */
export function registerAuthSessionHttp(fastify: FastifyInstance, router: ReturnType<typeof createAuthSessionRouter>) {
	const handler = new OpenAPIHandler(router, {
		interceptors: [sessionStatusInterceptor()],
		customErrorResponseBodyEncoder: error => {
			const data = v.safeParse(fastifyFailureSchema, error.data);
			if (data.success) return data.output;
			return { statusCode: error.status, error: STATUS_CODES[error.status] ?? 'Error', message: error.message };
		},
	});
	for (const route of requestRoutes(sessionContract)) {
		fastify.post(route.httpPath, async (request, reply) => {
			const context: AuthSessionContext = {
				request: { ip: request.ip, headers: request.headers }, response: {},
				effects: {
					code: status => { context.response.status = status; },
					header: (name, value) => { reply.header(name, value); },
				},
			};
			await handler.handle(request, reply, { prefix: '/api', context });
			return reply;
		});
	}
}
