/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedJsonObject } from '../../../users/backend/json-value.schema.js';
import { expect, test, vi } from 'vitest';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { misskeyErrorBody } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import type { Config } from '@/config.js';
import { endpointContract } from '../../backend/endpoints/endpoint.contract.js';
import { serverInfoContract } from '../../backend/endpoints/server-info.contract.js';
import { pingContract } from '../../backend/endpoints/ping.contract.js';
import { onlineUsersCountContract } from '../../backend/endpoints/get-online-users-count.contract.js';
import { adminServerInfoContract } from '../../backend/endpoints/admin/server-info.contract.js';

import { adminMetaContract } from '../../backend/endpoints/admin/meta.contract.js';
import { metaContract } from '../../backend/endpoints/meta.contract.js';
import { createMetaProcedure } from '../../backend/endpoints/meta.js';

import { MiMeta } from '../../backend/models/Meta.js';
import { MetaEntityService } from '../../backend/serializers/MetaEntityService.js';
import { createInstanceRouter } from '../../backend/api.implementation.js';
import type { InstanceApiDependencies } from '../../backend/api.implementation.js';
import { call, createProcedureClient, createRouterClient } from '@orpc/server';
import { testContext } from './native-context.js';
import { createServerInfoRouter, createEndpointProcedure, createPingProcedure, createOnlineUsersCountProcedure } from '../../backend/index.js';
import { DEFAULT_POLICIES } from '../../../roles/backend/services/RoleService.js';
import type { MetaService } from '../../backend/services/MetaService.js';
import type { AdsRepository } from '../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { SystemAccountService } from '../../../users/backend/services/SystemAccountService.js';
import type { IdService } from '../../../runtime/backend/services/IdService.js';
import type { ModerationLogService } from '../../../moderation/backend/services/ModerationLogService.js';
import type { MiAd } from '../../backend/models/Ad.js';

vi.mock('../../../statistics/backend/runtime-dependencies/systeminformation.js', () => ({
	loadSystemInformation: async () => ({ mem: async () => ({ total: 1024 }), fsSize: async () => [{ size: 512, used: 64 }], networkInterfaceDefault: async () => 'eth0' }),
}));

// The database entity fixture is explicit; response schemas do not construct producer fixtures.
import { packedSchemas } from '../../../index/backend/packed.schema.js';
import type { Redis } from 'ioredis';
import type { DataSource, SelectQueryBuilder } from 'typeorm';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const endpointResult = requiredSchema(endpointContract['~orpc'].outputSchema);
const pingResult = requiredSchema(pingContract['~orpc'].outputSchema);

function operations(overrides: Partial<InstanceApiDependencies>) {
	return createRouterClient(createInstanceRouter<MiLocalUser>({ ...mockDeep<InstanceApiDependencies>(), ...overrides, serverInfo: { enabled: () => true, read: async () => ({ machine: 'fixture', cpu: { model: 'cpu', cores: 1 }, mem: { total: 1 }, fs: { total: 1, used: 0 } }) } }), { context: testContext(mockDeep<MiLocalUser>({ id: 'admin123', isSuspended: false, movedToUri: null })) });
}

const packedAdSchema = packedSchemas.Ad;
const packedMetaDetailedSchema = packedSchemas.MetaDetailed;
const packedMetaLiteSchema = packedSchemas.MetaLite;

