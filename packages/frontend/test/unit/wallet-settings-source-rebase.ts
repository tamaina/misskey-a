/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

const filePath = 'packages/features/navigation/frontend/pages/settings/index.vue';
const currentSha256 = '119c7e9aea68352c7c766f3245d219ed81af3b2cf87064846ebc8b90fef6a960';
const baselineSha256 = '71aaf8a10d4f40f98f0d0635883d38742b05f0776d7645305a6c62d6f655c1cb';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');
const menuAddition = "\t\ticon: 'ti ti-wallet',\n\t\ttext: $locale.value.sfc.wallets,\n\t\tto: '/settings/wallets',\n\t\tactive: currentPage.value?.route.name === 'wallets',\n\t}, {\n";
const labelAddition = '\t"wallets": "ウォレット",\n';

/** Reverse only the reviewed wallet navigation/ja-JP addition. All historical
 * language, key, access-range and full-source reconstruction proofs stay frozen.
 */
export function restoreWalletSettingsBaseline(file: string, source: string): string {
	if (file === 'packages/features/navigation/frontend/pages/admin/index.vue') {
		if (sha256(source) === 'c54d57322a1b97798c9ebffac42824d969a94954428e6142d929a79ed7372371') return source;
		if (sha256(source) !== '08eccb26fa69bad38f1cd1254596b67ebe823b32966f4b95cb79def19b4c8053') throw new Error(`Wallet admin source differs from reviewed edits: ${file}`);
		const restored = source.replace("\t\ticon: 'ti ti-wallet',\n\t\ttext: $locale.value.sfc.walletChains,\n\t\tto: '/admin/wallet-chains',\n\t\tactive: currentPage.value?.route.name === 'walletChains',\n\t}, {\n", '').replace("\t\"walletChains\": \"ウォレットのチェーン設定\",\n", '');
		if (sha256(restored) !== 'c54d57322a1b97798c9ebffac42824d969a94954428e6142d929a79ed7372371') throw new Error(`Wallet admin baseline was not restored: ${file}`);
		return restored;
	}
	if (file !== filePath) return source;
	if (sha256(source) === baselineSha256) return source;
	if (sha256(source) !== currentSha256) throw new Error(`Wallet settings source differs from reviewed edits: ${file}`);
	const restored = source.replace(menuAddition, '').replace(labelAddition, '');
	if (sha256(restored) !== baselineSha256) throw new Error(`Wallet settings baseline was not restored: ${file}`);
	return restored;
}
