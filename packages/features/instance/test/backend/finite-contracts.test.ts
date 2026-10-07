/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import type { DataSource, SelectQueryBuilder } from 'typeorm';
import type { Redis } from 'ioredis';
import type { Config } from '@/config.js';
import { endpointInput, endpointResult, instanceContract, serverInfoResult, pingResult, onlineUsersCountResult } from '../../contract/index.js';
import { inlineAdminServerInfoOutput } from '../../contract/endpoint-definitions.js';
import { packedAdminAdListInput, packedAdminAdListDefinition } from '../../contract/packed-endpoint-definitions.js';
import { constantAdminUpdateMetaDefinition } from '../../contract/source-constant-endpoint-definitions.js';
import { referenceAdminMetaOutput } from '../../contract/reference-endpoint-definitions.js';
import { packedAdSchema, packedMetaDetailedSchema, packedMetaLiteSchema } from '../../contract/packed.js';
import { MiMeta } from '../../backend/models/Meta.js';
import type { MetaService } from '../../backend/services/MetaService.js';
import { MetaEntityService } from '../../backend/serializers/MetaEntityService.js';
import { createServerInfo, createEndpoint, createPing, createGetOnlineUsersCount } from '../../backend/index.js';
import { EndpointImplementation as AdminServerInfo } from '../../backend/endpoints/admin/server-info.js';
import { EndpointImplementation as AdminMeta } from '../../backend/endpoints/admin/meta.js';
import { EndpointImplementation as CreateAd } from '../../backend/endpoints/admin/ad/create.js';
import type { AdsRepository } from '../../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { SystemAccountService } from '../../../users/backend/services/SystemAccountService.js';
import type { IdService } from '../../../runtime/backend/services/IdService.js';
import type { ModerationLogService } from '../../../moderation/backend/services/ModerationLogService.js';
import type { MiAd } from '../../backend/models/Ad.js';
import { DEFAULT_POLICIES } from '../../../roles/backend/services/RoleService.js';
import { ContractEndpoint, projectEndpointContract } from '../../../api/backend/transport/contract-endpoint.js';

vi.mock('../../../statistics/backend/runtime-dependencies/systeminformation.js', () => ({
	loadSystemInformation: async () => ({ mem: async () => ({ total: 1024 }), fsSize: async () => [{ size: 512, used: 64 }], networkInterfaceDefault: async () => 'eth0' }),
}));

// The database entity fixture is explicit; response schemas do not construct producer fixtures.
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
		rejectsDrift(serverInfoResult, result);
		expect(read).toHaveBeenCalledTimes(enabled ? 1 : 0);
		rejectsNested(serverInfoResult, result, [['cpu'], ['mem'], ['fs']]);
	}
	const endpoint = createEndpoint(async () => [{ name: 'sample', properties: { count: { type: 'number' }, fallback: {} } }]);
	expect(await endpoint({ endpoint: 'missing' })).toBeNull();
	const described = await endpoint({ endpoint: 'sample' });
	expect(described).toEqual({ params: [{ name: 'count', type: 'Number' }, { name: 'fallback', type: 'string' }] });
	expect(v.safeParse(endpointResult, { ...described, future: true }).success).toBe(false);
	for (const param of [{ name: 'x', type: 'String', future: true }, { name: 'x' }, { name: 'x', type: 1 }]) expect(v.safeParse(endpointResult, { params: [param] }).success).toBe(false);
	rejectsDrift(pingResult, await createPing(() => 42)({}));
	rejectsDrift(onlineUsersCountResult, await createGetOnlineUsersCount({ countSince: async () => 3, thresholdMs: 100 }, () => 42)({}));
});

test('actual admin machine producer includes optional Redis version and finite nested metrics', async () => {
	const db = mockDeep<DataSource>();
	db.query.mockResolvedValue([{ server_version: '17' }]);
	const redis = mockDeep<Redis>();
	for (const info of ['redis_version:7.2.0\r\n', 'no version']) {
		redis.info.mockResolvedValue(info);
		const result = await new AdminServerInfo(db, redis).exec({}, mockDeep<MiLocalUser>(), null);
		rejectsDrift(inlineAdminServerInfoOutput, result, ['redis']);
		expect(result.redis).toBe(info.startsWith('redis_version:') ? '7.2.0' : undefined);
		rejectsNested(inlineAdminServerInfoOutput, result, [['cpu'], ['mem'], ['fs'], ['net']]);
	}
});

