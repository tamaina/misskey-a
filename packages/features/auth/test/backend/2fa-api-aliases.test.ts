/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { restoreChannelFederationOpenapiBaseline } from '@features/channels/test/backend/openapi-baseline.js';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { call, implement } from '@orpc/server';
import { oc } from '@orpc/contract';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as v from 'valibot';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { commonErrors } from '@features/api/backend/transport/errors.schema.js';
import { genPilotOpenapiSpec } from '@features/api/backend/transport/openapi/pilot-spec.js';
import { registerPilotHttp } from '@features/api/backend/transport/pilot-http.js';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import { requestRoutes } from '@features/api/shared/api-routing.js';
import { clientContract } from '@features/index/backend/client.contract.js';
import type { InferContractRouterInputs } from '@orpc/contract';
import { aliasTwoFactorContract } from '../../backend/2fa-api-aliases.contract.js';
import { aliasTwoFactorProcedure, createAuthRouter } from '../../backend/api.implementation.js';
import { authContract } from '../../backend/api.definition.js';
import baseline from './fixtures/2fa-api-alias-baseline.json';
import { testContext } from './native-context.js';
import type { AuthRouterDependencies } from '../../backend/api.implementation.js';
import type { ApiServices } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const pairs = [
	['i/2fa/done', 'i/2fa/totp/done'],
	['i/2fa/register', 'i/2fa/totp/register'],
	['i/2fa/unregister', 'i/2fa/totp/remove'],
	['i/2fa/key-done', 'i/2fa/passkey/done'],
	['i/2fa/register-key', 'i/2fa/passkey/register'],
	['i/2fa/remove-key', 'i/2fa/passkey/remove'],
	['i/2fa/update-key', 'i/2fa/passkey/update'],
	['i/2fa/password-less', 'i/2fa/passkey/password-less'],
] as const;
const actor = mockDeep<MiLocalUser>({ id: 'synthetic-user', isSuspended: false, movedToUri: null });

function harness() {
	const deps = mockDeep<AuthRouterDependencies>();
	const services = mockDeep<ApiServices<MiLocalUser>>();
	services.authenticate.mockResolvedValue([actor, null]);
	services.limitActor.mockReturnValue(actor.id);
	services.rateLimitFactor.mockResolvedValue(1);
	services.limit.mockResolvedValue(null);
	return { deps, services, router: createAuthRouter(deps), context: { services, credential: 'synthetic', ip: '127.0.0.1', headers: {} } };
}

test.each(pairs)('%s and %s share schemas, handler and middleware without mutating legacy routing', (legacy, canonical) => {
	const h = harness();
	const oldContract = authContract[legacy]['~orpc'];
	const newContract = authContract[canonical]['~orpc'];
	const oldProcedure = h.router[legacy]['~orpc'];
	const newProcedure = h.router[canonical]['~orpc'];
	expect(oldContract.meta.requestName).toBe(legacy);
	expect(oldContract.route.path).toBe(`/${legacy}`);
	expect(newContract.meta).toEqual({ ...oldContract.meta, requestName: canonical, compatibilityAliasOf: legacy });
	expect(newContract.route).toEqual({ ...oldContract.route, path: `/${canonical}` });
	for (const field of ['inputSchema', 'outputSchema', 'errorMap'] as const) expect(newContract[field]).toBe(oldContract[field]);
	for (const field of ['inputSchema', 'outputSchema', 'middlewares', 'handler'] as const) expect(newProcedure[field]).toBe(oldProcedure[field]);
	// The native router normalizes each error map while preserving its contents.
	expect(newProcedure.errorMap).toEqual(oldProcedure.errorMap);
	expect(oldProcedure.meta.requestName).toBe(legacy);
	expect(oldProcedure.route.path).toBe(`/${legacy}`);
	expect(newProcedure.meta).toEqual(newContract.meta);
	expect(newProcedure.route).toEqual(newContract.route);
});

