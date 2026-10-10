/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse } from 'vue/compiler-sfc';
import metadata from './final-owner-locale-baseline.json';

type Dictionary = Record<string, string>;
const owners = new Map(metadata.owners.map(owner => [owner.file, owner]));
export const originalFinalOwnerDictionaries = new Map<string, Record<string, Dictionary>>();
export const reviewedFinalOwnerDictionaries = new Map<string, Record<string, Dictionary>>();

for (const owner of metadata.owners) {
	const original = Object.fromEntries(parse(owner.originalSource).descriptor.customBlocks
		.filter(block => block.type === 'locale')
		.map(block => [String(block.attrs.locale), JSON.parse(block.content) as Dictionary]));
	const reviewed = structuredClone(original);
	for (const change of owner.changes) {
		if (original[change.language]?.[change.path] !== change.original) throw new Error(`Invalid frozen final-owner tuple: ${owner.file}:${change.language}:${change.path}`);
		reviewed[change.language][change.path] = change.reviewed;
	}
	originalFinalOwnerDictionaries.set(owner.file, original);
	reviewedFinalOwnerDictionaries.set(owner.file, reviewed);
}

export function historicalFinalOwnerValue(file: string, language: string, path: string, actual: string): string {
	if (!owners.has(file)) return actual;
	const expected = reviewedFinalOwnerDictionaries.get(file)?.[language]?.[path];
	const original = originalFinalOwnerDictionaries.get(file)?.[language]?.[path];
	if (typeof expected !== 'string' || actual !== expected) throw new Error(`Final owner differs from reviewed text: ${file}:${language}:${path}`);
	if (typeof original !== 'string') throw new Error(`Missing final-owner historical text: ${file}:${language}:${path}`);
	return original;
}

export function reviewedFinalOwnerMessage(file: string, language: string, path: string, fallback: string): string {
	if (!owners.has(file)) return fallback;
	const expected = reviewedFinalOwnerDictionaries.get(file)?.[language]?.[path];
	if (typeof expected !== 'string') throw new Error(`Missing reviewed final-owner text: ${file}:${language}:${path}`);
	return expected;
}

/** Verify the actual reviewed dictionaries and every non-locale byte before
 * exposing immutable Git source to the unchanged historical migration oracle.
 */
export function restoreFinalOwnerHistoricalSource(file: string, source: string): string {
	const owner = owners.get(file);
	if (!owner) return source;
	const parsed = parse(source, { filename: file });
	if (parsed.errors.length) throw new Error(`Invalid final-owner SFC: ${file}`);
	const blocks = parsed.descriptor.customBlocks.filter(block => block.type === 'locale');
	if (JSON.stringify(blocks.map(block => block.attrs.locale)) !== JSON.stringify(metadata.languages)) throw new Error(`Invalid final-owner language inventory: ${file}`);
	const keys = owner.keys;
	for (const block of blocks) {
		if (block.attrs.lang !== 'json') throw new Error(`Invalid final-owner locale format: ${file}`);
		const dictionary = JSON.parse(block.content) as Dictionary;
		if (JSON.stringify(Object.keys(dictionary)) !== JSON.stringify(keys)) throw new Error(`Invalid final-owner key inventory: ${file}`);
		const expected = reviewedFinalOwnerDictionaries.get(file)?.[String(block.attrs.locale)];
		if (JSON.stringify(dictionary) !== JSON.stringify(expected)) throw new Error(`Final-owner dictionary differs from reviewed text: ${file}:${block.attrs.locale}`);
	}
	const withoutLocales = (text: string): string => {
		const localeBlocks = parse(text, { filename: file }).descriptor.customBlocks.filter(block => block.type === 'locale');
		const pieces: string[] = [];
		let previous = 0;
		for (const block of localeBlocks) {
			const start = text.lastIndexOf('<locale', block.loc.start.offset);
			const closing = text.indexOf('</locale>', block.loc.end.offset);
			if (start < previous || closing < block.loc.end.offset) throw new Error(`Invalid final-owner locale boundaries: ${file}`);
			pieces.push(text.slice(previous, start));
			previous = closing + '</locale>'.length;
		}
		pieces.push(text.slice(previous));
		return pieces.join('');
	};
	if (withoutLocales(source) !== withoutLocales(owner.originalSource)) throw new Error(`Final owner changed original component body: ${file}`);
	return owner.originalSource;
}