test('actual admin metadata and public metadata preserve nullable images, client options and dynamic policies', async () => {
	const config = mockDeep<Config>({ version: 'test', url: 'https://local.test', mediaProxy: 'https://local.test/proxy', publishTarballInsteadOfProvideRepositoryUrl: false, maxFileSize: 1024, sentryForFrontend: undefined });
	const service = mockDeep<MetaService>();
	service.fetch.mockResolvedValue(meta);
	const system = mockDeep<SystemAccountService>();
	system.fetch.mockResolvedValue(mockDeep<MiLocalUser>({ id: 'proxy1', username: 'proxy', host: null, uri: null }));
	const result = await new AdminMeta(config, service, system).exec({}, mockDeep<MiLocalUser>(), null);
	rejectsDrift(referenceAdminMetaOutput, result, ['policies', 'silencedHosts', 'bannedEmailDomains']);
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
		expect(v.parse(packedMetaLiteSchema, { ...lite, ads: [{ ...ad, future: true }] }).ads[0]).toHaveProperty('future', true);
		for (const invalid of [{ ...ad, id: undefined }, { ...ad, ratio: 'bad' }]) expect(v.safeParse(packedMetaLiteSchema, { ...lite, ads: [invalid] }).success).toBe(false);
	}
	const detailed = await serializer.packDetailed();
	expect(v.parse(packedMetaDetailedSchema, detailed)).toEqual(detailed);
	expect(detailed.features?.miauth).toBe(true);
	expect(v.parse(packedMetaDetailedSchema, { ...detailed, features: { ...detailed.features, future: true } }).features).toHaveProperty('future', true);
	for (const features of [{ ...detailed.features, registration: undefined }, { ...detailed.features, registration: 'bad' }]) expect(v.safeParse(packedMetaDetailedSchema, { ...detailed, features }).success).toBe(false);
	expect(v.parse(packedMetaLiteSchema, lite).clientOptions).toHaveProperty('extension', { enabled: true });
	expect(v.parse(referenceAdminMetaOutput, result).clientOptions).toHaveProperty('extension', { enabled: true });
	expect(v.safeParse(packedMetaLiteSchema, { ...lite, clientOptions: { ...lite.clientOptions, showTimelineForVisitor: 'bad' } }).success).toBe(false);
});

test('actual ad create serializer emits dates and sensitivity without response defaults', async () => {
	const ad = mockDeep<MiAd>({ id: 'ad1', expiresAt: new Date('2026-02-01Z'), startsAt: new Date('2026-01-01Z'), dayOfWeek: 0, isSensitive: false, url: 'https://ad.test', imageUrl: 'https://ad.test/image', memo: '', place: 'square', priority: 'high', ratio: 1 });
	const ads = mockDeep<AdsRepository>();
	ads.insertOne.mockResolvedValue(ad);
	const endpoint = new CreateAd(ads, mockDeep<IdService>(), mockDeep<ModerationLogService>());
	const result = await endpoint.exec({ url: ad.url, memo: '', place: ad.place, priority: ad.priority, ratio: ad.ratio, expiresAt: ad.expiresAt.getTime(), startsAt: ad.startsAt.getTime(), imageUrl: ad.imageUrl, dayOfWeek: ad.dayOfWeek }, mockDeep(), null);
	rejectsDrift(packedAdSchema, result);
	expect(result.isSensitive).toBe(false);
	expect(result.expiresAt).toBe(ad.expiresAt.toISOString());
});

test('finite native requests and empty guards stay distinct from HTTP AJV and unparsed response identity', async () => {
	expect(v.parse(endpointInput, { endpoint: 'ping', future: true })).toEqual({ endpoint: 'ping' });
	expect(v.parse(packedAdminAdListInput, { future: true })).toEqual({ limit: 10, publishing: null });
	for (const input of [{ limit: 0 }, { publishing: 'bad' }]) expect(v.safeParse(packedAdminAdListInput, input).success).toBe(false);
	for (const name of ['ping', 'get-online-users-count', 'server-info', 'endpoints'] as const) {
		const schema = instanceContract[name]['~orpc'].inputSchema!;
		expect(v.parse(schema, undefined)).toEqual({});
		for (const input of [null, [], 'bad', 1]) expect(v.safeParse(schema, input).success).toBe(false);
	}
	const request = { future: true };
	const response = [{ id: 'ad1', expiresAt: '2026-02-01T00:00:00Z', startsAt: '2026-01-01T00:00:00Z', dayOfWeek: 0, isSensitive: false, url: 'https://ad.test', imageUrl: 'https://ad.test/image', memo: '', place: 'square', priority: 'high', ratio: 1, future: true }];
	const endpoint = new ContractEndpoint({}, projectEndpointContract(packedAdminAdListDefinition), async ps => { expect(ps).toBe(request); return response; });
	expect(await endpoint.exec(request, null, null)).toBe(response);
	expect(request).toEqual({ future: true, limit: 10, publishing: null });
	await expect(endpoint.exec({ limit: 0 }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	const updateRequest = { clientOptions: { extension: { enabled: true } } };
	const update = new ContractEndpoint({}, projectEndpointContract(constantAdminUpdateMetaDefinition), async ps => { expect(ps).toBe(updateRequest); expect(ps.clientOptions).toBe(updateRequest.clientOptions); });
	await update.exec(updateRequest, null, null);
	expect(updateRequest.clientOptions.extension).toEqual({ enabled: true });
});
