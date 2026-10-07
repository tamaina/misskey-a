/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DI } from '@/di-symbols.js';
import { discoveryServices, rankingServices, userSearchServices } from '../../../features/discovery/backend/services.js';
import { FeaturedService } from '../../../features/discovery/backend/services/FeaturedService.js';
import { HashtagService } from '../../../features/discovery/backend/services/HashtagService.js';
import { UserEntityService } from '../../../features/users/backend/serializers/UserEntityService.js';
import { IdService } from '../../../features/runtime/backend/services/IdService.js';
import { UtilityService } from './UtilityService.js';
import { featureServiceGroups } from './feature-service-providers.js';
import type { FactoryProvider } from '@nestjs/common';
import type { ChainableCommander } from 'ioredis';
import type { Inputs } from '../../../features/index/backend/service-definitions.js';

function setup() {
	const inputs = mockDeep<Inputs<typeof rankingServices>>({ meta: { hiddenTags: [], sensitiveWords: [] } });
	const pipeline = mockDeep<ChainableCommander>();
	inputs.redisClient.pipeline.mockReturnValue(pipeline);
	inputs.redisClient.multi.mockReturnValue(pipeline);
	pipeline.exec.mockResolvedValue([]);
	inputs.redisClient.sismember.mockResolvedValue(0);
	inputs.utilityService.isKeyWordIncluded.mockReturnValue(false);
	return { inputs, pipeline, services: rankingServices.create(inputs) };
}

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

