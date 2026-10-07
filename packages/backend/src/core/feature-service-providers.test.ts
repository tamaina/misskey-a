/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import type { FactoryProvider, InjectionToken, Provider } from '@nestjs/common';
import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { SelectQueryBuilder } from 'typeorm';
import type { MiAnnouncement, MiClip, MiFlash, MiFlashLike, MiGalleryLike, MiGalleryPost, MiNoteFavorite, MiPage, MiPageLike } from '@/models/_.js';
import type { MiLocalUser } from '../../../features/users/backend/models/User.js';
import type { Packed } from '../../../features/index/contract/packed.js';
import { createAnnouncementServices } from '../../../features/announcements/backend/services.js';
import type { AnnouncementServicesDependencies } from '../../../features/announcements/backend/services.js';
import { ClipService } from '../../../features/collections/backend/services/ClipService.js';
import { createCollectionServices } from '../../../features/collections/backend/services.js';
import type { CollectionServicesDependencies } from '../../../features/collections/backend/services.js';
import { createGalleryServices } from '../../../features/gallery/backend/services.js';
import type { GalleryServicesDependencies } from '../../../features/gallery/backend/services.js';
import { createPageServices } from '../../../features/pages/backend/services.js';
import type { PageServicesDependencies } from '../../../features/pages/backend/services.js';
import { createPlayServices } from '../../../features/play/backend/services.js';
import type { PlayServicesDependencies } from '../../../features/play/backend/services.js';
import { CoreModule } from './CoreModule.js';
import { featureServiceExports, featureServiceGroups, featureServiceProviders } from './feature-service-providers.js';

