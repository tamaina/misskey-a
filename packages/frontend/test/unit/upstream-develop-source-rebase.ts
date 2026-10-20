/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'vue/compiler-sfc';
import type { LocaleBundle, RuntimeLocaleDictionary } from 'vite-vue-internationalization/runtime';

export interface SourceRebase {
	file: string;
	currentSha256: string;
	baselineSha256: string;
	edits: { start: number; end: number; current: string; baseline: string }[];
}

/** Each purpose contributes only its own reviewed sources; identical helpers merge in any order. */
export const sourceRebases: SourceRebase[] = readdirSync(import.meta.dirname)
	.filter(name => /^upstream-sync-[a-z]+-source-rebase\.json$/.test(name))
	.sort()
	.flatMap(name => JSON.parse(readFileSync(resolve(import.meta.dirname, name), 'utf8')) as SourceRebase[]);
const rebases = sourceRebases;
if (new Set(rebases.map(entry => entry.file)).size !== rebases.length) throw new Error('Duplicate upstream source rebase');

const sha256 = (source: string): string => createHash('sha256').update(source).digest('hex');
/** Restore only pinned upstream adaptations before replaying the unchanged historical proofs. */
export function restoreUpstreamDevelopBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase || sha256(source) === rebase.baselineSha256) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from reviewed upstream develop: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Upstream develop boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Upstream develop baseline differs: ${file}`);
	return source;
}

const localeCache = new Map<string, { current: Map<string, RuntimeLocaleDictionary>; baseline: Map<string, RuntimeLocaleDictionary> }>();

/** Verify live loader contents before replaying the unchanged historical locale oracles. */
export function restoreUpstreamLocaleBundle(language: string, bundle: LocaleBundle): LocaleBundle {
	const modules = bundle.modules;
	if (!modules) return bundle;
	for (const rebase of rebases.filter(entry => entry.file.endsWith('.vue'))) {
		const moduleId = rebase.file.replace('packages/', '/');
		if (!Object.hasOwn(modules, moduleId)) continue;
		const source = readFileSync(resolve(import.meta.dirname, '../../../..', rebase.file), 'utf8');
		if (sha256(source) !== rebase.currentSha256) throw new Error(`Locale source differs from reviewed upstream develop: ${rebase.file}`);
		let dictionaries = localeCache.get(rebase.file);
		if (!dictionaries) {
			const collect = (text: string): Map<string, RuntimeLocaleDictionary> => new Map(parse(text).descriptor.customBlocks.filter(block => block.type === 'locale').map(block => [String(block.attrs.locale), JSON.parse(block.content) as RuntimeLocaleDictionary]));
			dictionaries = { current: collect(source), baseline: collect(restoreUpstreamDevelopBaseline(rebase.file, source)) };
			localeCache.set(rebase.file, dictionaries);
		}
		const current = dictionaries.current.get(language);
		const baseline = dictionaries.baseline.get(language);
		if (!current || !baseline || JSON.stringify(modules[moduleId]) !== JSON.stringify(current)) throw new Error(`Locale loader differs from reviewed upstream develop: ${rebase.file}:${language}`);
		modules[moduleId] = structuredClone(baseline);
	}
	return bundle;
}