describe('ranking declarations', () => {
	test('existing discovery and search factory contracts keep their exact output shape', () => {
		expect(Object.keys(discoveryServices.definitions)).toEqual(['HashtagEntityService']);
		expect(Object.keys(discoveryServices.create())).toEqual(['HashtagEntityService']);
		expect(Object.keys(userSearchServices.definitions)).toEqual(['UserSearchService']);
		expect(Object.keys(rankingServices.definitions)).toEqual(['FeaturedService', 'HashtagService']);
		expect(rankingServices.definitions.HashtagService.dependencies[5]).toBe(rankingServices.definitions.FeaturedService);
	});

	test('local edge uses the exact exposed Featured singleton and borrows every constructor input', () => {
		const { inputs, services } = setup();
		const second = rankingServices.create(inputs);
		const direct = new HashtagService(inputs.db, inputs.meta, inputs.redisClient, inputs.hashtagsRepository, inputs.userEntityService, services.FeaturedService, inputs.idService, inputs.utilityService);
		for (const instance of [services.HashtagService, direct]) {
			for (const key of ['db', 'meta', 'redisClient', 'hashtagsRepository', 'userEntityService', 'idService', 'utilityService'] as const) expect(Reflect.get(instance, key)).toBe(inputs[key]);
			expect(Reflect.get(instance, 'featuredService')).toBe(services.FeaturedService);
		}
		expect(second.FeaturedService).not.toBe(services.FeaturedService);
		expect(second.HashtagService).not.toBe(services.HashtagService);
		expect(Reflect.get(second.HashtagService, 'featuredService')).toBe(second.FeaturedService);
		expect(Reflect.get(new FeaturedService(inputs.redisClient), 'redisClient')).toBe(inputs.redisClient);
		expect(inputs.redisClient.quit).not.toHaveBeenCalled();
		expect(inputs.redisClient.disconnect).not.toHaveBeenCalled();
	});

	test('Nest preserves aliases, strict ModuleRef lookup, singleton and borrowed resource ownership', async () => {
		const { inputs } = setup();
		const group = featureServiceGroups.ranking;
		const factory = group.providers.find((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
		expect(factory?.inject).toEqual([DI.redis, DI.db, DI.meta, DI.hashtagsRepository, UserEntityService, IdService, UtilityService]);
		const module = await Test.createTestingModule({ providers: [
			{ provide: DI.redis, useValue: inputs.redisClient },
			{ provide: DI.db, useValue: inputs.db },
			{ provide: DI.meta, useValue: inputs.meta },
			{ provide: DI.hashtagsRepository, useValue: inputs.hashtagsRepository },
			{ provide: UserEntityService, useValue: inputs.userEntityService },
			{ provide: IdService, useValue: inputs.idService },
			{ provide: UtilityService, useValue: inputs.utilityService },
			...group.providers,
		] }).compile();
		try {
			await module.init();
			for (const ctor of [FeaturedService, HashtagService]) {
				const service = module.get<object>(ctor);
				expect(module.get(ctor.name)).toBe(service);
				expect(module.get(ModuleRef).get(ctor.name, { strict: true })).toBe(service);
				expect(Reflect.getMetadata('design:paramtypes', ctor)).toBeUndefined();
				expect(Reflect.get(service, 'redisClient')).toBe(inputs.redisClient);
			}
			expect(Reflect.get(module.get(HashtagService), 'featuredService')).toBe(module.get(FeaturedService));
		} finally {
			await module.close();
		}
		expect(inputs.redisClient.quit).not.toHaveBeenCalled();
		expect(inputs.redisClient.disconnect).not.toHaveBeenCalled();
	});

	test('hidden, sensitive and already-counted tags do not change rankings', async () => {
		const { inputs, services, pipeline } = setup();
		inputs.meta.hiddenTags = ['hidden'];
		await services.HashtagService.updateHashtagsRanking('hidden', 'user');
		inputs.utilityService.isKeyWordIncluded.mockReturnValueOnce(true);
		await services.HashtagService.updateHashtagsRanking('sensitive', 'user');
		inputs.redisClient.sismember.mockResolvedValueOnce(1);
		await services.HashtagService.updateHashtagsRanking('counted', 'user');
		expect(inputs.redisClient.sismember).toHaveBeenCalledExactlyOnceWith('hashtagUsers:counted', 'user');
		expect(pipeline.zincrby).not.toHaveBeenCalled();
		expect(pipeline.pfadd).not.toHaveBeenCalled();
	});

	test('new hashtag ranking preserves window keys, NX expiry and the shared local service call', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'));
		const { services, pipeline } = setup();
		const featured = vi.spyOn(services.FeaturedService, 'updateHashtagsRanking');
		await services.HashtagService.updateHashtagsRanking('tag', 'user');
		expect(featured).toHaveBeenCalledExactlyOnceWith('tag', 1);
		const window = Math.floor((Date.now() - Date.parse('2023-01-01T00:00:00Z')) / 3600000);
		expect(pipeline.zincrby).toHaveBeenCalledWith(`featuredHashtagsRanking:${window}`, 1, 'tag');
		expect(pipeline.expire).toHaveBeenCalledWith(`featuredHashtagsRanking:${window}`, 10800, 'NX');
		expect(pipeline.pfadd).toHaveBeenCalledWith('hashtagUsers:tag:202601020300', 'user');
		expect(pipeline.expire).toHaveBeenCalledWith('hashtagUsers:tag:202601020300', 259200, 'NX');
		expect(pipeline.sadd).toHaveBeenCalledWith('hashtagUsers:tag', 'user');
		expect(pipeline.expire).toHaveBeenCalledWith('hashtagUsers:tag', 3600, 'NX');
	});

	test('ranking retrieval preserves current/previous window ordering and direct-constructor behavior', async () => {
		const { inputs, services, pipeline } = setup();
		pipeline.exec.mockResolvedValue([[null, ['a', '3', 'b', '2']], [null, ['b', '6', 'c', '4']]]);
		expect(await services.FeaturedService.getHashtagsRanking(10)).toEqual(['a', 'b', 'c']);
		expect(await new FeaturedService(inputs.redisClient).getHashtagsRanking(10)).toEqual(['a', 'b', 'c']);
		expect(pipeline.zrange).toHaveBeenCalledWith(expect.stringMatching(/^featuredHashtagsRanking:\d+$/), 0, 10, 'REV', 'WITHSCORES');
	});
});
