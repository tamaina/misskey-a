/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse } from 'vue/compiler-sfc';
import metadata from './instance-pilot-locale-baseline.json';

type Dictionary = Record<string, string>;
const owners = new Map(metadata.owners.map(owner => [owner.file, owner]));

export function verifyPilotOwnerLanguages(file: string, actual: readonly string[]): boolean {
	if (!owners.has(file)) return false;
	if (JSON.stringify(actual) !== JSON.stringify(metadata.languages)) throw new Error(`Invalid reviewed pilot languages: ${file}`);
	return true;
}

export function historicalPilotOwnerValue(file: string, language: string, path: string, actual: string): string {
	const owner = owners.get(file);
	if (!owner) return actual;
	const reviewed = Reflect.get(owner.reviewed, language) as Dictionary | undefined;
	if (!reviewed || reviewed[path] !== actual) throw new Error(`Pilot owner differs from reviewed text: ${file}:${language}:${path}`);
	const original = Reflect.get(owner.original, language) as Dictionary | undefined;
	if (!original || typeof original[path] !== 'string') throw new Error(`Missing historical pilot text: ${file}:${language}:${path}`);
	return original[path];
}

export function reviewedPilotMessage(file: string, language: string, path: string, fallback: string): string {
	const owner = owners.get(file);
	if (!owner) return fallback;
	const dictionary = Reflect.get(owner.reviewed, language) as Dictionary | undefined;
	if (!dictionary || typeof dictionary[path] !== 'string') throw new Error(`Missing reviewed pilot text: ${file}:${language}:${path}`);
	return dictionary[path];
}

/** Verify the real reviewed SFC before exposing its immutable pre-pilot source
 * to the original migration's source and locale-byte regression assertions.
 */
export function restorePilotHistoricalSource(file: string, source: string): string {
	const owner = owners.get(file);
	if (!owner) return source;
	const parsed = parse(source, { filename: file });
	if (parsed.errors.length) throw new Error(`Invalid pilot SFC: ${file}`);
	const blocks = parsed.descriptor.customBlocks.filter(block => block.type === 'locale');
	verifyPilotOwnerLanguages(file, blocks.map(block => String(block.attrs.locale)));
	const keys = Object.keys(owner.original['ja-JP']);
	for (const block of blocks) {
		if (block.attrs.lang !== 'json') throw new Error(`Invalid pilot locale format: ${file}`);
		const dictionary = JSON.parse(block.content) as Dictionary;
		if (JSON.stringify(Object.keys(dictionary)) !== JSON.stringify(keys)) throw new Error(`Invalid pilot key inventory: ${file}`);
		const expected = Reflect.get(owner.reviewed, String(block.attrs.locale)) as Dictionary;
		if (JSON.stringify(dictionary) !== JSON.stringify(expected)) throw new Error(`Pilot dictionary differs from reviewed text: ${file}:${block.attrs.locale}`);
	}
	// Additional locale blocks introduce separator whitespace. Compare every
	// other source byte, including text after or between locale blocks.
	const withoutLocales = (text: string): string => {
		const localeBlocks = parse(text, { filename: file }).descriptor.customBlocks.filter(block => block.type === 'locale');
		const pieces: string[] = [];
		let previous = 0;
		for (const [index, block] of localeBlocks.entries()) {
			const start = text.lastIndexOf('<locale', block.loc.start.offset);
			const closing = text.indexOf('</locale>', block.loc.end.offset);
			if (start < previous || closing < block.loc.end.offset) throw new Error(`Invalid pilot locale boundaries: ${file}`);
			const between = text.slice(previous, start);
			if (index === 0 || /\S/.test(between)) pieces.push(between);
			previous = closing + '</locale>'.length;
		}
		pieces.push(text.slice(previous));
		return pieces.join('');
	};
	if (withoutLocales(source) !== withoutLocales(owner.originalSource)) throw new Error(`Pilot changed original component body: ${file}`);
	return owner.originalSource;
}
