/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
export { objectInput } from '../../api/backend/transport/input.schema.js';
export const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const finiteNumber = v.pipe(v.number(), v.finite());
export const description = v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(1500));
export function uniqueStrings<Item extends v.GenericSchema<string, string>>(item: Item) { return v.pipe(v.array(item), v.check(values => new Set(values).size === values.length, 'Expected unique strings')); }
export const muteWords = v.array(v.union([v.array(v.string()), v.string()]));
export const languageKeys = ['ach', 'ady', 'af', 'af-NA', 'af-ZA', 'ak', 'ar', 'ar-AR', 'ar-MA', 'ar-SA', 'ay-BO', 'az', 'az-AZ', 'be-BY', 'bg', 'bg-BG', 'bn', 'bn-IN', 'bn-BD', 'br', 'bs-BA', 'ca', 'ca-ES', 'cak', 'ck-US', 'cs', 'cs-CZ', 'cy', 'cy-GB', 'da', 'da-DK', 'de', 'de-AT', 'de-DE', 'de-CH', 'dsb', 'el', 'el-GR', 'en', 'en-GB', 'en-AU', 'en-CA', 'en-IE', 'en-IN', 'en-PI', 'en-SG', 'en-UD', 'en-US', 'en-ZA', 'en@pirate', 'eo', 'eo-EO', 'es', 'es-AR', 'es-419', 'es-CL', 'es-CO', 'es-EC', 'es-ES', 'es-LA', 'es-NI', 'es-MX', 'es-US', 'es-VE', 'et', 'et-EE', 'eu', 'eu-ES', 'fa', 'fa-IR', 'fb-LT', 'ff', 'fi', 'fi-FI', 'fo', 'fo-FO', 'fr', 'fr-CA', 'fr-FR', 'fr-BE', 'fr-CH', 'fy-NL', 'ga', 'ga-IE', 'gd', 'gl', 'gl-ES', 'gn-PY', 'gu-IN', 'gv', 'gx-GR', 'he', 'he-IL', 'hi', 'hi-IN', 'hr', 'hr-HR', 'hsb', 'ht', 'hu', 'hu-HU', 'hy', 'hy-AM', 'id', 'id-ID', 'is', 'is-IS', 'it', 'it-IT', 'ja', 'ja-JP', 'jv-ID', 'ka-GE', 'kk-KZ', 'km', 'kl', 'km-KH', 'kab', 'kn', 'kn-IN', 'ko', 'ko-KR', 'ku-TR', 'kw', 'la', 'la-VA', 'lb', 'li-NL', 'lt', 'lt-LT', 'lv', 'lv-LV', 'mai', 'mg-MG', 'mk', 'mk-MK', 'ml', 'ml-IN', 'mn-MN', 'mr', 'mr-IN', 'ms', 'ms-MY', 'mt', 'mt-MT', 'my', 'no', 'nb', 'nb-NO', 'ne', 'ne-NP', 'nl', 'nl-BE', 'nl-NL', 'nn-NO', 'oc', 'or-IN', 'pa', 'pa-IN', 'pl', 'pl-PL', 'ps-AF', 'pt', 'pt-BR', 'pt-PT', 'qu-PE', 'rm-CH', 'ro', 'ro-RO', 'ru', 'ru-RU', 'sa-IN', 'se-NO', 'sh', 'si-LK', 'sk', 'sk-SK', 'sl', 'sl-SI', 'so-SO', 'sq', 'sq-AL', 'sr', 'sr-RS', 'su', 'sv', 'sv-SE', 'sw', 'sw-KE', 'ta', 'ta-IN', 'te', 'te-IN', 'tg', 'tg-TJ', 'th', 'th-TH', 'fil', 'tlh', 'tr', 'tr-TR', 'tt-RU', 'uk', 'uk-UA', 'ur', 'ur-PK', 'uz', 'uz-UZ', 'vi', 'vi-VN', 'xh-ZA', 'yi', 'yi-DE', 'zh', 'zh-Hans', 'zh-Hant', 'zh-CN', 'zh-HK', 'zh-SG', 'zh-TW', 'zu-ZA'] as const;
export { notificationSettings } from './notification-settings.schema.js';
