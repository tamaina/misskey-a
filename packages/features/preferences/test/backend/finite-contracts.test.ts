/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { inlineIRegistryScopesWithDomainInput as input, inlineIRegistryScopesWithDomainOutput as output, inlineIRegistryScopesWithDomainDefinition as definition } from '../../contract/endpoint-definitions.js';
import { remainingIRegistryGetDetailOutput as detailOutput, remainingIRegistryKeysInput as keysInput } from '../../contract/remaining-inline-endpoint-definitions.js';
import { MiRegistryItem } from '../../backend/models/RegistryItem.js';
import { RegistryApiService } from '../../backend/services/RegistryApiService.js';
import type { RegistryItemsRepository } from '@features/persistence/backend/repositories/models.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';

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

test('HTTP retains open request and unparsed response identities', async () => {
	const request = { i: 'token', future: true };
	const response = [{ ...item, future: true }];
	const endpoint = new ContractEndpoint({}, projectEndpointContract(definition), async ps => { expect(ps).toBe(request); return response; });
	expect(await endpoint.exec(request, null, null)).toBe(response);
	expect(v.safeParse(output, response).success).toBe(false);
});
