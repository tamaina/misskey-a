/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { restoreMfmIntegrationBaseline } from './mfm-integration-source-rebase.js';

export const nyaizePreferencesFile = 'packages/features/preferences/frontend/pages/settings/preferences.vue';
export const nyaizePreferencesBaseline = '29749ad8071bdf46376d8f2de1de901371d6a262e6586e58ea3e39d783428593';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

export function restoreNyaizePreferencesBaseline(file: string, source: string): string {
	if (file !== nyaizePreferencesFile) return source;
	source = restoreMfmIntegrationBaseline(file, source);
	if (sha256(source) === nyaizePreferencesBaseline) return source;
	if (sha256(source) !== '373bc0d91c0dceeea741b45edadcdd61e3be96033a785713632bda0561517e74') throw new Error(`Unreviewed nyaize preferences source: ${file}`);
	const restored = source
		.replace('\t\t\t\t\t\t\t<MkNyaizePreference/>\n\n', '')
		.replace('import MkNyaizePreference from \'@features/preferences/frontend/components/MkNyaizePreference.vue\';\n', '');
	if (sha256(restored) !== nyaizePreferencesBaseline) throw new Error(`Nyaize preferences baseline differs: ${file}`);
	return restored;
}

export const nyaizeMfmFile = 'packages/features/markup/frontend/components/global/MkMfm.ts';
export function restoreNyaizeMfmBaseline(file: string, source: string): string {
	if (file !== nyaizeMfmFile) return source;
	source = restoreMfmIntegrationBaseline(file, source);
	if (sha256(source) === 'be76c96b093e9410c1fb21ae07c339a22e1c169e48eb86ee8cfe1491c9c92a98') return source;
	if (sha256(source) !== '4ba65da292a78ce76b51b3683fb14d37793e18bef448fffa3c7b17500fcedaf3') throw new Error(`Unreviewed nyaize adapter source: ${file}`);
	const restored = source.replace('\t\tdisableNyaize: prefer.r.disableNoteNyaize.value,\n', '');
	if (sha256(restored) !== 'be76c96b093e9410c1fb21ae07c339a22e1c169e48eb86ee8cfe1491c9c92a98') throw new Error(`Nyaize adapter baseline differs: ${file}`);
	return restored;
}