const meta = Object.assign(new MiMeta(), {
	id: 'fixture',
	rootUserId: null,
	rootUser: null,
	name: null,
	shortName: null,
	description: null,
	maintainerName: null,
	maintainerEmail: null,
	disableRegistration: false,
	langs: [],
	pinnedUsers: [],
	hiddenTags: [],
	blockedHosts: [],
	sensitiveWords: [],
	prohibitedWords: [],
	prohibitedWordsForNameOfUser: [],
	silencedHosts: [],
	mediaSilencedHosts: [],
	themeColor: null,
	mascotImageUrl: null,
	bannerUrl: null,
	backgroundImageUrl: null,
	logoImageUrl: null,
	iconUrl: null,
	app192IconUrl: null,
	app512IconUrl: null,
	serverErrorImageUrl: null,
	notFoundImageUrl: null,
	infoImageUrl: null,
	cacheRemoteFiles: false,
	cacheRemoteSensitiveFiles: false,
	emailRequiredForSignup: false,
	enableHcaptcha: false,
	hcaptchaSiteKey: null,
	hcaptchaSecretKey: null,
	enableMcaptcha: false,
	mcaptchaSitekey: null,
	mcaptchaSecretKey: null,
	mcaptchaInstanceUrl: null,
	enableRecaptcha: false,
	recaptchaSiteKey: null,
	recaptchaSecretKey: null,
	enableTurnstile: false,
	turnstileSiteKey: null,
	turnstileSecretKey: null,
	enableTestcaptcha: false,
	sensitiveMediaDetection: 'none',
	sensitiveMediaDetectionSensitivity: 'medium',
	setSensitiveFlagAutomatically: false,
	enableSensitiveMediaDetectionForVideos: false,
	sensitiveMediaDetectionApiUrl: null,
	sensitiveMediaDetectionApiKey: null,
	sensitiveMediaDetectionTimeout: 1,
	sensitiveMediaDetectionMaxImagesPerRequest: 1,
	enableEmail: false,
	email: null,
	smtpSecure: false,
	smtpHost: null,
	smtpPort: null,
	smtpUser: null,
	smtpPass: null,
	enableServiceWorker: false,
	swPublicKey: null,
	swPrivateKey: null,
	deeplAuthKey: null,
	deeplIsPro: false,
	termsOfServiceUrl: null,
	repositoryUrl: null,
	feedbackUrl: null,
	impressumUrl: null,
	privacyPolicyUrl: null,
	inquiryUrl: null,
	defaultLightTheme: null,
	defaultDarkTheme: null,
	useObjectStorage: false,
	objectStorageBucket: null,
	objectStoragePrefix: null,
	objectStorageBaseUrl: null,
	objectStorageEndpoint: null,
	objectStorageRegion: null,
	objectStorageAccessKey: null,
	objectStorageSecretKey: null,
	objectStoragePort: null,
	objectStorageUseSSL: false,
	objectStorageUseProxy: false,
	objectStorageSetPublicRead: false,
	objectStorageS3ForcePathStyle: false,
	enableIpLogging: false,
	enableActiveEmailValidation: false,
	enableVerifymailApi: false,
	verifymailAuthKey: null,
	enableTruemailApi: false,
	truemailInstance: null,
	truemailAuthKey: null,
	enableChartsForRemoteUser: false,
	enableChartsForFederatedInstances: false,
	enableStatsForFederatedInstances: false,
	enableServerMachineStats: false,
	enableIdenticonGeneration: false,
	policies: { ...DEFAULT_POLICIES, customPolicy: { enabled: true } },
	serverRules: [],
	manifestJsonOverride: 'fixture',
	bannedEmailDomains: [],
	preservedUsernames: [],
	enableFanoutTimeline: false,
	enableFanoutTimelineDbFallback: false,
	perLocalUserUserTimelineCacheMax: 1,
	perRemoteUserUserTimelineCacheMax: 1,
	perUserHomeTimelineCacheMax: 1,
	perUserListTimelineCacheMax: 1,
	enableReactionsBuffering: false,
	notesPerOneAd: 1,
	urlPreviewEnabled: false,
	urlPreviewAllowRedirect: false,
	urlPreviewTimeout: 1,
	urlPreviewMaximumContentLength: 1,
	urlPreviewRequireContentLength: false,
	urlPreviewSummaryProxyUrl: null,
	urlPreviewUserAgent: null,
	urlPreviewSensitiveList: [],
	federation: 'all',
	federationHosts: [],
	ugcVisibilityForVisitor: 'all',
	googleAnalyticsMeasurementId: null,
	deliverSuspendedSoftware: [],
	singleUserMode: false,
	proxyRemoteFiles: false,
	signToActivityPubGet: false,
	allowExternalApRedirect: false,
	enableRemoteNotesCleaning: false,
	remoteNotesCleaningMaxProcessingDurationInMinutes: 1,
	remoteNotesCleaningExpiryDaysForEachNotes: 1,
	showRoleBadgesOfRemoteUsers: false,
	clientOptions: { entrancePageStyle: 'classic' as const, showTimelineForVisitor: true, showActivitiesForVisitor: true, extension: { enabled: true } },
});

