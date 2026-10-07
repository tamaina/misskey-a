/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import sharp from 'sharp';
import { DI } from '@/di-symbols.js';
import type { MiRegistryItem } from '@features/persistence/backend/repositories/models.js';
import { mediaServices } from '@features/media/backend/services.js';
import { markupServices } from '@features/markup/backend/services.js';
import { preferencesServices } from '@features/preferences/backend/services.js';
import { moderationLoggingServices, moderationServices } from '@features/moderation/backend/services.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { ImageProcessingService } from '@features/media/backend/services/ImageProcessingService.js';
import { VideoProcessingService } from '@features/media/backend/services/VideoProcessingService.js';
import { SensitiveMediaDetectionService } from '@features/media/backend/services/SensitiveMediaDetectionService.js';
import { FileInfoService } from '@features/media/backend/services/FileInfoService.js';
import { MfmService } from '@features/markup/backend/services/MfmService.js';
import { RegistryApiService } from '@features/preferences/backend/services/RegistryApiService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { featureServiceGroups } from './feature-service-providers.js';
import type { FactoryProvider, InjectionToken, Provider } from '@nestjs/common';
import type { SelectQueryBuilder } from 'typeorm';
import type { Inputs } from '@features/index/backend/service-definitions.js';

const selectedGroups = [featureServiceGroups.media, featureServiceGroups.markup, featureServiceGroups.preferences, featureServiceGroups.moderationLogging];
const tokenOf = (provider: Provider): InjectionToken => typeof provider === 'function' ? provider : provider.provide;
const selectedClasses = [ImageProcessingService, VideoProcessingService, SensitiveMediaDetectionService, FileInfoService, MfmService, RegistryApiService, ModerationLogService];

function mediaInputs(): ReturnType<typeof mockDeep<Inputs<typeof mediaServices>>> {
	const inputs = mockDeep<Inputs<typeof mediaServices>>();
	inputs.loggerService.getLogger.mockReturnValue(mockDeep<ReturnType<LoggerService['getLogger']>>());
	return inputs;
}

