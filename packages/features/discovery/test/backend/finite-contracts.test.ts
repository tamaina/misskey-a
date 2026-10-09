/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';

import { HashtagEntityService } from '../../backend/serializers/HashtagEntityService.js';
import { HashtagsTrendOperation } from '../../backend/endpoints/hashtags/trend.js';
import { FeaturedService } from '../../backend/services/FeaturedService.js';
import { HashtagService } from '../../backend/services/HashtagService.js';

import { packedSchemas } from '../../../index/backend/packed.schema.js';
import { hashtagsSearchContract as nativeContract1 } from '../../backend/endpoints/discovery.contract.js';
import { hashtagsTrendGetContract as nativeContract2 } from '../../backend/endpoints/discovery.contract.js';
import { hashtagsTrendGetContract as nativeContract3 } from '../../backend/endpoints/discovery.contract.js';
import type { MiHashtag } from '../../backend/models/Hashtag.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const searchInput = requiredSchema(nativeContract1['~orpc'].inputSchema);
const output = requiredSchema(nativeContract2['~orpc'].outputSchema);
const definition = nativeContract3;
const packedHashtagSchema = packedSchemas.Hashtag;

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
	const endpoint = new HashtagsTrendOperation(featured, hashtags);
	expect(v.parse(output, await endpoint.execute({}, null))).toEqual([item]);
	const packed = await new HashtagEntityService().pack(mockDeep<MiHashtag>({ name: 'misskey', mentionedUsersCount: 1, mentionedLocalUsersCount: 1, mentionedRemoteUsersCount: 0, attachedUsersCount: 2, attachedLocalUsersCount: 1, attachedRemoteUsersCount: 1 }));
	expect(v.parse(packedHashtagSchema, packed)).toEqual(packed);
	expect(Object.keys(packed)).toHaveLength(7);
	expect(v.safeParse(packedHashtagSchema, { ...packed, future: true }).success).toBe(false);
	expect(v.safeParse(packedHashtagSchema, { ...packed, attachedUsersCount: undefined }).success).toBe(false);
});
