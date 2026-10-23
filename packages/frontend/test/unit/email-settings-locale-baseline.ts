/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse } from 'vue/compiler-sfc';
import metadata from './email-settings-locale-baseline.json';

type Dictionary = Record<string, string>;
export const originalEmailDictionaries = Object.fromEntries(parse(metadata.originalSource).descriptor.customBlocks
	.filter(block => block.type === 'locale')
	.map(block => [String(block.attrs.locale), JSON.parse(block.content) as Dictionary]));

export function reviewedEmailMessage(file: string, language: string, path: string, fallback: string): string {
	if (file !== metadata.file) return fallback;
	const dictionary = Reflect.get(metadata.reviewed, language) as Dictionary | undefined;
	if (!dictionary || typeof dictionary[path] !== 'string') throw new Error(`Missing reviewed email text: ${language}:${path}`);
	return dictionary[path];
}

/** Preserve the old migration oracle only after checking the real reviewed
 * dictionaries and every non-locale source byte against immutable Git input.
 */
export function restoreEmailHistoricalSource(file: string, source: string): string {
	if (file !== metadata.file) return source;
	const parsed = parse(source, { filename: file });
	if (parsed.errors.length) throw new Error('Invalid email settings SFC');
	const blocks = parsed.descriptor.customBlocks.filter(block => block.type === 'locale');
	if (JSON.stringify(blocks.map(block => block.attrs.locale)) !== JSON.stringify(metadata.languages)) throw new Error('Invalid reviewed email language inventory');
	const keys = metadata.mappings.map(mapping => mapping[1]);
	for (const block of blocks) {
		if (block.attrs.lang !== 'json') throw new Error('Invalid email locale format');
		const dictionary = JSON.parse(block.content) as Dictionary;
		if (JSON.stringify(Object.keys(dictionary)) !== JSON.stringify(keys)) throw new Error('Invalid email key inventory');
		const expected = Reflect.get(metadata.reviewed, String(block.attrs.locale)) as Dictionary;
		if (JSON.stringify(dictionary) !== JSON.stringify(expected)) throw new Error(`Email dictionary differs from reviewed text: ${block.attrs.locale}`);
	}
	const withoutLocales = (text: string): string => {
		const localeBlocks = parse(text, { filename: file }).descriptor.customBlocks.filter(block => block.type === 'locale');
		const pieces: string[] = [];
		let previous = 0;
		for (const block of localeBlocks) {
			const start = text.lastIndexOf('<locale', block.loc.start.offset);
			const closing = text.indexOf('</locale>', block.loc.end.offset);
			if (start < previous || closing < block.loc.end.offset) throw new Error('Invalid email locale boundaries');
			pieces.push(text.slice(previous, start));
			previous = closing + '</locale>'.length;
		}
		pieces.push(text.slice(previous));
		return pieces.join('');
	};
	if (withoutLocales(source) !== withoutLocales(metadata.originalSource)) throw new Error('Email settings changed original component body');
	return metadata.originalSource;
}
