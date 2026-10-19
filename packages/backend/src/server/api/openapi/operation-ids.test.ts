/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import type { OpenAPI } from '@orpc/contract';
import { oc } from '@orpc/contract';
import { OpenAPIGenerator } from '@orpc/openapi';
import { experimental_ValibotToJsonSchemaConverter } from '@orpc/valibot';
import * as v from 'valibot';
import { assignExternalOperationIds } from '@features/api/backend/transport/openapi/operation-ids.js';
import { avatarDecorationsContract } from '@features/avatar-decorations/backend/api.definition.js';

test('external IDs use HTTP method/path for arbitrary router keys and leave other operation fields intact', async () => {
	const spec = await new OpenAPIGenerator({ schemaConverters: [new experimental_ValibotToJsonSchemaConverter()] }).generate({
		unrelated: {
			first: oc.route({ method: 'GET', path: '/shared/path' }).output(v.void()),
			second: oc.route({ method: 'POST', path: '/shared/path' }).output(v.void()),
			parameter: oc.route({ method: 'DELETE', path: '/files/{id}' }).input(v.object({ id: v.string() })).output(v.void()),
		},
	}, { info: { title: 'Test', version: 'test' } });
	const expected = structuredClone(spec);
	if (!expected.paths?.['/shared/path']?.get || !expected.paths['/shared/path'].post || !expected.paths['/files/{id}']?.delete) throw new Error('Missing generated test operations');
	expected.paths['/shared/path'].get.operationId = 'get___shared___path';
	expected.paths['/shared/path'].post.operationId = 'post___shared___path';
	expected.paths['/files/{id}'].delete.operationId = 'delete___files___{id}';
	assignExternalOperationIds(spec);
	expect(spec).toEqual(expected);
});

test('real external IDs preserve avatar, GET aliases and historical special-route spellings', async () => {
	for (const contract of Object.values(avatarDecorationsContract)) expect(contract['~orpc'].route).not.toHaveProperty('operationId');
	const { genPilotOpenapiSpec } = await import('@features/api/backend/transport/openapi/pilot-spec.js');
	const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
	expect(spec.paths?.['/admin/avatar-decorations/create']?.post?.operationId).toBe('post___admin___avatar-decorations___create');
	expect(spec.paths?.['/get-avatar-decorations']?.post?.operationId).toBe('post___get-avatar-decorations');
	expect(spec.paths?.['/available-endpoints']?.post?.operationId).toBe('post___available-endpoints');
	expect(spec.paths?.['/hashtags/trend']?.get?.operationId).toBe('get___hashtags___trend');
	expect(spec.paths?.['/hashtags/trend']?.post?.operationId).toBe('post___hashtags___trend');
	expect(spec.paths?.['/clear-browser-cache']?.get?.operationId).toBe('get___clear_browser_cache');
	expect(spec.paths?.['/clear-browser-cache']?.post?.operationId).toBe('post___clear_browser_cache');
	for (const path of ['signup-pending', 'signin-flow', 'signin-with-passkey']) {
		expect(spec.paths?.[`/${path}`]?.post?.operationId).toBe(`post___${path.replaceAll('-', '_')}`);
	}
	const identifiers = Object.values(spec.paths ?? {}).flatMap(item => (['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const).flatMap(method => {
		const operation = item?.[method];
		return operation ? [operation.operationId] : [];
	}));
	expect(spec.paths?.['/i/sessions']?.post?.operationId).toBe('post___i___sessions');
	expect(spec.paths?.['/i/sessions/revoke']?.post?.operationId).toBe('post___i___sessions___revoke');
	expect(spec.paths?.['/i/signout']?.post?.operationId).toBe('post___i___signout');
	expect(spec.paths?.['/i/change-password/passkey/start']?.post?.operationId).toBe('post___i___change-password___passkey___start');
	expect(spec.paths?.['/i/change-password/passkey/complete']?.post?.operationId).toBe('post___i___change-password___passkey___complete');
	expect(spec.paths?.['/i/regenerate-token/passkey/start']?.post?.operationId).toBe('post___i___regenerate-token___passkey___start');
	expect(spec.paths?.['/i/regenerate-token/passkey/complete']?.post?.operationId).toBe('post___i___regenerate-token___passkey___complete');
	expect(spec.paths?.['/i/update-email/passkey/start']?.post?.operationId).toBe('post___i___update-email___passkey___start');
	expect(spec.paths?.['/i/update-email/passkey/complete']?.post?.operationId).toBe('post___i___update-email___passkey___complete');
	// SSO is deferred; none of its fifteen routes may appear in the public contract.
	for (const path of [
		'/oidc/providers',
		'/oidc/start',
		'/oidc/callback',
		'/oidc/status',
		'/oidc/cancel',
		'/oidc/login',
		'/oidc/onboarding',
		'/oidc/onboarding/verify',
		'/i/oidc/links',
		'/i/oidc/link/start',
		'/i/oidc/link/complete',
		'/i/oidc/unlink',
		'/admin/oidc/providers',
		'/admin/oidc/create',
		'/admin/oidc/update',
	]) {
		expect(spec.paths).not.toHaveProperty(path);
	}
	const addedSecurityPaths = [
		'/i/security/account/delete',
		'/i/security/passkey/passwordless/start',
		'/i/security/passkey/passwordless/complete',
		'/i/security/password-login/disable/start',
		'/i/security/password-login/disable/complete',
		'/i/security/password',
		'/i/security/email',
		'/i/security/regenerate-token',
		'/i/security/state',
		'/i/security/keys/list',
		'/i/security/passkey/register/start',
		'/i/security/passkey/register/complete',
		'/i/security/passkey/mfa/start',
		'/i/security/passkey/mfa/complete',
		'/i/security/passkey/mfa/disable',
		'/i/security/passkey/remove',
		'/i/security/passkey/rename',
		'/i/security/passkey/passwordless',
		'/i/security/totp/start',
		'/i/security/totp/complete',
		'/i/security/totp/remove',
		'/i/security/recovery-codes',
		'/i/sudo/start',
		'/i/sudo/complete',
		'/i/sudo/status',
		'/i/sudo/exit',
	];
	const addedSecurityIds = new Set(addedSecurityPaths.map(path => `post___${path.slice(1).replaceAll('/', '___')}`));
	expect(addedSecurityIds.size).toBe(26);
	for (const path of addedSecurityPaths) {
		expect(spec.paths?.[path]?.post?.operationId).toBe(`post___${path.slice(1).replaceAll('/', '___')}`);
	}
	// Exclude the fifteen deferred SSO routes from the preceding API count.
	expect(identifiers.filter(id => !addedSecurityIds.has(id!))).toHaveLength(483);
	expect(identifiers).toHaveLength(483 + 26);
	expect(new Set(identifiers).size).toBe(identifiers.length);
});

test('external ID collisions fail generation instead of emitting ambiguous identifiers', () => {
	const operation = { responses: { '204': { description: 'Empty' } } } satisfies OpenAPI.OperationObject;
	expect(() => assignExternalOperationIds({ paths: {
		'/a/b': { post: { ...operation } }, '/a___b': { post: { ...operation } },
	} })).toThrow('Duplicate external operation identifier: post___a___b');
});
