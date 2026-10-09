/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId, description, uniqueStrings, notificationSettings } from '../../users.input.schema.js';
import { packedMeDetailedSchema } from '../../user.schema.js';
const finiteNumber = v.pipe(v.number(), v.finite());
const muteWords = v.array(v.union([v.array(v.string()), v.string()]));
const languageKeys = ['ach', 'ady', 'af', 'af-NA', 'af-ZA', 'ak', 'ar', 'ar-AR', 'ar-MA', 'ar-SA', 'ay-BO', 'az', 'az-AZ', 'be-BY', 'bg', 'bg-BG', 'bn', 'bn-IN', 'bn-BD', 'br', 'bs-BA', 'ca', 'ca-ES', 'cak', 'ck-US', 'cs', 'cs-CZ', 'cy', 'cy-GB', 'da', 'da-DK', 'de', 'de-AT', 'de-DE', 'de-CH', 'dsb', 'el', 'el-GR', 'en', 'en-GB', 'en-AU', 'en-CA', 'en-IE', 'en-IN', 'en-PI', 'en-SG', 'en-UD', 'en-US', 'en-ZA', 'en@pirate', 'eo', 'eo-EO', 'es', 'es-AR', 'es-419', 'es-CL', 'es-CO', 'es-EC', 'es-ES', 'es-LA', 'es-NI', 'es-MX', 'es-US', 'es-VE', 'et', 'et-EE', 'eu', 'eu-ES', 'fa', 'fa-IR', 'fb-LT', 'ff', 'fi', 'fi-FI', 'fo', 'fo-FO', 'fr', 'fr-CA', 'fr-FR', 'fr-BE', 'fr-CH', 'fy-NL', 'ga', 'ga-IE', 'gd', 'gl', 'gl-ES', 'gn-PY', 'gu-IN', 'gv', 'gx-GR', 'he', 'he-IL', 'hi', 'hi-IN', 'hr', 'hr-HR', 'hsb', 'ht', 'hu', 'hu-HU', 'hy', 'hy-AM', 'id', 'id-ID', 'is', 'is-IS', 'it', 'it-IT', 'ja', 'ja-JP', 'jv-ID', 'ka-GE', 'kk-KZ', 'km', 'kl', 'km-KH', 'kab', 'kn', 'kn-IN', 'ko', 'ko-KR', 'ku-TR', 'kw', 'la', 'la-VA', 'lb', 'li-NL', 'lt', 'lt-LT', 'lv', 'lv-LV', 'mai', 'mg-MG', 'mk', 'mk-MK', 'ml', 'ml-IN', 'mn-MN', 'mr', 'mr-IN', 'ms', 'ms-MY', 'mt', 'mt-MT', 'my', 'no', 'nb', 'nb-NO', 'ne', 'ne-NP', 'nl', 'nl-BE', 'nl-NL', 'nn-NO', 'oc', 'or-IN', 'pa', 'pa-IN', 'pl', 'pl-PL', 'ps-AF', 'pt', 'pt-BR', 'pt-PT', 'qu-PE', 'rm-CH', 'ro', 'ro-RO', 'ru', 'ru-RU', 'sa-IN', 'se-NO', 'sh', 'si-LK', 'sk', 'sk-SK', 'sl', 'sl-SI', 'so-SO', 'sq', 'sq-AL', 'sr', 'sr-RS', 'su', 'sv', 'sv-SE', 'sw', 'sw-KE', 'ta', 'ta-IN', 'te', 'te-IN', 'tg', 'tg-TJ', 'th', 'th-TH', 'fil', 'tlh', 'tr', 'tr-TR', 'tt-RU', 'uk', 'uk-UA', 'ur', 'ur-PK', 'uz', 'uz-UZ', 'vi', 'vi-VN', 'xh-ZA', 'yi', 'yi-DE', 'zh', 'zh-Hans', 'zh-Hant', 'zh-CN', 'zh-HK', 'zh-SG', 'zh-TW', 'zu-ZA'] as const;
export const iUpdateErrors = {
	noSuchAvatar: {
		message: 'No such avatar file.',
		code: 'NO_SUCH_AVATAR',
		id: '539f3a45-f215-4f81-a9a8-31293640207f',
	},

	noSuchBanner: {
		message: 'No such banner file.',
		code: 'NO_SUCH_BANNER',
		id: '0d8f5629-f210-41c2-9433-735831a58595',
	},

	avatarNotAnImage: {
		message: 'The file specified as an avatar is not an image.',
		code: 'AVATAR_NOT_AN_IMAGE',
		id: 'f419f9f8-2f4d-46b1-9fb4-49d3a2fd7191',
	},

	bannerNotAnImage: {
		message: 'The file specified as a banner is not an image.',
		code: 'BANNER_NOT_AN_IMAGE',
		id: '75aedb19-2afd-4e6d-87fc-67941256fa60',
	},

	noSuchPage: {
		message: 'No such page.',
		code: 'NO_SUCH_PAGE',
		id: '8e01b590-7eb9-431b-a239-860e086c408e',
	},

	invalidRegexp: {
		message: 'Invalid Regular Expression.',
		code: 'INVALID_REGEXP',
		id: '0d786918-10df-41cd-8f33-8dec7d9a89a5',
	},

	tooManyMutedWords: {
		message: 'Too many muted words.',
		code: 'TOO_MANY_MUTED_WORDS',
		id: '010665b1-a211-42d2-bc64-8f6609d79785',
	},

	noSuchUser: {
		message: 'No such user.',
		code: 'NO_SUCH_USER',
		id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
	},

	uriNull: {
		message: 'User ActivityPup URI is null.',
		code: 'URI_NULL',
		id: 'bf326f31-d430-4f97-9933-5d61e4d48a23',
	},

	forbiddenToSetYourself: {
		message: 'You can\'t set yourself as your own alias.',
		code: 'FORBIDDEN_TO_SET_YOURSELF',
		id: '25c90186-4ab0-49c8-9bba-a1fa6c202ba4',
	},

	restrictedByRole: {
		message: 'This feature is restricted by your role.',
		code: 'RESTRICTED_BY_ROLE',
		id: '8feff0ba-5ab5-585b-31f4-4df816663fad',
	},

	nameContainsProhibitedWords: {
		message: 'Your new name contains prohibited words.',
		code: 'YOUR_NAME_CONTAINS_PROHIBITED_WORDS',
		id: '0b3f9f6a-2f4d-4b1f-9fb4-49d3a2fd7191',
		status: 422,
	},
} as const;
export const iUpdateContract = oc.$meta({
	requestName: 'i/update',
	requireCredential: true,
	kind: 'write:account',
	limit: {
			duration: 3600000,
			max: 20,
		},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/i/update', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, NO_SUCH_AVATAR: { status: 400, data: apiErrorData }, NO_SUCH_BANNER: { status: 400, data: apiErrorData }, AVATAR_NOT_AN_IMAGE: { status: 400, data: apiErrorData }, BANNER_NOT_AN_IMAGE: { status: 400, data: apiErrorData }, NO_SUCH_PAGE: { status: 400, data: apiErrorData }, INVALID_REGEXP: { status: 400, data: apiErrorData }, TOO_MANY_MUTED_WORDS: { status: 400, data: apiErrorData }, NO_SUCH_USER: { status: 400, data: apiErrorData }, URI_NULL: { status: 400, data: apiErrorData }, FORBIDDEN_TO_SET_YOURSELF: { status: 400, data: apiErrorData }, RESTRICTED_BY_ROLE: { status: 400, data: apiErrorData }, YOUR_NAME_CONTAINS_PROHIBITED_WORDS: { status: 422, data: apiErrorData } }).input(v.pipe(objectInput({
	name: v.optional(v.nullable(v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(50)))),
	description: v.optional(v.nullable(description)),
	followedMessage: v.optional(v.nullable(v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(256)))),
	location: v.optional(v.nullable(v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(50)))),
	birthday: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/)))),
	lang: v.optional(v.pipe(v.nullable(v.picklist(languageKeys)), v.metadata({ enum: [null, ...languageKeys] }))),
	avatarId: v.optional(v.nullable(misskeyId)),
	avatarDecorations: v.optional(v.pipe(v.array(objectInput({
		id: misskeyId,
		angle: v.optional(v.nullable(v.pipe(finiteNumber, v.maxValue(0.5), v.minValue(-0.5)))),
		flipH: v.optional(v.nullable(v.boolean())),
		offsetX: v.optional(v.nullable(v.pipe(finiteNumber, v.maxValue(0.25), v.minValue(-0.25)))),
		offsetY: v.optional(v.nullable(v.pipe(finiteNumber, v.maxValue(0.25), v.minValue(-0.25)))),
	})), v.maxLength(16))),
	bannerId: v.optional(v.nullable(misskeyId)),
	fields: v.optional(v.pipe(v.array(objectInput({ name: v.string(), value: v.string() })), v.minLength(0), v.maxLength(16))),
	isLocked: v.optional(v.boolean()),
	isExplorable: v.optional(v.boolean()),
	hideOnlineStatus: v.optional(v.boolean()),
	publicReactions: v.optional(v.boolean()),
	carefulBot: v.optional(v.boolean()),
	autoAcceptFollowed: v.optional(v.boolean()),
	followApprovalLocalSeconds: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30 * 24 * 60 * 60)))),
	followApprovalRemoteSeconds: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30 * 24 * 60 * 60)))),
	noCrawle: v.optional(v.boolean()),
	preventAiLearning: v.optional(v.boolean()),
	requireSigninToViewContents: v.optional(v.boolean()),
	makeNotesFollowersOnlyBefore: v.optional(v.nullable(v.pipe(finiteNumber, v.integer()))),
	makeNotesHiddenBefore: v.optional(v.nullable(v.pipe(finiteNumber, v.integer()))),
	isBot: v.optional(v.boolean()),
	isCat: v.optional(v.boolean()),
	injectFeaturedNote: v.optional(v.boolean()),
	receiveAnnouncementEmail: v.optional(v.boolean()),
	alwaysMarkNsfw: v.optional(v.boolean()),
	autoSensitive: v.optional(v.boolean()),
	followingVisibility: v.optional(v.picklist(['public', 'followers', 'private'])),
	followersVisibility: v.optional(v.picklist(['public', 'followers', 'private'])),
	chatScope: v.optional(v.picklist(['everyone', 'followers', 'following', 'mutual', 'none'])),
	pinnedPageId: v.optional(v.nullable(misskeyId)),
	mutedWords: v.optional(muteWords),
	hardMutedWords: v.optional(muteWords),
	mutedInstances: v.optional(v.array(v.string())),
	notificationRecieveConfig: v.optional(notificationSettings),
	emailNotificationTypes: v.optional(v.array(v.string())),
	alsoKnownAs: v.optional(v.pipe(uniqueStrings(v.string()), v.maxLength(10))),
}), v.metadata({ required: undefined }))).output(packedMeDetailedSchema);
