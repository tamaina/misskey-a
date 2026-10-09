/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import Fastify from 'fastify';
import { APIClient, isAPIError } from '../../../../misskey-js/built/api.js';
import { registerAuthSessionHttp } from '../../backend/session.http.js';
import { FastifyReplyError } from '../../../runtime/backend/http/fastify-reply-error.js';
import { implement } from '@orpc/server';
import { authSessionsContract, type AuthSessionInputs, type AuthSessionOutputs } from '../../backend/api.definition.js';
import type { AuthSessionContext, AuthSessionRequest, AuthSessionEffects } from '../../backend/session.effects.js';
import { sessionErrors } from '../../backend/session.middleware.js';
type AuthSessionOperations = { [Name in keyof AuthSessionInputs]: (input: AuthSessionInputs[Name], request: AuthSessionRequest, effects: AuthSessionEffects) => Promise<AuthSessionOutputs[Name]> };

async function fixture() {
	const operations = mockDeep<AuthSessionOperations>();
	const native = implement(authSessionsContract).$context<AuthSessionContext>().use(sessionErrors());
	const app = Fastify();
	await app.register(async api => registerAuthSessionHttp(api, {
authSessions: native.router({
			signup: native.signup.handler(({ input, context }) => operations.signup(input, context.request, context.effects)),
			signupPending: native.signupPending.handler(({ input, context }) => operations.signupPending(input, context.request, context.effects)),
			signinFlow: native.signinFlow.handler(({ input, context }) => operations.signinFlow(input, context.request, context.effects)),
			signinWithPasskey: native.signinWithPasskey.handler(({ input, context }) => operations.signinWithPasskey(input, context.request, context.effects)),
		})
}), { prefix: '/api' });
	return { operations, app };
}

