/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { packedMetaLiteSchema, packedMetaDetailedSchema } from '../endpoints/meta.schema.js';
import type { NativeMetaLite, NativeMetaDetailed } from './native-meta.js';
import { toPackedJsonObject } from '@features/users/backend/json-value.schema.js';

/** JSON delivery removes configured callbacks while retaining extension data. */
function jsonObject(value: unknown) {
 const encoded = JSON.stringify(value);
 if (encoded === undefined) throw new TypeError('Expected a JSON object');
 const decoded: unknown = JSON.parse(encoded);
 return toPackedJsonObject(decoded);
}

function sentryOptions(value: NonNullable<NativeMetaLite['sentryForFrontend']>['options']) {
 if (typeof value.dsn !== 'string') throw new TypeError('Sentry options must declare a DSN');
 return { ...jsonObject(value), dsn: value.dsn };
}

export function toPublicMetaLite(input: NativeMetaLite): v.InferOutput<typeof packedMetaLiteSchema> {
 return {
		maintainerName: input.maintainerName,
		maintainerEmail: input.maintainerEmail,
		version: input.version,
		providesTarball: input.providesTarball,
		name: input.name,
		shortName: input.shortName,
		uri: input.uri,
		description: input.description,
		langs: input.langs,
		tosUrl: input.tosUrl,
		repositoryUrl: input.repositoryUrl,
		feedbackUrl: input.feedbackUrl,
		impressumUrl: input.impressumUrl,
		privacyPolicyUrl: input.privacyPolicyUrl,
		inquiryUrl: input.inquiryUrl,
		disableRegistration: input.disableRegistration,
		emailRequiredForSignup: input.emailRequiredForSignup,
		enableHcaptcha: input.enableHcaptcha,
		hcaptchaSiteKey: input.hcaptchaSiteKey,
		enableMcaptcha: input.enableMcaptcha,
		mcaptchaSiteKey: input.mcaptchaSiteKey,
		mcaptchaInstanceUrl: input.mcaptchaInstanceUrl,
		enableRecaptcha: input.enableRecaptcha,
		recaptchaSiteKey: input.recaptchaSiteKey,
		enableTurnstile: input.enableTurnstile,
		turnstileSiteKey: input.turnstileSiteKey,
		enableTestcaptcha: input.enableTestcaptcha,
		googleAnalyticsMeasurementId: input.googleAnalyticsMeasurementId,
		swPublickey: input.swPublickey,
		themeColor: input.themeColor,
		mascotImageUrl: input.mascotImageUrl,
		bannerUrl: input.bannerUrl,
		infoImageUrl: input.infoImageUrl,
		serverErrorImageUrl: input.serverErrorImageUrl,
		notFoundImageUrl: input.notFoundImageUrl,
		iconUrl: input.iconUrl,
		backgroundImageUrl: input.backgroundImageUrl,
		logoImageUrl: input.logoImageUrl,
		maxNoteTextLength: input.maxNoteTextLength,
		defaultLightTheme: input.defaultLightTheme,
		defaultDarkTheme: input.defaultDarkTheme,
		clientOptions: { ...jsonObject(input.clientOptions), ...(input.clientOptions.entrancePageStyle === undefined ? {} : { entrancePageStyle: input.clientOptions.entrancePageStyle }), ...(input.clientOptions.showTimelineForVisitor === undefined ? {} : { showTimelineForVisitor: input.clientOptions.showTimelineForVisitor }), ...(input.clientOptions.showActivitiesForVisitor === undefined ? {} : { showActivitiesForVisitor: input.clientOptions.showActivitiesForVisitor }) },
		ads: input.ads.map(ad => ({ id: ad.id, url: ad.url, place: ad.place, ratio: ad.ratio, imageUrl: ad.imageUrl, dayOfWeek: ad.dayOfWeek, ...(ad.isSensitive === undefined ? {} : { isSensitive: ad.isSensitive }) })),
		notesPerOneAd: input.notesPerOneAd,
		enableEmail: input.enableEmail,
		enableServiceWorker: input.enableServiceWorker,
		translatorAvailable: input.translatorAvailable,
		serverRules: input.serverRules,
		policies: { ...jsonObject(input.policies), gtlAvailable: input.policies.gtlAvailable, ltlAvailable: input.policies.ltlAvailable, canPublicNote: input.policies.canPublicNote, mentionLimit: input.policies.mentionLimit, canInvite: input.policies.canInvite, inviteLimit: input.policies.inviteLimit, inviteLimitCycle: input.policies.inviteLimitCycle, inviteExpirationTime: input.policies.inviteExpirationTime, canManageCustomEmojis: input.policies.canManageCustomEmojis, canManageAvatarDecorations: input.policies.canManageAvatarDecorations, canSearchNotes: input.policies.canSearchNotes, canSearchUsers: input.policies.canSearchUsers, canUseTranslator: input.policies.canUseTranslator, canHideAds: input.policies.canHideAds, canCreateChannel: input.policies.canCreateChannel, driveCapacityMb: input.policies.driveCapacityMb, maxFileSizeMb: input.policies.maxFileSizeMb, alwaysMarkNsfw: input.policies.alwaysMarkNsfw, canUpdateBioMedia: input.policies.canUpdateBioMedia, pinLimit: input.policies.pinLimit, antennaLimit: input.policies.antennaLimit, wordMuteLimit: input.policies.wordMuteLimit, webhookLimit: input.policies.webhookLimit, clipLimit: input.policies.clipLimit, noteEachClipsLimit: input.policies.noteEachClipsLimit, userListLimit: input.policies.userListLimit, userEachUserListsLimit: input.policies.userEachUserListsLimit, rateLimitFactor: input.policies.rateLimitFactor, avatarDecorationLimit: input.policies.avatarDecorationLimit, canImportAntennas: input.policies.canImportAntennas, canImportBlocking: input.policies.canImportBlocking, canImportFollowing: input.policies.canImportFollowing, canImportMuting: input.policies.canImportMuting, canImportUserLists: input.policies.canImportUserLists, chatAvailability: input.policies.chatAvailability, uploadableFileTypes: input.policies.uploadableFileTypes, noteDraftLimit: input.policies.noteDraftLimit, scheduledNoteLimit: input.policies.scheduledNoteLimit, watermarkAvailable: input.policies.watermarkAvailable },
		sentryForFrontend: input.sentryForFrontend === null ? null : { options: sentryOptions(input.sentryForFrontend.options), ...(input.sentryForFrontend.vueIntegration === undefined ? {} : { vueIntegration: input.sentryForFrontend.vueIntegration === null ? null : jsonObject(input.sentryForFrontend.vueIntegration) }), ...(input.sentryForFrontend.browserTracingIntegration === undefined ? {} : { browserTracingIntegration: input.sentryForFrontend.browserTracingIntegration === null ? null : jsonObject(input.sentryForFrontend.browserTracingIntegration) }), ...(input.sentryForFrontend.replayIntegration === undefined ? {} : { replayIntegration: input.sentryForFrontend.replayIntegration === null ? null : jsonObject(input.sentryForFrontend.replayIntegration) }) },
		mediaProxy: input.mediaProxy,
		enableUrlPreview: input.enableUrlPreview,
		noteSearchableScope: input.noteSearchableScope,
		maxFileSize: input.maxFileSize,
		federation: input.federation,
 };
}
export function toPublicMetaDetailed(input: NativeMetaDetailed): v.InferOutput<typeof packedMetaDetailedSchema> {
 return {
  ...toPublicMetaLite(input),
  cacheRemoteFiles: input.cacheRemoteFiles,
  cacheRemoteSensitiveFiles: input.cacheRemoteSensitiveFiles,
  requireSetup: input.requireSetup,
  proxyAccountName: input.proxyAccountName,
  features: {
   registration: input.features.registration,
   emailRequiredForSignup: input.features.emailRequiredForSignup,
   ...(input.features.localTimeline === undefined ? {} : { localTimeline: input.features.localTimeline }),
   ...(input.features.globalTimeline === undefined ? {} : { globalTimeline: input.features.globalTimeline }),
   hcaptcha: input.features.hcaptcha,
   recaptcha: input.features.recaptcha,
   turnstile: input.features.turnstile,
   objectStorage: input.features.objectStorage,
   serviceWorker: input.features.serviceWorker,
   ...(input.features.miauth === undefined ? {} : { miauth: input.features.miauth }),
  },
 };
}
