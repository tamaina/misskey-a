/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import { languages } from 'i18n';
import { locales as currentLocales } from './retired-ui-locale-baseline.js';
import type { ParameterizedString } from 'i18n';
import type { Locale } from './retired-ui-locale-types.js';
import baseline from './retired-drive-locale-baseline.json';

type RetiredDriveLocale = Locale & {
	_uploader: {
		editImage: string;
		compressedToX: ParameterizedString<'x'>;
		savedXPercent: ParameterizedString<'x'>;
		abortConfirm: string;
		doneConfirm: string;
		maxFileSizeIsX: ParameterizedString<'x'>;
		allowedTypes: string;
		tip: string;
	};
	_imageEffector: {
		title: string;
		addEffect: string;
		discardChangesConfirm: string;
		failedToLoadImage: string;
		_fxs: Record<string, string>;
		_fxProps: Record<string, string>;
	};
};

const root = resolve(import.meta.dirname, '../../../..');
const dictionaries = new Map<string, Map<string, Record<string, unknown>>>();

function valueAt(dictionary: unknown, path: string): string {
	for (const part of path.split('.')) {
		if (!dictionary || typeof dictionary !== 'object') throw new Error(`Missing frozen drive path: ${path}`);
		dictionary = Reflect.get(dictionary, part);
	}
	if (typeof dictionary !== 'string') throw new Error(`Expected frozen drive text: ${path}`);
	return dictionary;
}

function ownerValue(file: string, language: string, path: string): string {
	let blocks = dictionaries.get(file);
	if (!blocks) {
		const filename = resolve(root, 'packages/features/drive/frontend', file);
		const parsed = parse(readFileSync(filename, 'utf8'), { filename });
		const localeOnly = ['ts-messages.vue', 'utility/image-compositor-functions/messages.vue'].includes(file);
		const expectedError = `At least one <template> or <script> is required in a single file component. ${filename}`;
		if (parsed.errors.some(error => !localeOnly || (typeof error === 'string' ? error : error.message) !== expectedError)) throw new Error(`Invalid drive locale owner: ${file}`);
		blocks = new Map();
		for (const block of parsed.descriptor.customBlocks.filter(block => block.type === 'locale')) {
			const locale = String(block.attrs.locale);
			if (block.attrs.lang !== 'json' || blocks.has(locale)) throw new Error(`Invalid drive locale block: ${file}:${locale}`);
			blocks.set(locale, JSON.parse(block.content));
		}
		verifyRetiredDriveLanguages([...blocks.keys()]);
		dictionaries.set(file, blocks);
	}
	return valueAt(blocks.get(language), path);
}

export function verifyRetiredDriveBaseline(language: typeof languages[number], pairs: [string, string][]): void {
	if (JSON.stringify(pairs.map(pair => pair[0])) !== JSON.stringify(baseline.mappings.map(mapping => mapping.global))) throw new Error('Invalid retired drive key inventory');
	const digest = createHash('sha256').update(JSON.stringify(pairs)).digest('hex');
	if (digest !== baseline.sha256[language]) throw new Error(`Drive text differs from frozen catalog: ${language}`);
}

export function verifyRetiredDriveLanguages(actual: readonly string[]): void {
	if (JSON.stringify(actual) !== JSON.stringify(languages)) throw new Error('Frozen drive language inventory differs');
}

/**
 * Restore only retired test keys from owner tags after checking an independent
 * digest frozen from the effective develop catalog before its removal.
 * This leaves original-source execution and legacy formatter oracles usable
 * without retaining production catalog entries or duplicating translations.
 */
function restore(language: typeof languages[number]): RetiredDriveLocale {
	const pairs = baseline.mappings.map((mapping): [string, string] => [mapping.global, ownerValue(mapping.file, language, mapping.local)]);
	verifyRetiredDriveBaseline(language, pairs);
	for (const [path, value] of pairs) {
		if (path === '_imageEffector.title' && ownerValue('ts-messages.vue', language, path) !== value) throw new Error(`Drive action title differs: ${language}`);
		if (['_imageEffector._fxs.fill', '_imageEffector._fxs.blur', '_imageEffector._fxs.pixelate'].includes(path)) {
			if (ownerValue('components/MkImageEffectorDialog.vue', language, path.split('.').at(-1)!) !== value) throw new Error(`Drive dialog effect differs: ${language}:${path}`);
		}
	}
	const restored = structuredClone(currentLocales[language]);
	for (const [path, value] of pairs) {
		const parts = path.split('.');
		let target = restored as unknown as Record<string, unknown>;
		for (const part of parts.slice(0, -1)) {
			if (!(part in target)) target[part] = {};
			const next = target[part];
			if (!next || typeof next !== 'object') throw new Error(`Invalid legacy drive branch: ${path}`);
			target = next as Record<string, unknown>;
		}
		target[parts.at(-1)!] = value;
	}
	return restored as RetiredDriveLocale;
}

verifyRetiredDriveLanguages(Object.keys(baseline.sha256));

export const locales = Object.fromEntries(languages.map(language => [language, restore(language)])) as Record<string, RetiredDriveLocale>;
