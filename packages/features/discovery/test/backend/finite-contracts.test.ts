/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { inlineHashtagsSearchInput as searchInput, inlineHashtagsTrendOutput as output, inlineHashtagsTrendDefinition as definition } from '../../contract/endpoint-definitions.js';
import { packedHashtagSchema } from '../../contract/packed.js';
import { HashtagEntityService } from '../../backend/serializers/HashtagEntityService.js';
import { EndpointImplementation } from '../../backend/endpoints/hashtags/trend.js';
import { FeaturedService } from '../../backend/services/FeaturedService.js';
import { HashtagService } from '../../backend/services/HashtagService.js';
import type { MiHashtag } from '../../backend/models/Hashtag.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';

const item = { tag: 'misskey', chart: [1, 3], usersCount: 3 };

test('discovery defaults and finite trend/hashtag outputs reject shape drift', () => {
	expect(v.parse(searchInput, { query: 'mi', future: true })).toEqual({ query: 'mi', limit: 10, offset: 0 });
	for (const value of [{}, { query: 7 }, { query: 'mi', limit: 0 }]) expect(v.safeParse(searchInput, value).success).toBe(false);
	expect(v.parse(output, [item])).toEqual([item]);
	for (const value of [[{ ...item, future: true }], [{ tag: 'mi', chart: [] }], [{ ...item, chart: ['bad'] }]]) expect(v.safeParse(output, value).success).toBe(false);
});

test('actual trend and hashtag producers emit declared fields', async () => {
	const featured = mockDeep<FeaturedService>();
	const hashtags = mockDeep<HashtagService>();
	featured.getHashtagsRanking.mockResolvedValue(['misskey']);
	hashtags.getCharts.mockResolvedValue({ misskey: [1, 3] });
	const endpoint = new EndpointImplementation(featured, hashtags);
	expect(v.parse(output, await endpoint.exec({}, null, null))).toEqual([item]);
	const packed = await new HashtagEntityService().pack(mockDeep<MiHashtag>({ name: 'misskey', mentionedUsersCount: 1, mentionedLocalUsersCount: 1, mentionedRemoteUsersCount: 0, attachedUsersCount: 2, attachedLocalUsersCount: 1, attachedRemoteUsersCount: 1 }));
	expect(v.parse(packedHashtagSchema, packed)).toEqual(packed);
	expect(Object.keys(packed)).toHaveLength(7);
	expect(v.safeParse(packedHashtagSchema, { ...packed, future: true }).success).toBe(false);
	expect(v.safeParse(packedHashtagSchema, { ...packed, attachedUsersCount: undefined }).success).toBe(false);
});

test('HTTP keeps open unknown inputs and unparsed output identity', async () => {
	const request = { i: 'token', future: true };
	const response = [{ ...item, future: true }];
	const endpoint = new ContractEndpoint({}, projectEndpointContract(definition), async ps => { expect(ps).toBe(request); return response; });
	expect(await endpoint.exec(request, null, null)).toBe(response);
	expect(v.safeParse(output, response).success).toBe(false);
});
