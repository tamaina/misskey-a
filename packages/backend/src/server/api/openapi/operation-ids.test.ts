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
	expect(identifiers).toHaveLength(465);
	expect(new Set(identifiers).size).toBe(identifiers.length);
});

test('external ID collisions fail generation instead of emitting ambiguous identifiers', () => {
	const operation = { responses: { '204': { description: 'Empty' } } } satisfies OpenAPI.OperationObject;
	expect(() => assignExternalOperationIds({ paths: {
		'/a/b': { post: { ...operation } }, '/a___b': { post: { ...operation } },
	} })).toThrow('Duplicate external operation identifier: post___a___b');
});
