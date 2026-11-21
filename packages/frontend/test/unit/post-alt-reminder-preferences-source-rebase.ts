/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

const preferences = 'packages/features/preferences/frontend/pages/settings/preferences.vue';
const sha256 = (source: string): string => createHash('sha256').update(source).digest('hex');

// The original #369 source and its GitHub merge ref against develop@1a245398.
const reviewedSources = new Map([
	['8fbd261879ccce03fda487c46fe08a726a0e63df49870bff649fe44cdfb284b8', '33e7852029af421de26b922a7b4c8bf1d9a38291d24dd8fdbf550b5e33cd05ae'],
	['e375d5e30e5574c840cbd5fcbc227c8feafe8278968b171071dd3131b0ee6a66', 'e2a3288bd0f6107765accbdf5001e3e5c9b32990a989732425bf266f7339e18c'],
]);

const reminderInsertions = [
	'\t\t\t\t\t\t\t<SearchMarker :keywords="[\'alt text\', \'accessibility\', \'image\', \'caption\', \'attachment\', \'warning\']">\n\t\t\t\t\t\t\t\t<MkPreferenceContainer k="warnMissingImageAltText">\n\t\t\t\t\t\t\t\t\t<MkSwitch v-model="warnMissingImageAltText">\n\t\t\t\t\t\t\t\t\t\t<template #label><SearchLabel>{{ $locale.sfc.warnMissingImageAltText }}</SearchLabel></template>\n\t\t\t\t\t\t\t\t\t</MkSwitch>\n\t\t\t\t\t\t\t\t</MkPreferenceContainer>\n\t\t\t\t\t\t\t</SearchMarker>\n\n',
	'const warnMissingImageAltText = prefer.model(\'warnMissingImageAltText\');\n',
	'\t"warnMissingImageAltText": "Confirm before posting images without alt text",\n',
	'\t"warnMissingImageAltText": "画像に代替テキストがないとき、投稿前に確認する",\n',
] as const;

/** Peel off only the reviewed reminder insertions before replaying the older proofs. */
export function restoreAltReminderPreferencesBaseline(file: string, source: string): string {
	if (file !== preferences) return source;
	const baseline = reviewedSources.get(sha256(source));
	// Unrecognized input is still checked by the strict Crowdin/global proof.
	if (!baseline) return source;
	for (const insertion of reminderInsertions) {
		if (!source.includes(insertion) || source.indexOf(insertion) !== source.lastIndexOf(insertion)) throw new Error('ALT reminder preferences boundary differs');
		source = source.replace(insertion, '');
	}
	if (sha256(source) !== baseline) throw new Error('ALT reminder preferences baseline differs');
	return source;
}
