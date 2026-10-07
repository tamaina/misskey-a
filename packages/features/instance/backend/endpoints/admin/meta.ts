/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { referenceAdminMetaDefinition, referenceAdminMetaInput, referenceAdminMetaOutput } from '../../../contract/reference-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { MetaService } from '../../services/MetaService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { DEFAULT_POLICIES } from '@features/roles/backend/services/RoleService.js';
import { SystemAccountService } from '@features/users/backend/services/SystemAccountService.js';

const contractProjection = projectEndpointContract(referenceAdminMetaDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:meta',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof referenceAdminMetaInput, typeof referenceAdminMetaOutput> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private metaService: MetaService,
		private systemAccountService: SystemAccountService,
	) {
		super(meta, contractProjection, async () => {
			const instance = await this.metaService.fetch(true);

			const proxy = await this.systemAccountService.fetch('proxy');

			return {
				maintainerName: instance.maintainerName,
				maintainerEmail: instance.maintainerEmail,
				version: this.config.version,
				name: instance.name,
				shortName: instance.shortName,
				uri: this.config.url,
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
			};
		});
	}
}
