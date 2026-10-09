/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import * as v from 'valibot';
import { IsNull } from 'typeorm';
import type { DataSource } from 'typeorm';
import type { Config } from '@/config.js';
import * as Acct from '../../federation/backend/utility/acct.js';
import { loadSystemInformation } from '../../statistics/backend/runtime-dependencies/systeminformation.js';
import { DEFAULT_POLICIES } from '../../roles/backend/services/RoleService.js';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import { toPackedUserDetailed } from '../../users/backend/user.schema.js';
import { metaContract } from './endpoints/meta.contract.js';
import { adminMetaContract } from './endpoints/admin/meta.contract.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { InstanceApiParameters, InstanceApiOutputs } from './api.contract.js';
import type { AdsRepository, UsersRepository } from '../../persistence/backend/repositories/models.js';
import type { MiMeta } from './models/Meta.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { MetaService } from './services/MetaService.js';
import type { MetaEntityService } from './serializers/MetaEntityService.js';
import type { SystemAccountService } from '../../users/backend/services/SystemAccountService.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { Redis } from 'ioredis';
import type { ReadEndpoints } from './index.js';
import type { OnlineUsersCountDependencies } from './get-online-users-count.js';

export interface InstanceOperations<Actor extends ApiActor> {
	adCreate(input: InstanceApiParameters['adCreate'], actor: Actor): Promise<InstanceApiOutputs['adCreate']>;
	adDelete(input: InstanceApiParameters['adDelete'], actor: Actor): Promise<InstanceApiOutputs['adDelete']>;
	adList(input: InstanceApiParameters['adList'], actor: Actor): Promise<InstanceApiOutputs['adList']>;
	adUpdate(input: InstanceApiParameters['adUpdate'], actor: Actor): Promise<InstanceApiOutputs['adUpdate']>;
	adminMeta(input: InstanceApiParameters['adminMeta'], actor: Actor): Promise<InstanceApiOutputs['adminMeta']>;
	adminServerInfo(input: InstanceApiParameters['adminServerInfo'], actor: Actor): Promise<InstanceApiOutputs['adminServerInfo']>;
	updateMeta(input: InstanceApiParameters['updateMeta'], actor: Actor): Promise<InstanceApiOutputs['updateMeta']>;
	endpoint(input: InstanceApiParameters['endpoint']): Promise<InstanceApiOutputs['endpoint']>;
	endpoints(input: InstanceApiParameters['endpoints']): Promise<InstanceApiOutputs['endpoints']>;
	onlineUsersCount(input: InstanceApiParameters['onlineUsersCount']): Promise<InstanceApiOutputs['onlineUsersCount']>;
	meta(input: InstanceApiParameters['meta']): Promise<InstanceApiOutputs['meta']>;
	ping(input: InstanceApiParameters['ping']): Promise<InstanceApiOutputs['ping']>;
	pinnedUsers(input: InstanceApiParameters['pinnedUsers'], actor: Actor | null): Promise<InstanceApiOutputs['pinnedUsers']>;
}

export type InstanceApiContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { instance: InstanceOperations<Actor> };
};

export interface InstanceOperationDependencies {
	adsRepository: AdsRepository;
	usersRepository: UsersRepository;
	serverSettings: MiMeta;
	config: Config;
	idService: Pick<IdService, 'gen'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
	metaService: Pick<MetaService, 'fetch' | 'update'>;
	metaEntityService: Pick<MetaEntityService, 'pack' | 'packDetailed'>;
	systemAccountService: Pick<SystemAccountService, 'fetch'>;
	userEntityService: Pick<UserEntityService, 'packMany'>;
	db: Pick<DataSource, 'query'>;
	redisClient: Pick<Redis, 'info'>;
	getOnlineUsersCount: OnlineUsersCountDependencies;
	readEndpoints: ReadEndpoints;
	now?: () => number;
}

/** Produce wire values exactly as the previous JSON transport did, then validate their shape. */
function wireValue(value: unknown): unknown {
	const serialized = JSON.stringify(value);
	return serialized === undefined ? undefined : JSON.parse(serialized);
}