describe('seven stateless feature declarations', () => {
	test('plain media graphs share local services, borrow supplied objects, and remain fresh per create', () => {
		const inputs = mediaInputs();
		const first = mediaServices.create(inputs);
		const second = mediaServices.create(inputs);
		expect(Reflect.get(first.VideoProcessingService, 'imageProcessingService')).toBe(first.ImageProcessingService);
		expect(Reflect.get(first.FileInfoService, 'sensitiveMediaDetectionService')).toBe(first.SensitiveMediaDetectionService);
		expect(Reflect.get(first.SensitiveMediaDetectionService, 'httpRequestService')).toBe(inputs.httpRequestService);
		expect(Reflect.get(first.FileInfoService, 'loggerService')).toBe(inputs.loggerService);
		for (const key of Object.keys(first) as (keyof typeof first)[]) expect(second[key]).not.toBe(first[key]);
		expect(mediaServices.ports.map(port => port.name).sort()).toEqual(['config', 'httpRequestService', 'loggerService', 'meta']);
		expect(() => Reflect.apply(mediaServices.create, undefined, [{}])).toThrow('Missing port');
	});

	test('moderation keeps its original input and output group while logging is separate', () => {
		expect(moderationServices.ports.map(port => port.name).sort()).toEqual(['abuseReportNotificationRecipientRepository', 'abuseUserReportsRepository', 'idService', 'moderationLogsRepository', 'systemWebhookEntityService', 'userEntityService']);
		expect(Object.keys(moderationServices.definitions).sort()).toEqual(['AbuseReportNotificationRecipientEntityService', 'AbuseUserReportEntityService', 'ModerationLogEntityService']);
		expect(featureServiceGroups.moderationLogging.exports).toEqual([ModerationLogService, 'ModerationLogService']);
	});

	test('selective Nest graphs retain aliases, strict lookup, singleton identities and local sharing', async () => {
		const providers = selectedGroups.flatMap(group => group.providers);
		const factories = providers.filter((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
		const internal = new Set(providers.map(tokenOf));
		const external = new Set((factories.flatMap(provider => provider.inject ?? []) as InjectionToken[]).filter(token => !internal.has(token)));
		const inputs = mediaInputs();
		const spies = factories.map(factory => vi.spyOn(factory, 'useFactory'));
		const module = await Test.createTestingModule({ providers: [
			...[...external].map(provide => ({ provide, useValue: provide === LoggerService ? inputs.loggerService : provide === HttpRequestService ? inputs.httpRequestService : {} })),
			...providers,
		] }).compile();
		try {
			await module.init();
			const resolver = module.get(ModuleRef);
			for (const ctor of selectedClasses) {
				const instance = module.get(ctor);
				expect(instance).toBeInstanceOf(ctor);
				expect(module.get(ctor.name)).toBe(instance);
				expect(resolver.get(ctor.name)).toBe(instance);
				expect(Reflect.getMetadata('design:paramtypes', ctor)).toBeUndefined();
			}
			expect(Reflect.get(module.get(VideoProcessingService), 'imageProcessingService')).toBe(module.get(ImageProcessingService));
			expect(Reflect.get(module.get(FileInfoService), 'sensitiveMediaDetectionService')).toBe(module.get(SensitiveMediaDetectionService));
			expect(Reflect.get(module.get(SensitiveMediaDetectionService), 'httpRequestService')).toBe(inputs.httpRequestService);
			expect(module.get(LoggerService)).toBe(inputs.loggerService);
			for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
		} finally { await module.close(); }
	});

	test('selective media providers keep the existing class-only useMocker path', async () => {
		const inputs = mediaInputs();
		const mocks: unknown[] = [];
		const module = await Test.createTestingModule({ providers: [
			{ provide: DI.config, useValue: inputs.config }, { provide: DI.meta, useValue: inputs.meta },
			...featureServiceGroups.media.providers,
		] }).useMocker(token => {
			mocks.push(token);
			if (token === LoggerService) return inputs.loggerService;
			if (token === HttpRequestService) return inputs.httpRequestService;
			return undefined;
		}).compile();
		try {
			expect(mocks).toEqual(expect.arrayContaining([LoggerService, HttpRequestService]));
			expect(mocks.every(token => typeof token === 'function')).toBe(true);
			expect(Reflect.get(module.get(FileInfoService), 'loggerService')).toBe(inputs.loggerService);
			expect(Reflect.get(module.get(SensitiveMediaDetectionService), 'httpRequestService')).toBe(inputs.httpRequestService);
		} finally { await module.close(); }
	});

	test('video and markup factory behavior retains external URL encoding and HTML conversion', () => {
		const inputs = mediaInputs();
		inputs.config.videoThumbnailGenerator = 'https://thumb.example';
		const video = mediaServices.create(inputs).VideoProcessingService;
		expect(video.getExternalVideoThumbnailUrl('https://media.example/video?a=1')).toBe('https://thumb.example/thumbnail.webp?thumbnail=1&url=https%3A%2F%2Fmedia.example%2Fvideo%3Fa%3D1');
		const markup = markupServices.create(mockDeep<Inputs<typeof markupServices>>()).MfmService;
		expect(markup.fromHtml('<p>Hello<br>world</p>')).toBe('Hello\nworld');
	});

	test('media factories retain real image conversion and empty-file inspection', async () => {
		const services = mediaServices.create(mediaInputs());
		const image = await services.ImageProcessingService.convertSharpToWebp(sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }), 4, 4);
		expect(image).toMatchObject({ ext: 'webp', type: 'image/webp' });
		expect(await sharp(image.data).metadata()).toMatchObject({ width: 4, height: 4, format: 'webp' });
		const info = await services.FileInfoService.getFileInfo(new URL('../../test/resources/emptyfile', import.meta.url).pathname, { skipSensitiveDetection: true });
		expect(info).toMatchObject({ size: 0, md5: 'd41d8cd98f00b204e9800998ecf8427e', type: { mime: 'application/octet-stream', ext: null } });
	});

	test('moderation logging uses the supplied repository and Id instance with unchanged payloads', async () => {
		const inputs = mockDeep<Inputs<typeof moderationLoggingServices>>();
		inputs.idService.gen.mockReturnValue('log-id');
		const service = moderationLoggingServices.create(inputs).ModerationLogService;
		const info = { userId: 'user', userUsername: 'name', userHost: null };
		await service.log({ id: 'moderator' }, 'resetPassword', info);
		expect(inputs.moderationLogsRepository.insert).toHaveBeenCalledWith({ id: 'log-id', userId: 'moderator', type: 'resetPassword', info });
	});

	test('registry writes retain insert/update decisions and main-stream event arguments', async () => {
		const inputs = mockDeep<Inputs<typeof preferencesServices>>();
		const query = mockDeep<SelectQueryBuilder<MiRegistryItem>>();
		query.where.mockReturnValue(query);
		query.andWhere.mockReturnValue(query);
		inputs.registryItemsRepository.createQueryBuilder.mockReturnValue(query);
		inputs.idService.gen.mockReturnValue('item-id');
		query.getOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockDeep<MiRegistryItem>({ id: 'existing-id' }));
		const registry = preferencesServices.create(inputs).RegistryApiService;
		await registry.set('user', null, ['settings'], 'key', { enabled: true });
		expect(inputs.registryItemsRepository.insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-id', userId: 'user', domain: null, scope: ['settings'], key: 'key', value: { enabled: true } }));
		expect(inputs.globalEventService.publishMainStream).toHaveBeenCalledWith('user', 'registryUpdated', { scope: ['settings'], key: 'key', value: { enabled: true } });
		await registry.set('user', 'example.com', ['settings'], 'key', false);
		expect(inputs.registryItemsRepository.update).toHaveBeenCalledWith('existing-id', expect.objectContaining({ value: false }));
		expect(inputs.globalEventService.publishMainStream).toHaveBeenCalledTimes(1);
	});
});