function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
	if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`;
	return JSON.stringify(value);
}

function schemaHash(value: unknown): string {
	return createHash('sha256').update(stableJson(JSON.parse(JSON.stringify(value)))).digest('hex');
}

test('actual portable generator preserves every legacy operation and public schema, with eight unique canonical IDs', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
	const routes = requestRoutes(clientContract);
	const originalJson = JSON.stringify(spec);
	const legacySpec = restoreChannelFederationOpenapiBaseline(spec);
	expect(JSON.stringify(spec)).toBe(originalJson);
	const invalid = structuredClone(spec);
	const channel = invalid.components?.schemas?.Channel;
	if (channel == null || typeof channel !== 'object') throw new Error('Missing documented Channel schema');
	Reflect.set(Reflect.get(channel, 'properties'), 'isFederated', { type: 'string' });
	expect(() => restoreChannelFederationOpenapiBaseline(invalid)).toThrow('federation flag differs');
	for (const [path, hash] of Object.entries(baseline.operationHashes)) expect(schemaHash(legacySpec.paths?.[path]), path).toBe(hash);
	for (const [name, hash] of Object.entries(baseline.schemaHashes)) expect(schemaHash(legacySpec.components?.schemas?.[name]), name).toBe(hash);
	expect(Object.keys(baseline.schemaHashes)).toHaveLength(1107);
	expect(Object.keys(spec.components?.schemas ?? {}).filter(name => !(name in baseline.schemaHashes))).toEqual(['OrpcDefinition1038']);
	expect(Object.keys(baseline.paths)).toHaveLength(444);
	for (const [path, operationId] of Object.entries(baseline.paths)) expect(spec.paths?.[path]?.post?.operationId).toBe(operationId);
	const generatedIds = Object.values(spec.paths ?? {}).map(path => path?.post?.operationId);
	expect(new Set(generatedIds).size).toBe(generatedIds.length);
	expect(Object.keys(spec.paths ?? {})).toHaveLength(routes.length);
	for (const [legacy, canonical] of pairs) {
		expect(routes.filter(route => route.name === legacy)).toHaveLength(1);
		expect(routes.filter(route => route.name === canonical)).toHaveLength(1);
		expect(spec.paths?.[`/${canonical}`]?.post?.operationId).toBe(`post___${canonical.replaceAll('/', '___')}`);
	}
	if (process.env.MISSKEY_TEST_EXPORT_2FA_API_JSON) writeFileSync(process.env.MISSKEY_TEST_EXPORT_2FA_API_JSON, JSON.stringify(spec));
});

test('both HTTP namespaces reject anonymous and scoped tokens before malformed input validation', async () => {
	const h = harness();
	const app = Fastify();
	const handler = new OpenAPIHandler(h.router, { customErrorResponseBodyEncoder: misskeyErrorBody });
	await app.register(async api => registerPilotHttp(api, handler, {
		maxFileSize: 1024, context: () => h.context, runSpan: (_name, run) => run(),
	}), { prefix: '/api' });
	try {
		for (const [principal, token] of [[null, null], [actor, { permission: ['write:account'] }]] as const) {
			h.services.authenticate.mockResolvedValue([principal, token]);
			for (const paths of pairs) for (const path of paths) {
				const response = await app.inject({ method: 'POST', url: `/api/${path}`, payload: { password: 7, token: [], name: false } });
				expect(response.statusCode).toBe(400);
				expect(response.json()).toMatchObject({ error: { code: 'ACCESS_DENIED' } });
			}
		}
		expect(h.deps['i/2fa/register-key'].userProfilesRepository.findOne).not.toHaveBeenCalled();
	} finally { await app.close(); }
});

test('native passkey registration aliases preserve password/MFA validation and producer arguments', async () => {
	const h = harness();
	const deps = h.deps['i/2fa/register-key'];
	const profile = mockDeep<NonNullable<Awaited<ReturnType<typeof deps.userProfilesRepository.findOne>>>>({ userId: actor.id, user: null, twoFactorEnabled: true, password: bcrypt.hashSync('synthetic-password', 4) });
	deps.userProfilesRepository.findOne.mockResolvedValue(profile);
	deps.webAuthnService.initiateRegistration.mockResolvedValue({ challenge: 'synthetic', rp: { id: 'synthetic.example', name: 'Synthetic' }, user: { id: 'AQID', name: 'synthetic', displayName: 'Synthetic' }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }] });
	type RegistrationInput = InferContractRouterInputs<typeof authContract>['i/2fa/register-key'];
	const register = [
		(input: RegistrationInput) => call(h.router['i/2fa/register-key'], input, { context: testContext(actor) }),
		(input: RegistrationInput) => call(h.router['i/2fa/passkey/register'], input, { context: testContext(actor) }),
	];
	for (const run of register) {
		await expect(run({ password: 'synthetic-password' })).rejects.toThrow('authentication failed');
		await expect(run({ password: 'wrong', token: '111111' })).rejects.toMatchObject({ code: 'INCORRECT_PASSWORD' });
		await expect(run({ password: 'synthetic-password', token: '222222' })).resolves.toMatchObject({ challenge: 'synthetic' });
	}
	expect(deps.userAuthService.twoFactorAuthenticate).toHaveBeenCalledTimes(4);
	expect(deps.webAuthnService.initiateRegistration).toHaveBeenCalledTimes(2);
	expect(deps.webAuthnService.initiateRegistration).toHaveBeenCalledWith(actor.id, actor.id, undefined);
});

test('cloning accepts the actual ImplementedProcedure factory result and retains its handler', async () => {
	const contract = oc.$meta({ requestName: 'synthetic-legacy' as const }).input(v.string()).output(v.string());
	const legacy = implement(contract).$context<{ suffix: string }>().handler(({ input, context }) => input + context.suffix);
	const canonical = aliasTwoFactorProcedure(legacy, 'synthetic-canonical');
	expect(canonical['~orpc'].handler).toBe(legacy['~orpc'].handler);
	expect(legacy['~orpc'].meta.requestName).toBe('synthetic-legacy');
	expect(canonical['~orpc'].meta.requestName).toBe('synthetic-canonical');
	await expect(call(canonical, 'synthetic-input', { context: { suffix: '-result' } })).resolves.toBe('synthetic-input-result');
});

test('cloning retains the captured legacy rate bucket and its error despite canonical routing metadata', async () => {
	const contract = oc.$meta({ requestName: 'i/2fa/synthetic-legacy', requireCredential: true, secure: true, limit: { duration: 1000, max: 1 } })
		.route({ method: 'POST', path: '/i/2fa/synthetic-legacy' }).errors(commonErrors).input(v.void()).output(v.void());
	const run = vi.fn();
	const legacy = createApiProcedure<MiLocalUser>()(contract).handler(() => { run(); });
	const canonicalContract = aliasTwoFactorContract(contract, 'i/2fa/totp/synthetic');
	const canonical = aliasTwoFactorProcedure(legacy, canonicalContract['~orpc'].meta.requestName);
	for (const field of ['inputSchema', 'outputSchema', 'errorMap', 'middlewares', 'handler'] as const) expect(canonical['~orpc'][field]).toBe(legacy['~orpc'][field]);
	const h = harness();
	await call(legacy, undefined, { context: h.context });
	h.services.limit.mockResolvedValue({ info: { synthetic: true } });
	await expect(call(canonical, undefined, { context: h.context })).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
	expect(h.services.limit).toHaveBeenNthCalledWith(1, { duration: 1000, max: 1, key: 'i/2fa/synthetic-legacy' }, actor.id, 1);
	expect(h.services.limit).toHaveBeenNthCalledWith(2, { duration: 1000, max: 1, key: 'i/2fa/synthetic-legacy' }, actor.id, 1);
	expect(run).toHaveBeenCalledOnce();
});
