/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { DI } from '@/di-symbols.js';
import { authSecurityServices, authServices } from '@features/auth/backend/services.js';
import { channelServices } from '@features/channels/backend/services.js';
import { discoveryServices, rankingServices, userSearchServices } from '@features/discovery/backend/services.js';
import { integrationServices } from '@features/integrations/backend/services.js';
import { timelineServices } from '@features/timelines/backend/services.js';
import { gameServices } from '@features/games/backend/services.js';
import { driveServices } from '@features/drive/backend/services.js';
import { relationshipServices } from '@features/relationships/backend/services.js';
import { announcementServices } from '@features/announcements/backend/services.js';
import { instanceServices } from '@features/instance/backend/services.js';
import { chatServices } from '@features/chat/backend/services.js';
import { playServices } from '@features/play/backend/services.js';
import { moderationLoggingServices, moderationServices } from '@features/moderation/backend/services.js';
import { collectionServices } from '@features/collections/backend/services.js';
import { roleServices } from '@features/roles/backend/services.js';
import { emojiServices } from '@features/emojis/backend/services.js';
import { galleryServices } from '@features/collections/backend/services/gallery.js';
import { pageFactoryProviders } from '@features/pages/backend/services.js';
import { PageEntityService } from '@features/pages/backend/serializers/PageEntityService.js';
import { mediaServices } from '@features/drive/backend/services/media.js';
import { markupServices } from '@features/markup/backend/services.js';
import { preferencesServices } from '@features/preferences/backend/services.js';
import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';
import { SystemWebhookEntityService } from '@features/integrations/backend/serializers/SystemWebhookEntityService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { toNestProviders } from '@features/index/backend/feature-service-provider-types.js';
import { featureServiceGroups } from '@features/index/backend/feature-service-providers.js';
import type { FactoryProvider, Provider } from '@nestjs/common';
import type { Inputs, ServiceDefinition } from '@features/index/backend/service-definitions.js';

const date = new Date('2026-01-02T03:04:05.000Z');
const tokenOf = (provider: Provider) => typeof provider === 'function' ? provider : provider.provide;
const selectedGroups = [featureServiceGroups.auth, featureServiceGroups.channels, featureServiceGroups.discovery];
const featureServiceProviders = selectedGroups.flatMap(group => group.providers);
const featureServiceExports = selectedGroups.flatMap(group => group.exports);

