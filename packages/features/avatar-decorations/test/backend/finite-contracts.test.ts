/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createAvatarDecorationInput as input, createAvatarDecorationOutput as output, createAvatarDecorationDefinition as definition, listAvatarDecorationsOutput, avatarDecorationResult, avatarDecorationsContract } from '../../contract/index.js';
import { createAvatarDecorations } from '../../backend/index.js';
import { EndpointImplementation as ListEndpoint } from '../../backend/endpoints/admin/avatar-decorations/list.js';
import { EndpointImplementation } from '../../backend/endpoints/admin/avatar-decorations/create.js';
import { MiAvatarDecoration } from '../../backend/models/AvatarDecoration.js';
import { AvatarDecorationService } from '../../backend/services/AvatarDecorationService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';

const params = { name: 'Ribbon', description: '', url: 'https://example.test/ribbon' };
const item = { id: 'decoration1', ...params, roleIdsThatCanBeUsedThisDecoration: [], category: null };
const result = { ...item, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: null };

test('avatar inputs strip extras and finite outputs reject extras, omissions and wrong types', () => {
	expect(v.parse(input, { ...params, future: true })).toEqual(params);
	for (const value of [{}, { ...params, name: '' }, { ...params, url: 7 }]) expect(v.safeParse(input, value).success).toBe(false);
	expect(v.parse(output, result)).toEqual(result);
	for (const value of [{ ...result, future: true }, { ...result, id: undefined }, { ...result, category: 7 }, { ...result, updatedAt: 7 }]) expect(v.safeParse(output, value).success).toBe(false);
	expect(v.parse(listAvatarDecorationsOutput, [result])).toEqual([result]);
	expect(v.parse(avatarDecorationResult, [item])).toEqual([item]);
	expect(v.safeParse(avatarDecorationResult, [{ ...item, future: true }]).success).toBe(false);
});

test('real create handler emits the explicit fields and nullable category', async () => {
	const service = mockDeep<AvatarDecorationService>();
	const ids = mockDeep<IdService>();
	service.create.mockResolvedValue(Object.assign(new MiAvatarDecoration(), item));
	ids.parse.mockReturnValue({ date: new Date(result.createdAt) });
	const endpoint = new EndpointImplementation(service, ids);
	const produced = await endpoint.exec(params, mockDeep<MiLocalUser>({ id: 'user123' }), null);
	expect(produced).toEqual(result);
	expect(v.parse(output, produced)).toEqual(result);
});

test('HTTP keeps open input identity and unparsed response identity', async () => {
	const request = { ...params, i: 'token', future: true };
	const response = { ...result, future: true };
	const endpoint = new ContractEndpoint({}, projectEndpointContract(definition), async ps => { expect(ps).toBe(request); return response; });
	expect(await endpoint.exec(request, null, null)).toBe(response);
	await expect(endpoint.exec({ ...params, name: '' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
});

test('actual list dates are nullable and public category supports omitted and null branches', async () => {
	const service = mockDeep<AvatarDecorationService>();
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date: new Date(result.createdAt) });
	service.getAll.mockResolvedValue([Object.assign(new MiAvatarDecoration(), item, { updatedAt: null }), Object.assign(new MiAvatarDecoration(), item, { updatedAt: new Date(result.createdAt) })]);
	const listed = await new ListEndpoint(service, ids).exec({}, mockDeep<MiLocalUser>(), null);
	expect(v.parse(listAvatarDecorationsOutput, listed)).toEqual([result, { ...result, updatedAt: result.createdAt }]);
	const decorations = [item, { ...item }];
	Reflect.deleteProperty(decorations[1], 'category');
	const feature = createAvatarDecorations({ readDecorations: async () => decorations, readRoles: async () => [] });
	const publicResult = await feature['get-avatar-decorations']({}, { context: { authenticated: false } });
	expect(publicResult[0].category).toBeNull();
	expect(Object.hasOwn(publicResult[1], 'category')).toBe(false);
	expect(v.parse(avatarDecorationResult, publicResult)).toEqual(publicResult);
});

test('public empty avatar input retains its non-array JSON-object guard and missing-body default', () => {
	const schema = avatarDecorationsContract['get-avatar-decorations']['~orpc'].inputSchema!;
	expect(v.parse(schema, undefined)).toEqual({});
	const request = { future: true };
	expect(v.parse(schema, request)).toBe(request);
	for (const value of [[], [1], null, 7, 'bad']) expect(v.safeParse(schema, value).success).toBe(false);
});
