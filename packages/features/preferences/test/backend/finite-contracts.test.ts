/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { registryScopesWithDomainInput as input, registryScopesWithDomainOutput as output } from '../../backend/endpoints/i/registry/scopes-with-domain.contract.js';
import { registryGetDetailOutput as detailOutput } from '../../backend/endpoints/i/registry/get-detail.contract.js';
import { registryKeysInput as keysInput } from '../../backend/endpoints/i/registry/keys.contract.js';
import { MiRegistryItem } from '../../backend/models/RegistryItem.js';
import { RegistryApiService } from '../../backend/services/RegistryApiService.js';
import type { RegistryItemsRepository } from '@features/persistence/backend/repositories/models.js';

const item = { domain: null, scopes: [['client']] };

test('registry finite envelopes close fields while registry values retain dynamic JSON', () => {
	expect(v.parse(input, { future: true })).toEqual({});
	expect(v.parse(keysInput, { future: true })).toEqual({ scope: [] });
	expect(v.parse(output, [item])).toEqual([item]);
	for (const value of [[{ ...item, future: true }], [{ scopes: [] }], [{ ...item, domain: 7 }], [{ ...item, scopes: [7] }]]) expect(v.safeParse(output, value).success).toBe(false);
	expect(v.parse(detailOutput, { updatedAt: 'date', value: { arbitrary: [null, 7] } })).toEqual({ updatedAt: 'date', value: { arbitrary: [null, 7] } });
	expect(v.safeParse(detailOutput, { updatedAt: 'date', value: null, future: true }).success).toBe(false);
});

test('real registry scope producer deduplicates scopes with explicit domain and scopes', async () => {
	const repository = mockDeep<RegistryItemsRepository>();
	const query = mockDeep<ReturnType<RegistryItemsRepository['createQueryBuilder']>>();
	repository.createQueryBuilder.mockReturnValue(query);
	query.select.mockReturnValue(query);
	query.where.mockReturnValue(query);
	query.getMany.mockResolvedValue([Object.assign(new MiRegistryItem(), { domain: null, scope: ['client'] }), Object.assign(new MiRegistryItem(), { domain: null, scope: ['client'] })]);
	const service = new RegistryApiService(repository, mockDeep(), mockDeep());
	const result = await service.getAllScopeAndDomains('user123');
	expect(result).toEqual([item]);
	expect(v.parse(output, result)).toEqual(result);
});

test('native registry requests require objects and preserve only supported fields', () => {
 for (const value of [null, [], 1, 'registry']) expect(v.safeParse(input, value).success).toBe(false);
 expect(v.parse(keysInput, { scope: ['client'], domain: null, future: true })).toEqual({ scope: ['client'], domain: null });
 const value: unknown = JSON.parse('{"__proto__":{"nested":null},"constructor":[1,true],"prototype":"saved"}');
 expect(v.parse(detailOutput, { updatedAt: 'date', value })).toEqual({ updatedAt: 'date', value });
 for (const invalid of [new Date(), new Map(), { invalid: undefined }]) expect(v.safeParse(detailOutput, { updatedAt: 'date', value: invalid }).success).toBe(false);
});