function rejectsDrift(schema: v.GenericSchema, result: Record<string, unknown>, optionalKeys: string[] = []) {
	expect(v.parse(schema, result)).toEqual(result);
	expect(v.safeParse(schema, { ...result, future: true }).success).toBe(false);
	for (const [key, value] of Object.entries(result)) {
		if (optionalKeys.includes(key)) continue;
		const missing = { ...result };
		delete missing[key];
		expect(v.safeParse(schema, missing).success, `missing ${key}`).toBe(false);
		expect(v.safeParse(schema, { ...result, [key]: value === null ? {} : typeof value === 'string' ? 1 : 'wrong' }).success, `wrong ${key}`).toBe(false);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectsNested(schema: v.GenericSchema, result: Record<string, unknown>, paths: string[][]) {
	for (const path of paths) {
		for (const mutation of ['extra', 'missing', 'wrong']) {
			const invalid = structuredClone(result);
			let branch: Record<string, unknown> = invalid;
			for (const key of path) {
				const child = branch[key];
				if (!isRecord(child)) throw new Error(`Invalid branch ${key}`);
				branch = child;
			}
			const first = Object.keys(branch)[0];
			if (mutation === 'extra') branch.future = true;
			else if (mutation === 'missing') delete branch[first];
			else branch[first] = typeof branch[first] === 'string' ? 1 : 'wrong';
			expect(v.safeParse(schema, invalid).success, `${path.join('.')}:${mutation}`).toBe(false);
		}
	}
}

test('actual instance producers cover disabled/enabled metrics, endpoint null and type fallback', async () => {
	const metrics = { machine: 'fixture', cpu: { model: 'cpu', cores: 4 }, mem: { total: 1024 }, fs: { total: 512, used: 64 } };
	for (const enabled of [false, true]) {
		const read = vi.fn(async () => metrics);
		const result = await createServerInfo({ enabled: () => enabled, read })({});
		rejectsDrift(requiredSchema(serverInfoContract['~orpc'].outputSchema), result);
		expect(read).toHaveBeenCalledTimes(enabled ? 1 : 0);
		rejectsNested(requiredSchema(serverInfoContract['~orpc'].outputSchema), result, [['cpu'], ['mem'], ['fs']]);
	}
	const endpoint = createEndpoint(async () => [{ name: 'sample', properties: { count: { type: 'number' }, fallback: {} } }]);
	expect(await endpoint({ endpoint: 'missing' })).toBeNull();
	const described = await endpoint({ endpoint: 'sample' });
	expect(described).toEqual({ params: [{ name: 'count', type: 'Number' }, { name: 'fallback', type: 'string' }] });
	expect(v.safeParse(endpointResult, { ...described, future: true }).success).toBe(false);
	for (const param of [{ name: 'x', type: 'String', future: true }, { name: 'x' }, { name: 'x', type: 1 }]) expect(v.safeParse(endpointResult, { params: [param] }).success).toBe(false);
	rejectsDrift(pingResult, await createPing(() => 42)({}));
	rejectsDrift(requiredSchema(onlineUsersCountContract['~orpc'].outputSchema), await createGetOnlineUsersCount({ countSince: async () => 3, thresholdMs: 100 }, () => 42)({}));
});

test('actual admin machine producer includes optional Redis version and finite nested metrics', async () => {
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue([{ server_version: '17' }]);
	const redis = mockDeep<Redis>();
	for (const info of ['redis_version:7.2.0\r\n', 'no version']) {
		redis.info.mockResolvedValue(info);
		const result = await operations({ db, redisClient: redis }).adminServerInfo({});
		rejectsDrift(requiredSchema(adminServerInfoContract['~orpc'].outputSchema), result, ['redis']);
		expect(result.redis).toBe(info.startsWith('redis_version:') ? '7.2.0' : undefined);
		rejectsNested(requiredSchema(adminServerInfoContract['~orpc'].outputSchema), result, [['cpu'], ['mem'], ['fs'], ['net']]);
	}
});

test('actual admin metadata and public metadata preserve nullable images, client options and dynamic policies', async () => {
	const config = mockDeep<Config>({ version: 'test', url: 'https://local.test', mediaProxy: 'https://local.test/proxy', publishTarballInsteadOfProvideRepositoryUrl: false, maxFileSize: 1024, sentryForFrontend: undefined });
	const service = mockDeep<MetaService>();
	service.fetch.mockResolvedValue(meta);
	const system = mockDeep<SystemAccountService>();
	system.fetch.mockResolvedValue(mockDeep<MiLocalUser>({ id: 'proxy1', username: 'proxy', host: null, uri: null }));
	const result = await operations({ config, metaService: service, systemAccountService: system }).adminMeta({});
	rejectsDrift(requiredSchema(adminMetaContract['~orpc'].outputSchema), result, ['policies', 'silencedHosts', 'bannedEmailDomains']);
	expect(result.langs).toEqual([]);
	expect(result.logoImageUrl).toBeNull();
	expect(result.policies).toHaveProperty('customPolicy', { enabled: true });
	const ads = mockDeep<AdsRepository>();
	const query = mockDeep<SelectQueryBuilder<MiAd>>();
	query.where.mockReturnThis();
	query.andWhere.mockReturnThis();
	query.getMany.mockResolvedValue([false, true].map(isSensitive => mockDeep<MiAd>({ id: 'ad1', url: 'https://ad.test', place: 'square', ratio: 1, imageUrl: 'https://ad.test/image', dayOfWeek: 0, isSensitive })));
	ads.createQueryBuilder.mockReturnValue(query);
	const serializer = new MetaEntityService(config, meta, ads, system);
	const lite = await serializer.pack();
	expect(v.parse(packedMetaLiteSchema, lite)).toEqual(lite);
	expect(lite.mascotImageUrl).toBe('/assets/ai.png');
	expect(lite.ads.map(ad => ad.isSensitive)).toEqual([undefined, true]);
	for (const ad of lite.ads) {
		expect(v.safeParse(packedMetaLiteSchema, { ...lite, ads: [{ ...ad, future: true }] }).success).toBe(false);
		for (const invalid of [{ ...ad, id: undefined }, { ...ad, ratio: 'bad' }]) expect(v.safeParse(packedMetaLiteSchema, { ...lite, ads: [invalid] }).success).toBe(false);
	}
	const detailed = await serializer.packDetailed();
	expect(v.parse(packedMetaDetailedSchema, detailed)).toEqual(detailed);
	expect(v.parse(packedMetaLiteSchema, lite).policies).toHaveProperty('customPolicy', { enabled: true });
	expect(v.parse(packedMetaDetailedSchema, detailed).policies).toHaveProperty('customPolicy', { enabled: true });
	for (const invalid of [new Date(), () => 1, Infinity, undefined]) {
		const policies = { ...lite.policies, customPolicy: invalid };
		expect(v.safeParse(packedMetaLiteSchema, { ...lite, policies }).success).toBe(false);
		expect(v.safeParse(packedMetaDetailedSchema, { ...detailed, policies }).success).toBe(false);
	}
	expect(v.safeParse(packedMetaLiteSchema, { ...lite, policies: { ...lite.policies, canPublicNote: 'bad' } }).success).toBe(false);
	expect(detailed.features?.miauth).toBe(true);
	expect(v.safeParse(packedMetaDetailedSchema, { ...detailed, features: { ...detailed.features, future: true } }).success).toBe(false);
	for (const features of [{ ...detailed.features, registration: undefined }, { ...detailed.features, registration: 'bad' }]) expect(v.safeParse(packedMetaDetailedSchema, { ...detailed, features }).success).toBe(false);
	expect(v.parse(packedMetaLiteSchema, lite).clientOptions).toHaveProperty('extension', { enabled: true });
	expect(v.parse(requiredSchema(adminMetaContract['~orpc'].outputSchema), result).clientOptions).toHaveProperty('extension', { enabled: true });
	expect(v.safeParse(packedMetaLiteSchema, { ...lite, clientOptions: { ...lite.clientOptions, showTimelineForVisitor: 'bad' } }).success).toBe(false);
	rejectsDrift(packedMetaLiteSchema, lite);
	rejectsDrift(packedMetaDetailedSchema, detailed, ['features']);
	expect(v.safeParse(packedMetaLiteSchema, detailed).success).toBe(false);
	for (const invalid of [new Date(), () => 1, Infinity, undefined]) {
		expect(v.safeParse(packedMetaLiteSchema, { ...lite, clientOptions: { ...lite.clientOptions, extension: invalid } }).success).toBe(false);
		expect(v.safeParse(requiredSchema(adminMetaContract['~orpc'].outputSchema), { ...result, policies: { extension: invalid } }).success).toBe(false);
	}
	config.sentryForFrontend = {
		options: { dsn: 'https://sentry.test/1', tracesSampleRate: 0.5, beforeSend: event => event },
		vueIntegration: null, browserTracingIntegration: null, replayIntegration: null,
	};
	Object.assign(config.sentryForFrontend.options, { extension: { retained: [null, true, 1, 'value'] } });
	const nativeSentry = await serializer.pack();
	expect(nativeSentry.sentryForFrontend).toBe(config.sentryForFrontend);
	expect(v.safeParse(packedMetaLiteSchema, nativeSentry).success).toBe(false);
	const wireSentry: unknown = JSON.parse(JSON.stringify(nativeSentry));
	const validatedSentry = v.parse(packedMetaLiteSchema, wireSentry);
	expect(validatedSentry.sentryForFrontend?.options).toHaveProperty('extension', { retained: [null, true, 1, 'value'] });
	for (const sentryForFrontend of [
		{ options: { dsn: 1 } },
		{ options: { dsn: 'https://sentry.test', invalid: new Date() } },
		{ options: { dsn: 'https://sentry.test' }, vueIntegration: { invalid: () => 1 } },
		{ options: { dsn: 'https://sentry.test' }, unexpected: true },
	]) expect(v.safeParse(packedMetaLiteSchema, { ...lite, sentryForFrontend }).success).toBe(false);
	const endpoint = operations({ metaEntityService: serializer });
	const input = { detail: false, future: 'retained' };
	const raw = await endpoint.meta(input);
	expect(input.future).toBe('retained');
	expect(raw.sentryForFrontend?.options).toHaveProperty('extension', { retained: [null, true, 1, 'value'] });
	expect(raw.sentryForFrontend?.options).not.toHaveProperty('beforeSend');
	const rawDetailed = await endpoint.meta({ detail: true });
	expect(rawDetailed).toHaveProperty('features.miauth', true);
});

test('actual ad create serializer emits dates and sensitivity without response defaults', async () => {
	const ad = mockDeep<MiAd>({ id: 'ad1', expiresAt: new Date('2026-02-01Z'), startsAt: new Date('2026-01-01Z'), dayOfWeek: 0, isSensitive: false, url: 'https://ad.test', imageUrl: 'https://ad.test/image', memo: '', place: 'square', priority: 'high', ratio: 1 });
	const ads = mockDeep<AdsRepository>();
	ads.insertOne.mockResolvedValue(ad);
	const endpoint = operations({ adsRepository: ads, idService: mockDeep<IdService>(), moderationLogService: mockDeep<ModerationLogService>() });
	const result = await endpoint.adCreate({ url: ad.url, memo: '', place: ad.place, priority: ad.priority, ratio: ad.ratio, expiresAt: ad.expiresAt.getTime(), startsAt: ad.startsAt.getTime(), imageUrl: ad.imageUrl, dayOfWeek: ad.dayOfWeek });
	rejectsDrift(packedAdSchema, result);
	expect(result.isSensitive).toBe(false);
	expect(result.expiresAt).toBe(ad.expiresAt.toISOString());
});
const anonymousContext = testContext(null);
const createServerInfo = (deps: Parameters<typeof createServerInfoRouter>[0]) => createProcedureClient(createServerInfoRouter<MiLocalUser>(deps).serverInfo, { context: anonymousContext });
const createEndpoint = (readEndpoints: InstanceApiDependencies['readEndpoints']) => createProcedureClient(createEndpointProcedure<MiLocalUser>({ readEndpoints }), { context: anonymousContext });
const createPing = (now: () => number) => createProcedureClient(createPingProcedure<MiLocalUser>({ now }), { context: anonymousContext });
const createGetOnlineUsersCount = (getOnlineUsersCount: InstanceApiDependencies['getOnlineUsersCount'], now: () => number) => createProcedureClient(createOnlineUsersCountProcedure<MiLocalUser>({ getOnlineUsersCount, now }), { context: anonymousContext });

test('public metadata projects outer/nested secrets without invoking its output validator', async () => {
	const config = mockDeep<Config>({ version: 'test', url: 'https://local.test', mediaProxy: 'https://local.test/proxy', publishTarballInsteadOfProvideRepositoryUrl: false, maxFileSize: 1024, sentryForFrontend: undefined });
	config.sentryForFrontend = { options: { dsn: 'https://sentry.test/1', beforeSend: event => event }, vueIntegration: null, browserTracingIntegration: null, replayIntegration: null };
	const ads = mockDeep<AdsRepository>();
	const query = mockDeep<SelectQueryBuilder<MiAd>>();
	query.where.mockReturnThis(); query.andWhere.mockReturnThis();
	query.getMany.mockResolvedValue([mockDeep<MiAd>({ id: 'ad123', url: 'https://ad.test', place: 'square', ratio: 1, imageUrl: 'https://ad.test/image', dayOfWeek: 0, isSensitive: false })]);
	ads.createQueryBuilder.mockReturnValue(query);
	const system = mockDeep<SystemAccountService>();
	system.fetch.mockResolvedValue(mockDeep<MiLocalUser>({ username: 'proxy' }));
	const serializer = new MetaEntityService(config, meta, ads, system);
	const lite = Object.assign(await serializer.pack(), { hcaptchaSecretKey: 'private-key', internalMarker: 'outer' });
	Object.assign(lite.ads[0], { internalMarker: 'nested' });
	const detailed = Object.assign(await serializer.packDetailed(), { hcaptchaSecretKey: 'private-key', internalMarker: 'outer' });
	Object.assign(detailed.features, { internalMarker: 'nested' });
	const endpoint = operations({ metaEntityService: { pack: async () => lite, packDetailed: async () => detailed } });
	const schema = requiredSchema(metaContract['~orpc'].outputSchema);
	const outputRun = vi.spyOn(schema, '~run');
	try {
		const publicLite = await endpoint.meta({ detail: false });
		const publicDetailed = await endpoint.meta({ detail: true });
		for (const result of [publicLite, publicDetailed]) {
			expect(result).not.toHaveProperty('hcaptchaSecretKey');
			expect(result).not.toHaveProperty('internalMarker');
			expect(result.ads[0]).not.toHaveProperty('internalMarker');
			expect(result.sentryForFrontend?.options).not.toHaveProperty('beforeSend');
			expect(result.policies).toHaveProperty('customPolicy', { enabled: true });
		}
		expect(publicDetailed).not.toHaveProperty('features.internalMarker');
		const handler = new OpenAPIHandler({ meta: createMetaProcedure<MiLocalUser>({ metaEntityService: { pack: async () => lite, packDetailed: async () => detailed } }) });
		for (const detail of [false, true]) {
			const response = await handler.handle(new Request('https://local.test/meta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ detail }) }), { context: testContext(null) });
			expect(response.response?.status).toBe(200);
			const wire: unknown = await response.response?.json();
			expect(wire).not.toHaveProperty('hcaptchaSecretKey');
			expect(wire).not.toHaveProperty('internalMarker');
			expect(wire).not.toHaveProperty('ads.0.internalMarker');
			expect(wire).not.toHaveProperty('features.internalMarker');
			expect(wire).not.toHaveProperty('sentryForFrontend.options.beforeSend');
			expect(wire).toHaveProperty('policies.customPolicy', { enabled: true });
		}
		expect(outputRun).not.toHaveBeenCalled();
	} finally { outputRun.mockRestore(); }
});

test('admin metadata keeps authorized infrastructure secrets and rejects a moderator before malformed input', async () => {
	const instance = Object.assign(new MiMeta(), meta, { hcaptchaSecretKey: 'authorized-secret', policies: toPackedJsonObject(JSON.parse('{"constructor":true,"prototype":true,"__proto__":true,"customPolicy":{"constructor":"retained","__proto__":"retained"}}')) });
	const service = mockDeep<MetaService>(); service.fetch.mockResolvedValue(instance);
	const system = mockDeep<SystemAccountService>(); system.fetch.mockResolvedValue(mockDeep<MiLocalUser>({ username: 'proxy' }));
	const config = mockDeep<Config>({ version: 'test', url: 'https://local.test' });
	const deps = { ...mockDeep<InstanceApiDependencies>(), config, metaService: service, systemAccountService: system, serverInfo: { enabled: () => false, read: async () => ({ machine: '?', cpu: { model: '?', cores: 0 }, mem: { total: 0 }, fs: { total: 0, used: 0 } }) } };
	const actor = mockDeep<MiLocalUser>({ id: 'moderator123', isSuspended: false, movedToUri: null });
	const context = testContext(actor);
	context.authorization = { rootUserId: () => 'owner123', roles: async () => [{ isModerator: true, isAdministrator: false }], policyAllowed: async () => false };
	const router = createInstanceRouter<MiLocalUser>(deps);
	const handler = new OpenAPIHandler({ adminMeta: router.adminMeta }, { customErrorResponseBodyEncoder: misskeyErrorBody });
	const denied = await handler.handle(new Request('https://local.test/admin/meta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'null' }), { context });
	expect(denied.response?.status).toBe(403);
	expect(await denied.response?.json()).toMatchObject({ error: { code: 'ROLE_PERMISSION_DENIED', id: 'c3d38592-54c0-429d-be96-5636b0431a61' } });
	expect(service.fetch).not.toHaveBeenCalled();
	context.authorization = { rootUserId: () => actor.id, roles: async () => [], policyAllowed: async () => true };
	const result = await call(router.adminMeta, {}, { context });
	expect(result.hcaptchaSecretKey).toBe('authorized-secret');
	for (const key of ['constructor', 'prototype', '__proto__']) expect(Object.hasOwn(result.policies, key)).toBe(false);
	expect(result.policies.customPolicy).toEqual(JSON.parse('{"constructor":"retained","__proto__":"retained"}'));
});