test('native session HTTP preserves id-only failures, rate-limit payloads and CORS effects', async () => {
	const h = await fixture();
	try {
		h.operations.signinFlow.mockImplementation(async (_input, request, effects) => {
			expect(request.ip).toBe('127.0.0.1');
			effects.header('Access-Control-Allow-Origin', 'https://example.com');
			effects.header('Access-Control-Allow-Credentials', 'true');
			effects.code(403);
			return { error: { id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c' } };
		});
		const denied = await h.app.inject({ method: 'POST', url: '/api/signin-flow', payload: { username: 'fixture', password: 'wrong', credential: {} } });
		expect(denied.statusCode).toBe(403);
		expect(denied.json()).toEqual({ error: { id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c' } });
		expect(denied.headers['access-control-allow-origin']).toBe('https://example.com');
		expect(denied.headers['access-control-allow-credentials']).toBe('true');
		h.operations.signinWithPasskey.mockImplementation(async (_input, _request, effects) => {
			effects.code(429);
			return { error: { id: '22d05606-fbcf-421a-a2db-b32610dcfd1b', code: 'TOO_MANY_AUTHENTICATION_FAILURES', message: 'Too many failed attempts to sign in. Try again later.' } };
		});
		const limited = await h.app.inject({ method: 'POST', url: '/api/signin-with-passkey', payload: {} });
		expect(limited.statusCode).toBe(429);
		expect(limited.json().error.code).toBe('TOO_MANY_AUTHENTICATION_FAILURES');
	} finally { await h.app.close(); }
});

test('native session HTTP preserves bare 400/204 and the separate Fastify thrown-error envelope', async () => {
	const h = await fixture();
	try {
		h.operations.signup.mockImplementation(async (_input, _request, effects) => { effects.code(204); });
		const pending = await h.app.inject({ method: 'POST', url: '/api/signup', payload: { username: 'fixture', password: 'password' } });
		expect(pending.statusCode).toBe(204);
		expect(pending.body).toBe('');
		h.operations.signinFlow.mockImplementation(async (_input, _request, effects) => { effects.code(400); });
		const malformed = await h.app.inject({ method: 'POST', url: '/api/signin-flow', payload: { username: 5 } });
		expect(malformed.statusCode).toBe(400);
		expect(malformed.body).toBe('');
		h.operations.signupPending.mockRejectedValue(new FastifyReplyError(400, 'EXPIRED'));
		const expired = await h.app.inject({ method: 'POST', url: '/api/signup-pending', payload: { code: 'expired' } });
		expect(expired.statusCode).toBe(400);
		expect(expired.json()).toEqual({ statusCode: 400, error: 'Bad Request', message: 'EXPIRED' });
		const method = await h.app.inject({ method: 'GET', url: '/api/signin-flow' });
		expect(method.statusCode).toBe(404);
	} finally { await h.app.close(); }
});

test('native session HTTP validates finite output before applying an application HTTP status', async () => {
	const h = await fixture();
	try {
		h.operations.signinFlow.mockImplementation(async (_input, _request, effects) => {
			effects.code(200);
			return { finished: true, id: 'user123', i: 'native', future: true };
		});
		const invalid = await h.app.inject({ method: 'POST', url: '/api/signin-flow', payload: { username: 'fixture' } });
		expect(invalid.statusCode).toBe(500);
		expect(invalid.json()).toMatchObject({ statusCode: 500, error: 'Internal Server Error' });
	} finally { await h.app.close(); }
});

async function rejection(promise: Promise<unknown>): Promise<Record<PropertyKey, unknown>> {
	const reason = await promise.then(() => { throw new Error('Expected the client request to fail'); }, (error: unknown) => error);
	if (reason === null || typeof reason !== 'object' || Array.isArray(reason)) throw new Error('Expected an object rejection');
	return { ...reason };
}

test('built SDK facade and direct oRPC round-trip successful sessions and distinguish 204 null from undefined', async () => {
	const h = await fixture();
	try {
		const origin = await h.app.listen({ host: '127.0.0.1', port: 0 });
		const client = new APIClient({ origin });
		const finished: { finished: true; id: string; i: string } = { finished: true, id: 'user123', i: 'session-token' };
		h.operations.signinFlow.mockResolvedValue(finished);
		expect(await client.request('signin-flow', { username: 'fixture', password: 'password' })).toEqual(finished);
		expect(await client.orpc.authSessions.signinFlow({ username: 'fixture', password: 'password' })).toEqual(finished);
		h.operations.signup.mockImplementation(async (_input, _request, effects) => { effects.code(204); });
		expect(await client.request('signup', { username: 'fixture', password: 'password' })).toBeNull();
		expect(await client.orpc.authSessions.signup({ username: 'fixture', password: 'password' })).toBeUndefined();
	} finally { await h.app.close(); }
});

test('built SDK preserves session id-only403, rate429 and Fastify400 rejection compatibility over a socket', async () => {
	const h = await fixture();
	try {
		const origin = await h.app.listen({ host: '127.0.0.1', port: 0 });
		const client = new APIClient({ origin });
		const deniedId = '932c904e-9460-45b7-9ce6-7ed33be7eb2c';
		h.operations.signinFlow.mockImplementation(async (_input, _request, effects) => {
			effects.code(403);
			return { error: { id: deniedId } };
		});
		const denied = await rejection(client.request('signin-flow', { username: 'fixture', password: 'wrong' }));
		expect(isAPIError(denied)).toBe(true);
		expect(denied.id).toBe(deniedId);
		expect(Object.keys(denied)).toEqual(['id']);
		expect(await rejection(client.orpc.authSessions.signinFlow({ username: 'fixture', password: 'wrong' })))
			.toMatchObject({ status: 403, data: { sessionError: { id: deniedId } } });

		h.operations.signinWithPasskey.mockImplementation(async (_input, _request, effects) => {
			effects.code(429);
			return { error: { id: '22d05606-fbcf-421a-a2db-b32610dcfd1b', code: 'TOO_MANY_AUTHENTICATION_FAILURES', message: 'Too many failed attempts to sign in. Try again later.' } };
		});
		const limited = await rejection(client.request('signin-with-passkey', {}));
		expect(isAPIError(limited)).toBe(true);
		expect(limited).toMatchObject({ id: '22d05606-fbcf-421a-a2db-b32610dcfd1b', code: 'TOO_MANY_AUTHENTICATION_FAILURES' });
		expect(await rejection(client.orpc.authSessions.signinWithPasskey({})))
			.toMatchObject({ status: 429, code: 'TOO_MANY_AUTHENTICATION_FAILURES' });

		h.operations.signupPending.mockRejectedValue(new FastifyReplyError(400, 'EXPIRED'));
		const expired = await rejection(client.request('signup-pending', { code: 'expired' }));
		expect(isAPIError(expired)).toBe(true);
		expect(Object.fromEntries(Object.entries(expired))).toEqual(Object.fromEntries(Array.from('Bad Request', (character, index) => [String(index), character])));
		expect(await rejection(client.orpc.authSessions.signupPending({ code: 'expired' })))
			.toMatchObject({ status: 400, code: 'SESSION_HTTP_ERROR', data: { statusCode: 400, error: 'Bad Request', message: 'EXPIRED' } });
	} finally { await h.app.close(); }
});