/** Bind application dependencies once; oRPC handlers call these operations directly. */
export function createInstanceOperations<Actor extends ApiActor>(deps: InstanceOperationDependencies): InstanceOperations<Actor> {
	const now = deps.now ?? Date.now;
	return {
		async adCreate(ps, me) {
			const ad = await deps.adsRepository.insertOne({
				id: deps.idService.gen(),
				expiresAt: new Date(ps.expiresAt),
				startsAt: new Date(ps.startsAt),
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
				url: ps.url,
				imageUrl: ps.imageUrl,
				priority: ps.priority,
				ratio: ps.ratio,
				place: ps.place,
				memo: ps.memo,
			});

			deps.moderationLogService.log(me, 'createAd', {
				adId: ad.id,
				ad: ad,
			});

			return {
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				priority: ad.priority,
				ratio: ad.ratio,
				place: ad.place,
				memo: ad.memo,
			};
		},
		async adDelete(ps, me) {
			const ad = await deps.adsRepository.findOneBy({ id: ps.id });

			if (ad == null) throw apiError({ code: 'NO_SUCH_AD', message: 'No such ad.', id: 'ccac9863-3a03-416e-b899-8a64041118b1' });

			await deps.adsRepository.delete(ad.id);

			deps.moderationLogService.log(me, 'deleteAd', {
				adId: ad.id,
				ad: ad,
			});
		},
		async adList(ps) {
			const query = deps.queryService.makePaginationQuery(deps.adsRepository.createQueryBuilder('ad'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			if (ps.publishing === true) {
				query.andWhere('ad.expiresAt > :now', { now: new Date() }).andWhere('ad.startsAt <= :now', { now: new Date() });
			} else if (ps.publishing === false) {
				query.andWhere('ad.expiresAt <= :now', { now: new Date() }).orWhere('ad.startsAt > :now', { now: new Date() });
			}
			const ads = await query.limit(ps.limit).getMany();

			return ads.map(ad => ({
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				memo: ad.memo,
				place: ad.place,
				priority: ad.priority,
				ratio: ad.ratio,
			}));
		},
		async adUpdate(ps, me) {
			const ad = await deps.adsRepository.findOneBy({ id: ps.id });

			if (ad == null) throw apiError({ code: 'NO_SUCH_AD', message: 'No such ad.', id: 'b7aa1727-1354-47bc-a182-3a9c3973d300' });

			await deps.adsRepository.update(ad.id, {
				url: ps.url,
				place: ps.place,
				priority: ps.priority,
				ratio: ps.ratio,
				memo: ps.memo,
				imageUrl: ps.imageUrl,
				expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : undefined,
				startsAt: ps.startsAt ? new Date(ps.startsAt) : undefined,
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
			});

			const updatedAd = await deps.adsRepository.findOneByOrFail({ id: ad.id });

			deps.moderationLogService.log(me, 'updateAd', {
				adId: ad.id,
				before: ad,
				after: updatedAd,
			});
		},
		async adminMeta() {
			const instance = await deps.metaService.fetch(true);

			const proxy = await deps.systemAccountService.fetch('proxy');

			return v.parse(requiredSchema(adminMetaContract['~orpc'].outputSchema), {
				maintainerName: instance.maintainerName,
				maintainerEmail: instance.maintainerEmail,
				version: deps.config.version,
				name: instance.name,
				shortName: instance.shortName,
				uri: deps.config.url,
				description: instance.description,
				langs: instance.langs,
				tosUrl: instance.termsOfServiceUrl,
				repositoryUrl: instance.repositoryUrl,
				feedbackUrl: instance.feedbackUrl,
				impressumUrl: instance.impressumUrl,
				privacyPolicyUrl: instance.privacyPolicyUrl,
				inquiryUrl: instance.inquiryUrl,
				disableRegistration: instance.disableRegistration,
				emailRequiredForSignup: instance.emailRequiredForSignup,
				enableHcaptcha: instance.enableHcaptcha,
				hcaptchaSiteKey: instance.hcaptchaSiteKey,
				enableMcaptcha: instance.enableMcaptcha,
				mcaptchaSiteKey: instance.mcaptchaSitekey,
				mcaptchaInstanceUrl: instance.mcaptchaInstanceUrl,
				enableRecaptcha: instance.enableRecaptcha,
				recaptchaSiteKey: instance.recaptchaSiteKey,
				enableTurnstile: instance.enableTurnstile,
				turnstileSiteKey: instance.turnstileSiteKey,
				enableTestcaptcha: instance.enableTestcaptcha,
				googleAnalyticsMeasurementId: instance.googleAnalyticsMeasurementId,
				swPublickey: instance.swPublicKey,
				themeColor: instance.themeColor,
				mascotImageUrl: instance.mascotImageUrl,
				bannerUrl: instance.bannerUrl,
				serverErrorImageUrl: instance.serverErrorImageUrl,
				notFoundImageUrl: instance.notFoundImageUrl,
				infoImageUrl: instance.infoImageUrl,
				iconUrl: instance.iconUrl,
				app192IconUrl: instance.app192IconUrl,
				app512IconUrl: instance.app512IconUrl,
				backgroundImageUrl: instance.backgroundImageUrl,
				logoImageUrl: instance.logoImageUrl,
				defaultLightTheme: instance.defaultLightTheme,
				defaultDarkTheme: instance.defaultDarkTheme,
				clientOptions: instance.clientOptions,
				enableEmail: instance.enableEmail,
				enableServiceWorker: instance.enableServiceWorker,
				translatorAvailable: instance.deeplAuthKey != null,
				cacheRemoteFiles: instance.cacheRemoteFiles,
				cacheRemoteSensitiveFiles: instance.cacheRemoteSensitiveFiles,
				pinnedUsers: instance.pinnedUsers,
				hiddenTags: instance.hiddenTags,
				blockedHosts: instance.blockedHosts,
				silencedHosts: instance.silencedHosts,
				mediaSilencedHosts: instance.mediaSilencedHosts,
				sensitiveWords: instance.sensitiveWords,
				prohibitedWords: instance.prohibitedWords,
				prohibitedWordsForNameOfUser: instance.prohibitedWordsForNameOfUser,
				preservedUsernames: instance.preservedUsernames,
				hcaptchaSecretKey: instance.hcaptchaSecretKey,
				mcaptchaSecretKey: instance.mcaptchaSecretKey,
				recaptchaSecretKey: instance.recaptchaSecretKey,
				turnstileSecretKey: instance.turnstileSecretKey,
				sensitiveMediaDetection: instance.sensitiveMediaDetection,
				sensitiveMediaDetectionSensitivity: instance.sensitiveMediaDetectionSensitivity,
				setSensitiveFlagAutomatically: instance.setSensitiveFlagAutomatically,
				enableSensitiveMediaDetectionForVideos: instance.enableSensitiveMediaDetectionForVideos,
				sensitiveMediaDetectionApiUrl: instance.sensitiveMediaDetectionApiUrl,
				sensitiveMediaDetectionApiKey: instance.sensitiveMediaDetectionApiKey,
				sensitiveMediaDetectionTimeout: instance.sensitiveMediaDetectionTimeout,
				sensitiveMediaDetectionMaxImagesPerRequest: instance.sensitiveMediaDetectionMaxImagesPerRequest,
				proxyAccountId: proxy.id,
				email: instance.email,
				smtpSecure: instance.smtpSecure,
				smtpHost: instance.smtpHost,
				smtpPort: instance.smtpPort,
				smtpUser: instance.smtpUser,
				smtpPass: instance.smtpPass,
				swPrivateKey: instance.swPrivateKey,
				useObjectStorage: instance.useObjectStorage,
				objectStorageBaseUrl: instance.objectStorageBaseUrl,
				objectStorageBucket: instance.objectStorageBucket,
				objectStoragePrefix: instance.objectStoragePrefix,
				objectStorageEndpoint: instance.objectStorageEndpoint,
				objectStorageRegion: instance.objectStorageRegion,
				objectStoragePort: instance.objectStoragePort,
				objectStorageAccessKey: instance.objectStorageAccessKey,
				objectStorageSecretKey: instance.objectStorageSecretKey,
				objectStorageUseSSL: instance.objectStorageUseSSL,
				objectStorageUseProxy: instance.objectStorageUseProxy,
				objectStorageSetPublicRead: instance.objectStorageSetPublicRead,
				objectStorageS3ForcePathStyle: instance.objectStorageS3ForcePathStyle,
				deeplAuthKey: instance.deeplAuthKey,
				deeplIsPro: instance.deeplIsPro,
				enableIpLogging: instance.enableIpLogging,
				enableActiveEmailValidation: instance.enableActiveEmailValidation,
				enableVerifymailApi: instance.enableVerifymailApi,
				verifymailAuthKey: instance.verifymailAuthKey,
				enableTruemailApi: instance.enableTruemailApi,
				truemailInstance: instance.truemailInstance,
				truemailAuthKey: instance.truemailAuthKey,
				enableChartsForRemoteUser: instance.enableChartsForRemoteUser,
				enableChartsForFederatedInstances: instance.enableChartsForFederatedInstances,
				enableStatsForFederatedInstances: instance.enableStatsForFederatedInstances,
				enableServerMachineStats: instance.enableServerMachineStats,
				enableIdenticonGeneration: instance.enableIdenticonGeneration,
				bannedEmailDomains: instance.bannedEmailDomains,
				policies: { ...DEFAULT_POLICIES, ...instance.policies },
				manifestJsonOverride: instance.manifestJsonOverride,
				enableFanoutTimeline: instance.enableFanoutTimeline,
				enableFanoutTimelineDbFallback: instance.enableFanoutTimelineDbFallback,
				perLocalUserUserTimelineCacheMax: instance.perLocalUserUserTimelineCacheMax,
				perRemoteUserUserTimelineCacheMax: instance.perRemoteUserUserTimelineCacheMax,
				perUserHomeTimelineCacheMax: instance.perUserHomeTimelineCacheMax,
				perUserListTimelineCacheMax: instance.perUserListTimelineCacheMax,
				enableReactionsBuffering: instance.enableReactionsBuffering,
				notesPerOneAd: instance.notesPerOneAd,
				summalyProxy: instance.urlPreviewSummaryProxyUrl,
				urlPreviewEnabled: instance.urlPreviewEnabled,
				urlPreviewAllowRedirect: instance.urlPreviewAllowRedirect,
				urlPreviewTimeout: instance.urlPreviewTimeout,
				urlPreviewMaximumContentLength: instance.urlPreviewMaximumContentLength,
				urlPreviewRequireContentLength: instance.urlPreviewRequireContentLength,
				urlPreviewUserAgent: instance.urlPreviewUserAgent,
				urlPreviewSummaryProxyUrl: instance.urlPreviewSummaryProxyUrl,
				urlPreviewSensitiveList: instance.urlPreviewSensitiveList,
				federation: instance.federation,
				federationHosts: instance.federationHosts,
				deliverSuspendedSoftware: instance.deliverSuspendedSoftware,
				singleUserMode: instance.singleUserMode,
				ugcVisibilityForVisitor: instance.ugcVisibilityForVisitor,
				proxyRemoteFiles: instance.proxyRemoteFiles,
				signToActivityPubGet: instance.signToActivityPubGet,
				allowExternalApRedirect: instance.allowExternalApRedirect,
				enableRemoteNotesCleaning: instance.enableRemoteNotesCleaning,
				remoteNotesCleaningExpiryDaysForEachNotes: instance.remoteNotesCleaningExpiryDaysForEachNotes,
				remoteNotesCleaningMaxProcessingDurationInMinutes: instance.remoteNotesCleaningMaxProcessingDurationInMinutes,
				showRoleBadgesOfRemoteUsers: instance.showRoleBadgesOfRemoteUsers,
			});
		},
		async adminServerInfo() {
			const si = await loadSystemInformation();

			const memStats = await si.mem();
			const fsStats = await si.fsSize();
			const netInterface = await si.networkInterfaceDefault();

			const redisServerInfo = await deps.redisClient.info('Server');
			const m = redisServerInfo.match(new RegExp('^redis_version:(.*)', 'm'));
			const redis_version = m?.[1];

			return {
				machine: os.hostname(),
				os: os.platform(),
				node: process.version,
				psql: v.parse(v.array(v.object({ server_version: v.string() })), await deps.db.query<unknown>('SHOW server_version'))[0].server_version,
				...(redis_version === undefined ? {} : { redis: redis_version }),
				cpu: {
					model: os.cpus()[0].model,
					cores: os.cpus().length,
				},
				mem: {
					total: memStats.total,
				},
				fs: {
					total: fsStats[0].size,
					used: fsStats[0].used,
				},
				net: {
					interface: netInterface,
				},
			};
		},
		async updateMeta(ps, me) {
			const set: Partial<MiMeta> = {};

			if (typeof ps.disableRegistration === 'boolean') {
				set.disableRegistration = ps.disableRegistration;
			}

			if (Array.isArray(ps.pinnedUsers)) {
				set.pinnedUsers = ps.pinnedUsers.filter(Boolean);
			}

			if (Array.isArray(ps.hiddenTags)) {
				set.hiddenTags = ps.hiddenTags.filter(Boolean);
			}

			if (Array.isArray(ps.blockedHosts)) {
				set.blockedHosts = ps.blockedHosts.filter(Boolean).map(x => x.toLowerCase());
			}

			if (Array.isArray(ps.sensitiveWords)) {
				set.sensitiveWords = ps.sensitiveWords.filter(Boolean);
			}
			if (Array.isArray(ps.prohibitedWords)) {
				set.prohibitedWords = ps.prohibitedWords.filter(Boolean);
			}
			if (Array.isArray(ps.prohibitedWordsForNameOfUser)) {
				set.prohibitedWordsForNameOfUser = ps.prohibitedWordsForNameOfUser.filter(Boolean);
			}
			if (Array.isArray(ps.silencedHosts)) {
				let lastValue = '';
				set.silencedHosts = ps.silencedHosts.sort().filter((h) => {
					const lv = lastValue;
					lastValue = h;
					return h !== '' && h !== lv && !set.blockedHosts?.includes(h);
				});
			}
			if (Array.isArray(ps.mediaSilencedHosts)) {
				let lastValue = '';
				set.mediaSilencedHosts = ps.mediaSilencedHosts.sort().filter((h) => {
					const lv = lastValue;
					lastValue = h;
					return h !== '' && h !== lv && !set.blockedHosts?.includes(h);
				});
			}
			if (ps.themeColor !== undefined) {
				set.themeColor = ps.themeColor;
			}

			if (ps.mascotImageUrl !== undefined) {
				set.mascotImageUrl = ps.mascotImageUrl;
			}

			if (ps.bannerUrl !== undefined) {
				set.bannerUrl = ps.bannerUrl;
			}

			if (ps.iconUrl !== undefined) {
				set.iconUrl = ps.iconUrl;
			}

			if (ps.app192IconUrl !== undefined) {
				set.app192IconUrl = ps.app192IconUrl;
			}

			if (ps.app512IconUrl !== undefined) {
				set.app512IconUrl = ps.app512IconUrl;
			}

			if (ps.serverErrorImageUrl !== undefined) {
				set.serverErrorImageUrl = ps.serverErrorImageUrl;
			}

			if (ps.infoImageUrl !== undefined) {
				set.infoImageUrl = ps.infoImageUrl;
			}

			if (ps.notFoundImageUrl !== undefined) {
				set.notFoundImageUrl = ps.notFoundImageUrl;
			}

			if (ps.backgroundImageUrl !== undefined) {
				set.backgroundImageUrl = ps.backgroundImageUrl;
			}

			if (ps.logoImageUrl !== undefined) {
				set.logoImageUrl = ps.logoImageUrl;
			}

			if (ps.name !== undefined) {
				set.name = ps.name;
			}

			if (ps.shortName !== undefined) {
				set.shortName = ps.shortName;
			}

			if (ps.description !== undefined) {
				set.description = ps.description;
			}

			if (ps.defaultLightTheme !== undefined) {
				set.defaultLightTheme = ps.defaultLightTheme;
			}

			if (ps.defaultDarkTheme !== undefined) {
				set.defaultDarkTheme = ps.defaultDarkTheme;
			}

			if (ps.clientOptions !== undefined) {
				set.clientOptions = {
					...deps.serverSettings.clientOptions,
					...ps.clientOptions,
				};
			}

			if (ps.cacheRemoteFiles !== undefined) {
				set.cacheRemoteFiles = ps.cacheRemoteFiles;
			}

			if (ps.cacheRemoteSensitiveFiles !== undefined) {
				set.cacheRemoteSensitiveFiles = ps.cacheRemoteSensitiveFiles;
			}

			if (ps.emailRequiredForSignup !== undefined) {
				set.emailRequiredForSignup = ps.emailRequiredForSignup;
			}

			if (ps.enableHcaptcha !== undefined) {
				set.enableHcaptcha = ps.enableHcaptcha;
			}

			if (ps.hcaptchaSiteKey !== undefined) {
				set.hcaptchaSiteKey = ps.hcaptchaSiteKey;
			}

			if (ps.hcaptchaSecretKey !== undefined) {
				set.hcaptchaSecretKey = ps.hcaptchaSecretKey;
			}

			if (ps.enableMcaptcha !== undefined) {
				set.enableMcaptcha = ps.enableMcaptcha;
			}

			if (ps.mcaptchaSiteKey !== undefined) {
				set.mcaptchaSitekey = ps.mcaptchaSiteKey;
			}

			if (ps.mcaptchaInstanceUrl !== undefined) {
				set.mcaptchaInstanceUrl = ps.mcaptchaInstanceUrl;
			}

			if (ps.mcaptchaSecretKey !== undefined) {
				set.mcaptchaSecretKey = ps.mcaptchaSecretKey;
			}

			if (ps.enableRecaptcha !== undefined) {
				set.enableRecaptcha = ps.enableRecaptcha;
			}

			if (ps.recaptchaSiteKey !== undefined) {
				set.recaptchaSiteKey = ps.recaptchaSiteKey;
			}

			if (ps.recaptchaSecretKey !== undefined) {
				set.recaptchaSecretKey = ps.recaptchaSecretKey;
			}

			if (ps.enableTurnstile !== undefined) {
				set.enableTurnstile = ps.enableTurnstile;
			}

			if (ps.turnstileSiteKey !== undefined) {
				set.turnstileSiteKey = ps.turnstileSiteKey;
			}

			if (ps.turnstileSecretKey !== undefined) {
				set.turnstileSecretKey = ps.turnstileSecretKey;
			}

			if (ps.enableTestcaptcha !== undefined) {
				set.enableTestcaptcha = ps.enableTestcaptcha;
			}

			if (ps.googleAnalyticsMeasurementId !== undefined) {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				set.googleAnalyticsMeasurementId = ps.googleAnalyticsMeasurementId || null;
			}

			if (ps.sensitiveMediaDetection !== undefined) {
				set.sensitiveMediaDetection = ps.sensitiveMediaDetection;
			}

			if (ps.sensitiveMediaDetectionSensitivity !== undefined) {
				set.sensitiveMediaDetectionSensitivity = ps.sensitiveMediaDetectionSensitivity;
			}

			if (ps.setSensitiveFlagAutomatically !== undefined) {
				set.setSensitiveFlagAutomatically = ps.setSensitiveFlagAutomatically;
			}

			if (ps.enableSensitiveMediaDetectionForVideos !== undefined) {
				set.enableSensitiveMediaDetectionForVideos = ps.enableSensitiveMediaDetectionForVideos;
			}

			if (ps.sensitiveMediaDetectionApiUrl !== undefined) {
				set.sensitiveMediaDetectionApiUrl = ps.sensitiveMediaDetectionApiUrl === '' ? null : ps.sensitiveMediaDetectionApiUrl;
			}

			if (ps.sensitiveMediaDetectionApiKey !== undefined) {
				set.sensitiveMediaDetectionApiKey = ps.sensitiveMediaDetectionApiKey === '' ? null : ps.sensitiveMediaDetectionApiKey;
			}

			if (ps.sensitiveMediaDetectionTimeout !== undefined) {
				set.sensitiveMediaDetectionTimeout = ps.sensitiveMediaDetectionTimeout;
			}

			if (ps.sensitiveMediaDetectionMaxImagesPerRequest !== undefined) {
				set.sensitiveMediaDetectionMaxImagesPerRequest = ps.sensitiveMediaDetectionMaxImagesPerRequest;
			}

			if (ps.maintainerName !== undefined) {
				set.maintainerName = ps.maintainerName;
			}

			if (ps.maintainerEmail !== undefined) {
				set.maintainerEmail = ps.maintainerEmail;
			}

			if (Array.isArray(ps.langs)) {
				set.langs = ps.langs.filter(Boolean);
			}

			if (ps.enableEmail !== undefined) {
				set.enableEmail = ps.enableEmail;
			}

			if (ps.email !== undefined) {
				set.email = ps.email;
			}

			if (ps.smtpSecure !== undefined) {
				set.smtpSecure = ps.smtpSecure;
			}

			if (ps.smtpHost !== undefined) {
				set.smtpHost = ps.smtpHost;
			}

			if (ps.smtpPort !== undefined) {
				set.smtpPort = ps.smtpPort;
			}

			if (ps.smtpUser !== undefined) {
				set.smtpUser = ps.smtpUser;
			}

			if (ps.smtpPass !== undefined) {
				set.smtpPass = ps.smtpPass;
			}

			if (ps.enableServiceWorker !== undefined) {
				set.enableServiceWorker = ps.enableServiceWorker;
			}

			if (ps.swPublicKey !== undefined) {
				set.swPublicKey = ps.swPublicKey;
			}

			if (ps.swPrivateKey !== undefined) {
				set.swPrivateKey = ps.swPrivateKey;
			}

			if (ps.tosUrl !== undefined) {
				set.termsOfServiceUrl = ps.tosUrl;
			}

			if (ps.repositoryUrl !== undefined) {
				set.repositoryUrl = URL.canParse(ps.repositoryUrl!) ? ps.repositoryUrl : null;
			}

			if (ps.feedbackUrl !== undefined) {
				set.feedbackUrl = ps.feedbackUrl;
			}

			if (ps.impressumUrl !== undefined) {
				set.impressumUrl = ps.impressumUrl;
			}

			if (ps.privacyPolicyUrl !== undefined) {
				set.privacyPolicyUrl = ps.privacyPolicyUrl;
			}

			if (ps.inquiryUrl !== undefined) {
				set.inquiryUrl = ps.inquiryUrl;
			}

			if (ps.useObjectStorage !== undefined) {
				set.useObjectStorage = ps.useObjectStorage;
			}

			if (ps.objectStorageBaseUrl !== undefined) {
				set.objectStorageBaseUrl = ps.objectStorageBaseUrl;
			}

			if (ps.objectStorageBucket !== undefined) {
				set.objectStorageBucket = ps.objectStorageBucket;
			}

			if (ps.objectStoragePrefix !== undefined) {
				set.objectStoragePrefix = ps.objectStoragePrefix;
			}

			if (ps.objectStorageEndpoint !== undefined) {
				set.objectStorageEndpoint = ps.objectStorageEndpoint;
			}

			if (ps.objectStorageRegion !== undefined) {
				set.objectStorageRegion = ps.objectStorageRegion;
			}

			if (ps.objectStoragePort !== undefined) {
				set.objectStoragePort = ps.objectStoragePort;
			}

			if (ps.objectStorageAccessKey !== undefined) {
				set.objectStorageAccessKey = ps.objectStorageAccessKey;
			}

			if (ps.objectStorageSecretKey !== undefined) {
				set.objectStorageSecretKey = ps.objectStorageSecretKey;
			}

			if (ps.objectStorageUseSSL !== undefined) {
				set.objectStorageUseSSL = ps.objectStorageUseSSL;
			}

			if (ps.objectStorageUseProxy !== undefined) {
				set.objectStorageUseProxy = ps.objectStorageUseProxy;
			}

			if (ps.objectStorageSetPublicRead !== undefined) {
				set.objectStorageSetPublicRead = ps.objectStorageSetPublicRead;
			}

			if (ps.objectStorageS3ForcePathStyle !== undefined) {
				set.objectStorageS3ForcePathStyle = ps.objectStorageS3ForcePathStyle;
			}

			if (ps.deeplAuthKey !== undefined) {
				if (ps.deeplAuthKey === '') {
					set.deeplAuthKey = null;
				} else {
					set.deeplAuthKey = ps.deeplAuthKey;
				}
			}

			if (ps.deeplIsPro !== undefined) {
				set.deeplIsPro = ps.deeplIsPro;
			}

			if (ps.enableIpLogging !== undefined) {
				set.enableIpLogging = ps.enableIpLogging;
			}

			if (ps.enableActiveEmailValidation !== undefined) {
				set.enableActiveEmailValidation = ps.enableActiveEmailValidation;
			}

			if (ps.enableVerifymailApi !== undefined) {
				set.enableVerifymailApi = ps.enableVerifymailApi;
			}

			if (ps.verifymailAuthKey !== undefined) {
				if (ps.verifymailAuthKey === '') {
					set.verifymailAuthKey = null;
				} else {
					set.verifymailAuthKey = ps.verifymailAuthKey;
				}
			}

			if (ps.enableTruemailApi !== undefined) {
				set.enableTruemailApi = ps.enableTruemailApi;
			}

			if (ps.truemailInstance !== undefined) {
				if (ps.truemailInstance === '') {
					set.truemailInstance = null;
				} else {
					set.truemailInstance = ps.truemailInstance;
				}
			}

			if (ps.truemailAuthKey !== undefined) {
				if (ps.truemailAuthKey === '') {
					set.truemailAuthKey = null;
				} else {
					set.truemailAuthKey = ps.truemailAuthKey;
				}
			}

			if (ps.enableChartsForRemoteUser !== undefined) {
				set.enableChartsForRemoteUser = ps.enableChartsForRemoteUser;
			}

			if (ps.enableChartsForFederatedInstances !== undefined) {
				set.enableChartsForFederatedInstances = ps.enableChartsForFederatedInstances;
			}

			if (ps.enableStatsForFederatedInstances !== undefined) {
				set.enableStatsForFederatedInstances = ps.enableStatsForFederatedInstances;
			}

			if (ps.enableServerMachineStats !== undefined) {
				set.enableServerMachineStats = ps.enableServerMachineStats;
			}

			if (ps.enableIdenticonGeneration !== undefined) {
				set.enableIdenticonGeneration = ps.enableIdenticonGeneration;
			}

			if (ps.serverRules !== undefined) {
				set.serverRules = ps.serverRules;
			}

			if (ps.preservedUsernames !== undefined) {
				set.preservedUsernames = ps.preservedUsernames;
			}

			if (ps.manifestJsonOverride !== undefined) {
				set.manifestJsonOverride = ps.manifestJsonOverride;
			}

			if (ps.enableFanoutTimeline !== undefined) {
				set.enableFanoutTimeline = ps.enableFanoutTimeline;
			}

			if (ps.enableFanoutTimelineDbFallback !== undefined) {
				set.enableFanoutTimelineDbFallback = ps.enableFanoutTimelineDbFallback;
			}

			if (ps.perLocalUserUserTimelineCacheMax !== undefined) {
				set.perLocalUserUserTimelineCacheMax = ps.perLocalUserUserTimelineCacheMax;
			}

			if (ps.perRemoteUserUserTimelineCacheMax !== undefined) {
				set.perRemoteUserUserTimelineCacheMax = ps.perRemoteUserUserTimelineCacheMax;
			}

			if (ps.perUserHomeTimelineCacheMax !== undefined) {
				set.perUserHomeTimelineCacheMax = ps.perUserHomeTimelineCacheMax;
			}

			if (ps.perUserListTimelineCacheMax !== undefined) {
				set.perUserListTimelineCacheMax = ps.perUserListTimelineCacheMax;
			}

			if (ps.enableReactionsBuffering !== undefined) {
				set.enableReactionsBuffering = ps.enableReactionsBuffering;
			}

			if (ps.notesPerOneAd !== undefined) {
				set.notesPerOneAd = ps.notesPerOneAd;
			}

			if (ps.bannedEmailDomains !== undefined) {
				set.bannedEmailDomains = ps.bannedEmailDomains;
			}

			if (ps.urlPreviewEnabled !== undefined) {
				set.urlPreviewEnabled = ps.urlPreviewEnabled;
			}

			if (ps.urlPreviewAllowRedirect !== undefined) {
				set.urlPreviewAllowRedirect = ps.urlPreviewAllowRedirect;
			}

			if (ps.urlPreviewTimeout !== undefined) {
				set.urlPreviewTimeout = ps.urlPreviewTimeout;
			}

			if (ps.urlPreviewMaximumContentLength !== undefined) {
				set.urlPreviewMaximumContentLength = ps.urlPreviewMaximumContentLength;
			}

			if (ps.urlPreviewRequireContentLength !== undefined) {
				set.urlPreviewRequireContentLength = ps.urlPreviewRequireContentLength;
			}

			if (ps.urlPreviewUserAgent !== undefined) {
				const value = (ps.urlPreviewUserAgent ?? '').trim();
				set.urlPreviewUserAgent = value === '' ? null : ps.urlPreviewUserAgent;
			}

			if (ps.summalyProxy !== undefined || ps.urlPreviewSummaryProxyUrl !== undefined) {
				const value = ((ps.urlPreviewSummaryProxyUrl ?? ps.summalyProxy) ?? '').trim();
				set.urlPreviewSummaryProxyUrl = value === '' ? null : value;
			}

			if (Array.isArray(ps.urlPreviewSensitiveList)) {
				set.urlPreviewSensitiveList = ps.urlPreviewSensitiveList.filter(Boolean);
			}

			if (ps.federation !== undefined) {
				set.federation = ps.federation;
			}

			if (ps.deliverSuspendedSoftware !== undefined) {
				set.deliverSuspendedSoftware = ps.deliverSuspendedSoftware;
			}

			if (Array.isArray(ps.federationHosts)) {
				set.federationHosts = ps.federationHosts.filter(Boolean).map(x => x.toLowerCase());
			}

			if (ps.singleUserMode !== undefined) {
				set.singleUserMode = ps.singleUserMode;
			}

			if (ps.ugcVisibilityForVisitor !== undefined) {
				set.ugcVisibilityForVisitor = ps.ugcVisibilityForVisitor;
			}

			if (ps.proxyRemoteFiles !== undefined) {
				set.proxyRemoteFiles = ps.proxyRemoteFiles;
			}

			if (ps.signToActivityPubGet !== undefined) {
				set.signToActivityPubGet = ps.signToActivityPubGet;
			}

			if (ps.allowExternalApRedirect !== undefined) {
				set.allowExternalApRedirect = ps.allowExternalApRedirect;
			}

			if (ps.enableRemoteNotesCleaning !== undefined) {
				set.enableRemoteNotesCleaning = ps.enableRemoteNotesCleaning;
			}

			if (ps.remoteNotesCleaningExpiryDaysForEachNotes !== undefined) {
				set.remoteNotesCleaningExpiryDaysForEachNotes = ps.remoteNotesCleaningExpiryDaysForEachNotes;
			}

			if (ps.remoteNotesCleaningMaxProcessingDurationInMinutes !== undefined) {
				set.remoteNotesCleaningMaxProcessingDurationInMinutes = ps.remoteNotesCleaningMaxProcessingDurationInMinutes;
			}

			if (ps.showRoleBadgesOfRemoteUsers !== undefined) {
				set.showRoleBadgesOfRemoteUsers = ps.showRoleBadgesOfRemoteUsers;
			}

			const before = await deps.metaService.fetch(true);

			await deps.metaService.update(set);

			const after = await deps.metaService.fetch(true);

			deps.moderationLogService.log(me, 'updateServerSettings', {
				before,
				after,
			});
		},
		async endpoint(input) {
			const endpoint = (await deps.readEndpoints()).find(candidate => candidate.name === input.endpoint);
			if (endpoint == null) return null;
			return { params: Object.entries(endpoint.properties).map(([name, property]) => ({
				name, type: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'string',
			})) };
		},
		async endpoints() { return (await deps.readEndpoints()).map(endpoint => endpoint.name); },
		async onlineUsersCount() { return { count: await deps.getOnlineUsersCount.countSince(new Date(now() - deps.getOnlineUsersCount.thresholdMs)) }; },
		async meta(input) {
			const packed = input.detail ? await deps.metaEntityService.packDetailed() : await deps.metaEntityService.pack();
			return v.parse(requiredSchema(metaContract['~orpc'].outputSchema), wireValue(packed));
		},
		async ping() { return { pong: now() }; },
		async pinnedUsers(_ps, me) {
			const users = await Promise.all(deps.serverSettings.pinnedUsers.map(acct => Acct.parse(acct)).map(acct => deps.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
			})));

			return (await deps.userEntityService.packMany(users.filter(x => x != null), me, { schema: 'UserDetailed' })).map(toPackedUserDetailed);
		},
	};
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