describe('typed feature declaration proof', () => {
	test('repository bridge preserves original DI symbols without loading service implementations', () => {
		for (const name of ['appsRepository', 'accessTokensRepository', 'authSessionsRepository', 'channelsRepository', 'notesRepository'] as const) {
			expect(ports[name].token).toBe(DI[name]);
		}
		const source = readFileSync(new URL('../../../features/index/backend/service-ports.ts', import.meta.url), 'utf8');
		expect(source.match(/^import \{.*\}/gm)).toEqual(['import { DI }']);
	});

	test('every declared constructor ref preserves the published factory argument order and identity', () => {
		const baseline = JSON.parse(readFileSync(new URL('../../test/fixtures/feature-constructor-wiring.json', import.meta.url), 'utf8')) as {
			features: Record<string, Record<string, ({ port: string } | { service: string })[]>>;
		};
		for (const [name, feature] of [['auth', authServices], ['authSecurity', authSecurityServices], ['integrations', integrationServices], ['channels', channelServices], ['timelines', timelineServices], ['games', gameServices], ['drive', driveServices], ['relationships', relationshipServices], ['discovery', discoveryServices], ['userSearch', userSearchServices], ['ranking', rankingServices], ['announcements', announcementServices], ['instance', instanceServices], ['chat', chatServices], ['play', playServices], ['moderation', moderationServices], ['moderationLogging', moderationLoggingServices], ['collections', collectionServices], ['roles', roleServices], ['emojis', emojiServices], ['collectionGallery', galleryServices], ['driveMedia', mediaServices], ['markup', markupServices], ['preferences', preferencesServices]] as const) {
			const entries: [string, ServiceDefinition][] = Object.entries(feature.definitions);
			for (const [key, definition] of entries) {
				const expected = baseline.features[name][key];
				expect(expected).toBeDefined();
				const actual = definition.dependencies.map(dependency => {
					if (dependency.kind === 'port') {
						if (dependency.name in DI) expect(dependency.token).toBe(DI[dependency.name as keyof typeof DI]);
						return { port: dependency.name };
					}
					const local = entries.find(([, candidate]) => candidate === dependency);
					expect(local).toBeDefined();
					if (!local) throw new Error('Missing published local definition');
					return { service: local[0] };
				});
				expect(actual).toEqual(expected);
			}
		}
	});

	test('Nest translates all typed external service ports to the original class targets', () => {
		const targets = { httpRequestService: HttpRequestService, loggerService: LoggerService, idService: IdService, globalEventService: GlobalEventService, moderationLogService: ModerationLogService, userEntityService: UserEntityService, noteEntityService: NoteEntityService, roleService: RoleService, driveFileEntityService: DriveFileEntityService, queryService: QueryService, utilityService: UtilityService, systemAccountService: SystemAccountService, systemWebhookEntityService: SystemWebhookEntityService };
		for (const [name, feature] of [['auth', authServices], ['authSecurity', authSecurityServices], ['integrations', integrationServices], ['channels', channelServices], ['timelines', timelineServices], ['games', gameServices], ['drive', driveServices], ['relationships', relationshipServices], ['discovery', discoveryServices], ['userSearch', userSearchServices], ['ranking', rankingServices], ['announcements', announcementServices], ['instance', instanceServices], ['chat', chatServices], ['play', playServices], ['moderation', moderationServices], ['moderationLogging', moderationLoggingServices], ['collections', collectionServices], ['roles', roleServices], ['emojis', emojiServices], ['collectionGallery', galleryServices], ['driveMedia', mediaServices], ['markup', markupServices], ['preferences', preferencesServices]] as const) {
			const factory = featureServiceGroups[name].providers.find((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
			expect(factory?.inject).toEqual(feature.ports.map(port => port.name in targets ? targets[port.name as keyof typeof targets] : port.name === 'redisClient' ? DI.redis : DI[port.name as keyof typeof DI]));
		}
	});

	test('ordinary Page factories preserve the published constructor argument order', () => {
		const baseline = JSON.parse(readFileSync(new URL('../../test/fixtures/feature-constructor-wiring.json', import.meta.url), 'utf8')) as {
			features: Record<string, Record<string, ({ port: string } | { service: string })[]>>;
		};
		const tokens = {
			db: DI.db, pagesRepository: DI.pagesRepository, pageLikesRepository: DI.pageLikesRepository,
			driveFilesRepository: DI.driveFilesRepository, notesRepository: DI.notesRepository, usersRepository: DI.usersRepository,
			userEntityService: UserEntityService, driveFileEntityService: DriveFileEntityService,
			idService: IdService, roleService: RoleService, moderationLogService: ModerationLogService,
		};
		for (const provider of pageFactoryProviders) {
			const constructor = provider.provide;
			if (typeof constructor !== 'function') throw new Error('Missing Page constructor');
			const expected = baseline.features.pages[constructor.name].map(dependency => {
				if ('service' in dependency) return PageEntityService;
				const entry = Object.entries(tokens).find(([name]) => name === dependency.port);
				if (!entry) throw new Error(`Missing Page dependency ${dependency.port}`);
				return entry[1];
			});
			expect(provider.inject).toEqual(expected);
		}
	});

	test('auth shares its local App instance and preserves fresh plain-factory graphs', async () => {
		const deps = mockDeep<Inputs<typeof authServices>>();
		deps.idService.parse.mockReturnValue({ date });
		const first = authServices.create(deps);
		const second = authServices.create(deps);
		expect(Reflect.get(first.AuthSessionEntityService, 'appEntityService')).toBe(first.AppEntityService);
		expect(second.AppEntityService).not.toBe(first.AppEntityService);
		expect(second.AuthSessionEntityService).not.toBe(first.AuthSessionEntityService);
		const pack = first.SigninEntityService.pack;
		expect(await pack({ id: 'id', userId: 'user', user: null, ip: 'ip', headers: {}, success: true })).toMatchObject({ id: 'id', createdAt: date.toISOString(), success: true });
	});

	test('channels declares all nine constructor ports and zero-port create remains callable without inputs', () => {
		const deps = mockDeep<Inputs<typeof channelServices>>();
		const result = channelServices.create(deps).ChannelEntityService;
		expect(channelServices.ports).toHaveLength(9);
		for (const port of channelServices.ports) expect(Reflect.get(result, port.name)).toBe(deps[port.name as keyof Inputs<typeof channelServices>]);
		expect(discoveryServices.create().HashtagEntityService).not.toBe(discoveryServices.create().HashtagEntityService);
	});

	test('Nest singleton, stable aliases, consumers and strict ModuleRef match legacy contracts', async () => {
		const definitions = [...Object.entries(authServices.definitions), ...Object.entries(channelServices.definitions), ...Object.entries(discoveryServices.definitions)];
		const factories = featureServiceProviders.filter((provider): provider is FactoryProvider => typeof provider === 'object' && 'useFactory' in provider && typeof provider.provide === 'symbol');
		const internalTokens = new Set(featureServiceProviders.map(tokenOf));
		const injectedTokens = factories.flatMap(provider => provider.inject ?? []).map(token => typeof token === 'object' ? token.token : token);
		const externalTokens = new Set(injectedTokens.filter(token => !internalTokens.has(token)));
		const spies = factories.map(provider => vi.spyOn(provider, 'useFactory'));
		const module = await Test.createTestingModule({ providers: [
			...[...externalTokens].map(provide => ({ provide, useValue: {} })),
			...featureServiceProviders,
			{ provide: 'consumer', inject: featureServiceExports, useFactory: (...values: object[]) => values },
			{ provide: 'resolver', inject: [ModuleRef], useFactory: (ref: ModuleRef) => ref },
		] }).compile();
		try {
			await module.init();
			const resolver = module.get<ModuleRef>('resolver');
			for (const [key, definition] of definitions) {
				const instance = module.get(definition.ctor);
				expect(instance).toBeInstanceOf(definition.ctor);
				expect(module.get(key)).toBe(instance);
				expect(resolver.get(key)).toBe(instance);
				expect(Reflect.getMetadata('design:paramtypes', definition.ctor)).toBeUndefined();
			}
			for (const [index, token] of featureServiceExports.entries()) expect(module.get<object[]>('consumer')[index]).toBe(module.get(token));
			for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
			const app = module.get('AppEntityService');
			expect(Reflect.get(module.get('AuthSessionEntityService'), 'appEntityService')).toBe(app);
			expect(module.get('HashtagEntityService')).toBeInstanceOf(discoveryServices.create().HashtagEntityService.constructor);
		} finally { await module.close(); }
		const baseline = JSON.parse(readFileSync(new URL('../../test/fixtures/core-provider-contract.json', import.meta.url), 'utf8')) as { providers: string[]; exports: string[]; aliases: { name: string; target: string }[] };
		const keys = new Set(featureServiceExports.filter((token): token is string => typeof token === 'string'));
		const labels = featureServiceProviders.filter(provider => typeof tokenOf(provider) !== 'symbol').map(provider => {
			const token = tokenOf(provider);
			return typeof token === 'string' ? `alias:${token}` : `class:${(token as { name: string }).name}`;
		});
		expect(labels.sort()).toEqual(baseline.providers.filter(label => keys.has(label.replace(/^(class|alias):/, ''))).sort());
		expect(featureServiceExports.map(token => typeof token === 'string' ? `alias:${token}` : `class:${token.name}`).sort()).toEqual(baseline.exports.filter(label => keys.has(label.replace(/^(class|alias):/, ''))).sort());
		const aliases = featureServiceProviders.filter((provider): provider is import('@nestjs/common').ExistingProvider => typeof provider === 'object' && 'useExisting' in provider).map(provider => ({ name: String(provider.provide), target: provider.useExisting.name }));
		expect(aliases.sort((a, b) => a.name.localeCompare(b.name))).toEqual(baseline.aliases.filter(alias => keys.has(alias.name)).sort((a, b) => a.name.localeCompare(b.name)));
	});

	test('compatibility aliases use explicit keys even when the implementation class has a different name', async () => {
		class ImplementationName {}
		const group = toNestProviders('explicit alias', defineServices({ StablePublicAlias: service(ImplementationName, []) }));
		const module = await Test.createTestingModule({ providers: group.providers }).compile();
		try {
			expect(module.get('StablePublicAlias')).toBe(module.get(ImplementationName));
			expect(() => module.get('ImplementationName')).toThrow();
		} finally { await module.close(); }
	});

	test('cycles and foreign local definitions fail before constructors run', () => {
		let calls = 0;
		class First { constructor(_other?: object) { calls++; } }
		class Second { constructor(_other?: object) { calls++; } }
		// Deliberately forged cyclic descriptors are rejected before construction.
		const first = { ...service(First, []), dependencies: [] as ServiceDefinition[] };
		const second = { ...service(Second, []), dependencies: [first] as ServiceDefinition[] };
		first.dependencies.push(second);
		Object.freeze(first.dependencies);
		Object.freeze(second.dependencies);
		Object.freeze(first);
		Object.freeze(second);
		expect(() => Reflect.apply(defineServices, undefined, [{ first, second }])).toThrow('Unregistered');
		expect(calls).toBe(0);
		const external = service(First, []);
		const consumer = service(Second, [external]);
		expect(() => defineServices({ consumer })).toThrow('outside');
		expect(calls).toBe(0);
	});

	test('mutable descriptor spreads cannot change validated local edges', () => {
		class Local {}
		class Consumer { constructor(readonly local: Local) {} }
		const local = service(Local, []);
		const dependencies: [typeof local] = [local];
		const mutable = { ...service(Consumer, [local]), dependencies };
		expect(() => defineServices({ Consumer: mutable, Local: local })).toThrow('Unregistered');
		Object.freeze(dependencies);
		Object.freeze(mutable);
		expect(() => defineServices({ Consumer: mutable, Local: local })).toThrow('Unregistered');
	});

	test('duplicate constructors fail before plain or Nest composition can diverge', () => {
		let calls = 0;
		class Shared { constructor() { calls++; } }
		const definitions = { First: service(Shared, []), Second: service(Shared, []) };
		expect(() => defineServices(definitions).create()).toThrow('Duplicate');
		expect(() => toNestProviders('duplicate', defineServices(definitions))).toThrow('Duplicate');
		expect(calls).toBe(0);
	});

	test('plain and Nest construction use the same immutable definition snapshot', async () => {
		class Original {}
		class Replacement {}
		const definitions = { Stable: service(Original, []) };
		const feature = defineServices(definitions);
		definitions.Stable = service(Replacement, []);
		expect(feature.definitions.Stable.ctor).toBe(Original);
		expect(feature.create().Stable).toBeInstanceOf(Original);
		const module = await Test.createTestingModule({ providers: toNestProviders('snapshot', feature).providers }).compile();
		try {
			expect(module.get('Stable')).toBeInstanceOf(Original);
			expect(module.get('Stable')).toBe(module.get(Original));
		} finally { await module.close(); }
	});

	test('selected DB-test groups resolve class-only mocks and retain the real IdService', async () => {
		const selected = [...featureServiceGroups.announcements.providers, ...featureServiceGroups.pages.providers, ...featureServiceGroups.emojis.providers];
		const module = await Test.createTestingModule({ providers: [
			{ provide: DI.config, useValue: { id: 'aidx' } }, IdService,
			...[DI.announcementsRepository, DI.announcementReadsRepository, DI.usersRepository, DI.pagesRepository, DI.pageLikesRepository, DI.driveFilesRepository, DI.db, DI.notesRepository, DI.emojisRepository, DI.rolesRepository].map(provide => ({ provide, useValue: {} })),
			...selected,
		] }).useMocker(token => typeof token === 'function' ? mockDeep() : undefined).compile();
		try {
			const id = module.get(IdService);
			expect(id).toBeInstanceOf(IdService);
			expect(id.parse(id.gen(date.getTime())).date).toEqual(date);
			expect(Reflect.get(module.get('AnnouncementService'), 'idService')).toBe(id);
			expect(Reflect.get(module.get('PageService'), 'idService')).toBe(id);
			expect(Reflect.get(module.get('PageEntityService'), 'idService')).toBe(id);
			expect(module.get<ModuleRef>(ModuleRef).get('AnnouncementService')).toBe(module.get('AnnouncementService'));
		} finally { await module.close(); }
	});

	test('missing plain-object ports fail before constructing a feature', () => {
		expect(() => Reflect.apply(authServices.create, undefined, [{}])).toThrow('Missing port');
	});
});
