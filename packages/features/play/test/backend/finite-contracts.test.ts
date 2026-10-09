/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedFlashSchema } from '../../backend/flash.schema.js';
import { flashCreateContract } from '../../backend/endpoints/flash/create.contract.js';
import { flashFeaturedContract } from '../../backend/endpoints/flash/featured.contract.js';
import { flashFeaturedContract as packedFlashFeaturedDefinition } from '../../backend/endpoints/flash/featured.contract.js';

import { flashMyLikesContract } from '../../backend/endpoints/flash/my-likes.contract.js';
import { flashUpdateContract } from '../../backend/endpoints/flash/update.contract.js';
import { FlashEntityService } from '../../backend/serializers/FlashEntityService.js';
import { FlashLikeEntityService } from '../../backend/serializers/FlashLikeEntityService.js';
import type { MiFlash } from '../../backend/models/Flash.js';
import type { MiFlashLike } from '../../backend/models/FlashLike.js';

function requiredSchema<T>(schema: T | undefined): T {
	if (schema === undefined) throw new Error('Expected contract schema');
	return schema;
}

const packedFlashCreateInput = requiredSchema(flashCreateContract['~orpc'].inputSchema);
const packedFlashFeaturedInput = requiredSchema(flashFeaturedContract['~orpc'].inputSchema);
const packedFlashFeaturedOutput = requiredSchema(flashFeaturedContract['~orpc'].outputSchema);
const packedFlashMyLikesOutput = requiredSchema(flashMyLikesContract['~orpc'].outputSchema);
const voidFlashUpdateInput = requiredSchema(flashUpdateContract['~orpc'].inputSchema);

const date = new Date('2026-01-01T00:00:00Z');
const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

function fixture() {
	const users = mockDeep<ConstructorParameters<typeof FlashEntityService>[2]>();
	users.pack.mockResolvedValue(user);
	const ids = mockDeep<ConstructorParameters<typeof FlashEntityService>[3]>();
	ids.parse.mockReturnValue({ date });
	const likes = mockDeep<ConstructorParameters<typeof FlashEntityService>[1]>();
	likes.exists.mockResolvedValue(true);
	const service = new FlashEntityService(mockDeep(), likes, users, ids);
	const flash = mockDeep<MiFlash>({ id: 'flash123', updatedAt: date, userId: user.id, user: null, title: 'play', summary: '', script: 'print(1)', visibility: 'public', likedCount: 2, permissions: ['read:account'] });
	return { service, flash };
}

test.each([false, true])('actual Flash serializer and like wrapper retain viewer fields authenticated=%s', async authenticated => {
	const { service, flash } = fixture();
	const me = authenticated ? user : null;
	for (const visibility of ['public', 'private'] as const) {
		flash.visibility = visibility;
		const output = await service.pack(flash, me);
		checkClosed(packedFlashSchema, output, 'title', { likedCount: '2' });
		expect(output.isLiked).toBe(authenticated ? true : undefined);
		expect(Object.hasOwn(output, 'isLiked')).toBe(true);
		expect(output).not.toHaveProperty('permissions');
		if (authenticated) expect((await service.pack(flash, user, { likedFlashIds: [] })).isLiked).toBe(false);
		const like = await new FlashLikeEntityService(mockDeep(), service).pack(mockDeep<MiFlashLike>({ id: 'like123', flash }), me);
		expect(v.parse(packedFlashMyLikesOutput, [like])).toEqual([like]);
		for (const value of [{ ...like, future: true }, { id: like.id }, { ...like, id: 7 }, { ...like, flash: { ...output, future: true } }]) expect(v.safeParse(packedFlashMyLikesOutput, [value]).success).toBe(false);
	}
});

test('native Flash inputs preserve defaults and finite outputs reject extra fields', async () => {
	const create = { title: 'play', summary: '', script: 'print(1)', permissions: [] };
	expect(v.parse(packedFlashCreateInput, { ...create, future: true })).toEqual({ ...create, visibility: 'public' });
	for (const value of [{}, { ...create, script: 7 }, { ...create, visibility: 'unknown' }]) expect(v.safeParse(packedFlashCreateInput, value).success).toBe(false);
	expect(v.parse(voidFlashUpdateInput, { flashId: 'flash123', future: true })).toEqual({ flashId: 'flash123' });
	expect(v.parse(packedFlashFeaturedInput, { future: true })).toEqual({ offset: 0, limit: 10 });
	const { service, flash } = fixture();
	const response = [{ ...await service.pack(flash), future: true }];
	const params = { future: true };
	expect(v.safeParse(packedFlashFeaturedOutput, response).success).toBe(false);
	expect(v.safeParse(packedFlashFeaturedInput, { limit: 0 }).success).toBe(false);
});