const date = new Date('2026-01-02T03:04:05.000Z');
const factoryProviders = featureServiceProviders.filter((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
const classProviders = featureServiceProviders.filter((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'function');

function providerToken(provider: Provider): InjectionToken {
	return typeof provider === 'function' ? provider : provider.provide;
}

describe('feature service composition adapter', () => {
	test('the complete pre-migration provider/export contract and every alias target are preserved', () => {
		const baseline = JSON.parse(readFileSync(new URL('../../test/fixtures/core-provider-contract.json', import.meta.url), 'utf8')) as {
			providers: string[]; exports: string[]; aliases: { name: string; target: string }[];
		};
		const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, CoreModule) as Provider[];
		const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, CoreModule) as (Provider | InjectionToken)[];
		const describeToken = (entry: Provider | InjectionToken): string => {
			const token = typeof entry === 'object' ? entry.provide : entry;
			return typeof token === 'function' ? `class:${token.name}` : `alias:${String(token)}`;
		};
		const publicProviders = providers.filter(provider => typeof providerToken(provider) !== 'symbol');
		expect(publicProviders.map(describeToken).sort()).toEqual([...baseline.providers].sort());
		expect(exports.map(describeToken).sort()).toEqual([...baseline.exports].sort());
		const aliases = publicProviders.filter((provider): provider is import('@nestjs/common').ExistingProvider => typeof provider === 'object' && 'useExisting' in provider)
			.map(provider => ({ name: String(provider.provide), target: (provider.useExisting as { name: string }).name }));
		expect(aliases.sort((left, right) => left.name.localeCompare(right.name))).toEqual([...baseline.aliases].sort((left, right) => left.name.localeCompare(right.name)));
		const migratedTokens = new Set(featureServiceProviders.filter(provider => typeof providerToken(provider) !== 'symbol').map(describeToken));
		expect(publicProviders.map(describeToken).filter(token => !migratedTokens.has(token))).toEqual(baseline.providers.filter(token => !migratedTokens.has(token)));
		expect(exports.map(describeToken).filter(token => !migratedTokens.has(token))).toEqual(baseline.exports.filter(token => !migratedTokens.has(token)));
	});

	test('CoreModule installs and exports every canonical service and compatibility alias once', () => {
		const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, CoreModule) as Provider[];
		const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, CoreModule) as (Provider | InjectionToken)[];
		expect(factoryProviders).toHaveLength(18);
		expect(classProviders).toHaveLength(37);
		expect(featureServiceExports).toHaveLength(73);
		for (const provider of featureServiceProviders) {
			expect(providers.filter(candidate => providerToken(candidate) === providerToken(provider))).toEqual([provider]);
		}
		for (const token of featureServiceExports) {
			expect(exports.filter(candidate => candidate === token)).toEqual([token]);
		}
	});

	test('real Nest resolution shares one feature graph across class tokens, string aliases, and consumers', async () => {
		const internalTokens = new Set(featureServiceProviders.map(providerToken));
		const externalTokens = new Set((factoryProviders.flatMap(provider => provider.inject ?? []) as InjectionToken[]).filter(token => !internalTokens.has(token)));
		const createSpies = factoryProviders.map(provider => vi.spyOn(provider, 'useFactory'));
		const module = await Test.createTestingModule({
			providers: [
				...[...externalTokens].map(provide => ({ provide, useValue: {} })),
				...featureServiceProviders,
				{ provide: 'feature service consumer', inject: featureServiceExports, useFactory: (...services: object[]) => services },
			],
		}).compile();
		try {
			await module.init();
			for (const provider of classProviders) {
				const service = module.get(provider.provide);
				const feature = module.get(provider.inject?.[0] as symbol) as Record<string, object>;
				const name = (provider.provide as { name: string }).name;
				expect(service).toBeInstanceOf(provider.provide);
				expect(module.get(name)).toBe(service);
				expect(feature[name]).toBe(service);
				expect(Object.values(service).every(dependency => dependency !== undefined)).toBe(true);
				expect(Reflect.getMetadata('design:paramtypes', provider.provide)).toBeUndefined();
			}
			for (const [index, token] of featureServiceExports.entries()) {
				expect(module.get<object[]>('feature service consumer')[index]).toBe(module.get(token));
			}
			for (const spy of createSpies) expect(spy).toHaveBeenCalledTimes(1);
		} finally {
			await module.close();
		}
	});

	test('selective local factory groups preserve strict ModuleRef aliases with complete dependencies', async () => {
		const selectedProviders = [...featureServiceGroups.announcements.providers, ...featureServiceGroups.pages.providers, ...featureServiceGroups.emojis.providers];
		const selectedFactories = selectedProviders.filter((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
		const dependencies = new Set(selectedFactories.flatMap(provider => provider.inject ?? []) as InjectionToken[]);
		const createSpies = selectedFactories.map(provider => vi.spyOn(provider, 'useFactory'));
		const module = await Test.createTestingModule({
			providers: [
				...[...dependencies].map(provide => ({ provide, useValue: {} })),
				...selectedProviders,
				{ provide: 'strict local resolver', inject: [ModuleRef], useFactory: (moduleRef: ModuleRef) => moduleRef },
			],
		}).compile();
		try {
			await module.init();
			const resolver = module.get<ModuleRef>('strict local resolver');
			for (const name of ['AnnouncementService', 'PageEntityService', 'EmojiEntityService']) {
				const provider = selectedProviders.find(candidate => typeof candidate === 'object' && typeof candidate.provide === 'function' && candidate.provide.name === name) as FactoryProvider;
				expect(resolver.get(name)).toBe(module.get(provider.provide));
			}
			for (const spy of createSpies) {
				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy.mock.calls[0]).toHaveLength(spy.mock.calls[0].filter(value => value !== undefined).length);
			}
		} finally {
			await module.close();
		}
	});

	test('feature factories and implementations have no Nest injection or lifecycle ownership', () => {
		const groups = {
			announcements: ['serializers/AnnouncementEntityService', 'services/AnnouncementService'],
			collections: ['serializers/ClipEntityService', 'serializers/NoteFavoriteEntityService', 'services/ClipService'],
			gallery: ['serializers/GalleryPostEntityService', 'serializers/GalleryLikeEntityService'],
			pages: ['serializers/PageEntityService', 'serializers/PageLikeEntityService', 'services/PageService'],
			play: ['serializers/FlashEntityService', 'serializers/FlashLikeEntityService', 'services/FlashService'],
			auth: ['serializers/AppEntityService', 'serializers/AuthSessionEntityService', 'serializers/InviteCodeEntityService', 'serializers/SigninEntityService'],
			channels: ['serializers/ChannelEntityService'],
			chat: ['serializers/ChatEntityService'],
			discovery: ['serializers/HashtagEntityService'],
			drive: ['serializers/DriveFolderEntityService'],
			emojis: ['serializers/EmojiEntityService'],
			games: ['serializers/ReversiGameEntityService'],
			instance: ['serializers/InstanceEntityService', 'serializers/MetaEntityService'],
			integrations: ['serializers/SystemWebhookEntityService'],
			moderation: ['serializers/AbuseReportNotificationRecipientEntityService', 'serializers/AbuseUserReportEntityService', 'serializers/ModerationLogEntityService'],
			relationships: ['serializers/BlockingEntityService', 'serializers/FollowRequestEntityService', 'serializers/FollowingEntityService', 'serializers/MutingEntityService', 'serializers/RenoteMutingEntityService', 'serializers/UserListEntityService'],
			roles: ['serializers/RoleEntityService'],
			timelines: ['serializers/AntennaEntityService'],
		};
		for (const [feature, paths] of Object.entries(groups)) {
			for (const path of ['services', ...paths]) {
				const source = readFileSync(new URL(`../../../features/${feature}/backend/${path}.ts`, import.meta.url), 'utf8');
				expect(source).not.toMatch(/@nestjs|@Inject\(|@Injectable\(|ModuleRef|onModuleInit|onApplicationBootstrap|onModuleDestroy|onApplicationShutdown/);
			}
		}
	});
});

describe('annotation-free feature services preserve behavior', () => {
	test('announcement writes use the composed serializer and preserve broadcast payloads and logs', async () => {
		const deps = mockDeep<AnnouncementServicesDependencies>();
		deps.idService.gen.mockReturnValue('announcement');
		deps.idService.parse.mockReturnValue({ date });
		const announcement = mockDeep<MiAnnouncement>({
			id: 'announcement', updatedAt: null, title: 'Title', text: 'Text', imageUrl: null,
			icon: 'info', display: 'normal', userId: null, needConfirmationToRead: false, silence: false,
		});
		deps.announcementsRepository.insertOne.mockResolvedValue(announcement);
		const services = createAnnouncementServices(deps);
		const pack = vi.spyOn(services.AnnouncementEntityService, 'pack');
		const moderator = mockDeep<MiLocalUser>({ id: 'moderator' });
		const create = services.AnnouncementService.create;
		const result = await create({ title: 'Title', text: 'Text', imageUrl: '' }, moderator);
		expect(deps.announcementsRepository.insertOne).toHaveBeenCalledWith(expect.objectContaining({ id: 'announcement', imageUrl: null, updatedAt: null }));
		expect(pack).toHaveBeenCalledWith(announcement);
		expect(result.packed).toMatchObject({ id: 'announcement', createdAt: date.toISOString(), forYou: false });
		expect(deps.globalEventService.publishBroadcastStream).toHaveBeenCalledWith('announcementCreated', { announcement: result.packed });
		expect(deps.moderationLogService.log).toHaveBeenCalledWith(moderator, 'createGlobalAnnouncement', { announcementId: 'announcement', announcement });
	});

	test('announcement privacy checks happen before packing and per-user read checks remain bound', async () => {
		const deps = mockDeep<AnnouncementServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		const announcement = mockDeep<MiAnnouncement>({ id: 'private', updatedAt: null, userId: 'owner' });
		deps.announcementsRepository.findOneByOrFail.mockResolvedValue(announcement);
		deps.announcementReadsRepository.countBy.mockResolvedValue(1);
		const services = createAnnouncementServices(deps);
		const get = services.AnnouncementService.getAnnouncement;
		await expect(get('private', mockDeep<MiLocalUser>({ id: 'other' }))).rejects.toMatchObject({ name: 'EntityNotFoundError' });
		expect(deps.announcementReadsRepository.findOneBy).not.toHaveBeenCalled();
		const pack = services.AnnouncementEntityService.pack;
		const packed = await pack({ ...announcement, isRead: undefined }, { id: 'owner' });
		expect(packed).toMatchObject({ forYou: true, isRead: true });
		expect(deps.announcementReadsRepository.countBy).toHaveBeenCalledWith({ announcementId: 'private', userId: 'owner' });
	});

	test('collection services keep policy limits, owned deletion, and note serialization', async () => {
		const deps = mockDeep<CollectionServicesDependencies>();
		deps.idService.gen.mockReturnValue('clip');
		deps.idService.parse.mockReturnValue({ date });
		deps.clipsRepository.countBy.mockResolvedValue(1);
		deps.roleService.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<CollectionServicesDependencies['roleService']['getUserPolicies']>>>({ clipLimit: 1 }));
		const services = createCollectionServices(deps);
		const actor = mockDeep<MiLocalUser>({ id: 'owner' });
		await expect(services.ClipService.create(actor, 'name', false, null)).rejects.toBeInstanceOf(ClipService.TooManyClipsError);
		expect(deps.clipsRepository.insertOne).not.toHaveBeenCalled();
		const clip = mockDeep<MiClip>({ id: 'clip', userId: 'owner' });
		deps.clipsRepository.findOneBy.mockResolvedValue(clip);
		const deleteClip = services.ClipService.delete;
		await deleteClip(actor, 'clip');
		expect(deps.clipsRepository.findOneBy).toHaveBeenCalledWith({ id: 'clip', userId: 'owner' });
		expect(deps.clipsRepository.delete).toHaveBeenCalledWith('clip');
		const note = mockDeep<Packed<'Note'>>({ id: 'note' });
		deps.noteEntityService.pack.mockResolvedValue(note);
		const favorite = await services.NoteFavoriteEntityService.pack(mockDeep<MiNoteFavorite>({ id: 'favorite', noteId: 'note', note: null }), actor);
		expect(favorite).toEqual({ id: 'favorite', createdAt: date.toISOString(), noteId: 'note', note });
		expect(deps.noteEntityService.pack).toHaveBeenCalledWith('note', actor);
	});

	test('gallery likes reuse the composed post serializer, viewer hints, and file packing', async () => {
		const deps = mockDeep<GalleryServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.galleryLikesRepository.exists.mockResolvedValue(true);
		deps.driveFileEntityService.packManyByIds.mockResolvedValue([]);
		deps.userEntityService.pack.mockResolvedValue(mockDeep<Packed<'UserLite'>>({ id: 'author' }));
		const post: MiGalleryPost = {
			id: 'post', updatedAt: date, userId: 'author', user: null, title: 'Title',
			description: 'Description', fileIds: ['file'], tags: [], isSensitive: false, likedCount: 2,
		};
		deps.galleryPostsRepository.findOneByOrFail.mockResolvedValue(post);
		const services = createGalleryServices(deps);
		const pack = vi.spyOn(services.GalleryPostEntityService, 'pack');
		const actor = { id: 'viewer' };
		const like = await services.GalleryLikeEntityService.pack({ id: 'like', post: null, postId: 'post' } as MiGalleryLike, actor);
		expect(pack).toHaveBeenCalledWith('post', actor);
		expect(like).toMatchObject({ id: 'like', post: { id: 'post', createdAt: date.toISOString(), isLiked: true, files: [] } });
		expect(deps.galleryLikesRepository.exists).toHaveBeenCalledWith({ where: { postId: 'post', userId: 'viewer' } });
		expect(deps.driveFileEntityService.packManyByIds).toHaveBeenCalledWith(['file']);
	});

	test('pages retain legacy content migration and delegate likes to the same serializer', async () => {
		const deps = mockDeep<PageServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.pack.mockResolvedValue(mockDeep<Packed<'UserLite'>>({ id: 'author' }));
		deps.driveFileEntityService.packMany.mockResolvedValue([]);
		deps.pageLikesRepository.exists.mockResolvedValue(false);
		const page: MiPage = {
			id: 'page', updatedAt: date, userId: 'author', user: null,
			content: [{ type: 'section', children: [{ type: 'input', inputType: 'number', default: '12' }] }],
			eyeCatchingImageId: null, eyeCatchingImage: null, title: 'Title', name: 'page', summary: null,
			alignCenter: false, hideTitleWhenPinned: false, font: 'sans-serif', variables: [], script: '',
			visibility: 'public', visibleUserIds: [], likedCount: 0,
		};
		deps.pagesRepository.findOneByOrFail.mockResolvedValue(page);
		const services = createPageServices(deps);
		const pack = vi.spyOn(services.PageEntityService, 'pack');
		const like = await services.PageLikeEntityService.pack({ id: 'like', page: null, pageId: 'page' } as MiPageLike, { id: 'viewer' });
		expect(pack).toHaveBeenCalledWith('page', { id: 'viewer' });
		expect(like.page.content).toEqual([{ type: 'section', children: [{ type: 'numberInput', inputType: 'number', default: 12 }] }]);
		expect(deps.pagesRepository.update).toHaveBeenCalledWith('page', { content: page.content });
		expect(deps.pageLikesRepository.exists).toHaveBeenCalledWith({ where: { pageId: 'page', userId: 'viewer' } });
		expect(services.PageService.collectReferencedNotes([{ type: 'note', note: 'one' }, { type: 'section', children: [{ type: 'note', note: 'one' }, { type: 'note', note: 'two' }] }])).toEqual(['one', 'two']);
	});

	test('play composes liked-flash packing and keeps featured query defaults', async () => {
		const deps = mockDeep<PlayServicesDependencies>();
		deps.idService.parse.mockReturnValue({ date });
		deps.userEntityService.pack.mockResolvedValue(mockDeep<Packed<'UserLite'>>({ id: 'author' }));
		deps.flashLikesRepository.exists.mockResolvedValue(true);
		const flash = mockDeep<MiFlash>({ id: 'flash', updatedAt: date, userId: 'author', user: null, title: 'Title', summary: 'Summary', script: 'script', visibility: 'public', likedCount: 1 });
		deps.flashsRepository.findOneByOrFail.mockResolvedValue(flash);
		const services = createPlayServices(deps);
		const pack = vi.spyOn(services.FlashEntityService, 'pack');
		const like = await services.FlashLikeEntityService.pack({ id: 'like', flash: null, flashId: 'flash' } as MiFlashLike, { id: 'viewer' });
		expect(pack).toHaveBeenCalledWith('flash', { id: 'viewer' });
		expect(like.flash).toMatchObject({ id: 'flash', isLiked: true, createdAt: date.toISOString() });
		const builder = mockDeep<SelectQueryBuilder<MiFlash>>();
		builder.andWhere.mockReturnValue(builder);
		builder.addOrderBy.mockReturnValue(builder);
		builder.getMany.mockResolvedValue([flash]);
		deps.flashsRepository.createQueryBuilder.mockReturnValue(builder);
		expect(await services.FlashService.featured()).toEqual([flash]);
		expect(builder.andWhere).toHaveBeenCalledWith('flash.visibility = :visibility', { visibility: 'public' });
		expect(builder.take).toHaveBeenCalledWith(10);
		expect(builder.skip).not.toHaveBeenCalled();
		await services.FlashService.featured({ offset: 2, limit: 5 });
		expect(builder.skip).toHaveBeenCalledWith(2);
		expect(builder.take).toHaveBeenCalledWith(5);
	});
});
