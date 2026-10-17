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
	if (file === 'packages/features/navigation/frontend/pages/admin/index.vue') {
		if (sha256(source) !== '7305c8073d05991bd85fff5c59f46c64aaa92b7e95405c325a72be883dae35c9') throw new Error(`Wallet admin source differs from reviewed edits: ${file}`);
		const restored = source.replace("\t\ticon: 'ti ti-wallet',\n\t\ttext: $locale.value.sfc.walletChains,\n\t\tto: '/admin/wallet-chains',\n\t\tactive: currentPage.value?.route.name === 'walletChains',\n\t}, {\n", '').replace("\t\"walletChains\": \"ウォレットのチェーン設定\",\n", '');
		if (sha256(restored) !== '3ab426cb4b30b81518fbdfb2bd55f6f879d00acd957da2e88d1d6b9d55713623') throw new Error(`Wallet admin baseline was not restored: ${file}`);
		return restored;
	}
	if (file !== filePath) return source;
	if (sha256(source) !== currentSha256) throw new Error(`Wallet settings source differs from reviewed edits: ${file}`);
	const restored = source.replace(menuAddition, '').replace(labelAddition, '');
	if (sha256(restored) !== baselineSha256) throw new Error(`Wallet settings baseline was not restored: ${file}`);
	return restored;
}
