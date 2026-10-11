/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

const filePath = 'packages/features/navigation/frontend/pages/settings/index.vue';
const currentSha256 = '15f543a5b30325cb9f34c2103973dbf0ca5e3eccd2a1719bf17714e2ee8d0c46';
const baselineSha256 = 'f3a3a1144c39efdf9b163598e748d694ea9576e8392d500d1cf799b162e39227';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
const menuAddition = "\t\ticon: 'ti ti-wallet',\n\t\ttext: $locale.value.sfc.wallets,\n\t\tto: '/settings/wallets',\n\t\tactive: currentPage.value?.route.name === 'wallets',\n\t}, {\n";
const labelAddition = '\t"wallets": "ウォレット",\n';

/** Reverse only the reviewed wallet navigation/ja-JP addition. All historical
 * language, key, access-range and full-source reconstruction proofs stay frozen.
 */
export function restoreWalletSettingsBaseline(file: string, source: string): string {
	if (file !== filePath) return source;
	if (sha256(source) !== currentSha256) throw new Error(`Wallet settings source differs from reviewed edits: ${file}`);
	const restored = source.replace(menuAddition, '').replace(labelAddition, '');
	if (sha256(restored) !== baselineSha256) throw new Error(`Wallet settings baseline was not restored: ${file}`);
	return restored;
}
