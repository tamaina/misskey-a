/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient } from '@orpc/server';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { SelectQueryBuilder } from 'typeorm';
import { createGalleryFeaturedProcedure } from '../../backend/endpoints/gallery/featured.js';
import type { GalleryFeaturedDependencies } from '../../backend/endpoints/gallery/featured.js';
import type { MiGalleryPost } from '../../backend/models/GalleryPost.js';
import type { ApiActor, ApiContext, ApiServices } from '../../../api/backend/transport/context.js';
test('composed gallery endpoint shares the ranking cache across requests and refreshes after thirty minutes', async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	try {
		const now = new Date('2026-10-09T10:00:00Z');
		vi.setSystemTime(now);
		const dependencies = mockDeep<GalleryFeaturedDependencies<ApiActor>>();
		const ranking = ['post1', 'post3', 'post2'];
		dependencies.featuredService.getGalleryPostsRanking.mockResolvedValue(ranking);
		const query = mockDeep<SelectQueryBuilder<MiGalleryPost>>();
		query.where.mockReturnValue(query);
		query.getMany.mockResolvedValue([]);
		dependencies.galleryPostsRepository.createQueryBuilder.mockReturnValue(query);
		dependencies.galleryPostEntityService.packMany.mockResolvedValue([]);
		const services = mockDeep<ApiServices<ApiActor>>();
		services.authenticate.mockResolvedValue([null, null]);
		const context: ApiContext<ApiActor> = { services, credential: null, headers: {}, ip: '127.0.0.1' };
		const client = createProcedureClient(createGalleryFeaturedProcedure(dependencies), { context });
		expect(await client({ limit: 2 })).toEqual([]);
		expect(query.where).toHaveBeenLastCalledWith('post.id IN (:...postIds)', { postIds: ['post3', 'post2'] });
		expect(ranking).toEqual(['post3', 'post2', 'post1']);
		expect(await client({ limit: 1, untilId: 'post3' })).toEqual([]);
		expect(query.where).toHaveBeenLastCalledWith('post.id IN (:...postIds)', { postIds: ['post2'] });
		expect(dependencies.featuredService.getGalleryPostsRanking).toHaveBeenCalledExactlyOnceWith(100);
		vi.setSystemTime(new Date(now.getTime() + 30 * 60 * 1000));
		dependencies.featuredService.getGalleryPostsRanking.mockResolvedValue(['post9']);
		expect(await client({})).toEqual([]);
		expect(dependencies.featuredService.getGalleryPostsRanking).toHaveBeenCalledTimes(2);
		expect(query.where).toHaveBeenLastCalledWith('post.id IN (:...postIds)', { postIds: ['post9'] });
		expect(dependencies.galleryPostEntityService.packMany).toHaveBeenCalledTimes(3);
	} finally {
		vi.useRealTimers();
	}
});
