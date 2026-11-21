/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { restoreWalletSettingsBaseline } from './wallet-settings-source-rebase.js';

const file = 'packages/features/navigation/frontend/pages/settings/index.vue';
const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../..', file), 'utf8');

describe('reviewed wallet settings source preservation', () => {
	test('reconstructs the immutable pre-wallet source, including every original locale byte', () => {
		const restored = restoreWalletSettingsBaseline(file, source);
		expect(createHash('sha256').update(restored).digest('hex')).toBe('f3a3a1144c39efdf9b163598e748d694ea9576e8392d500d1cf799b162e39227');
		expect(source).toContain('to: \'/settings/wallets\'');
		expect(source).toContain('to: \'/settings/residence\'');
		expect(restored).not.toContain('to: \'/settings/residence\'');
		expect(source).toContain('"wallets": "ウォレット"');
		expect(restored).not.toContain('to: \'/settings/wallets\'');
	});

	test('rejects unreviewed menu or existing locale changes', () => {
		expect(() => restoreWalletSettingsBaseline(file, source.replace('to: \'/settings/wallets\'', 'to: \'/settings/other\''))).toThrow('source differs');
		expect(() => restoreWalletSettingsBaseline(file, source.replace('"settings":', '"changedSettings":'))).toThrow('source differs');
		expect(() => restoreWalletSettingsBaseline(file, source.replace('"wallets": "ウォレット"', '"wallets": "変更"'))).toThrow('source differs');
	});

	test('rejects unreviewed residence menu and label changes', () => {
		expect(() => restoreWalletSettingsBaseline(file, source.replace('to: \'/settings/residence\'', 'to: \'/settings/unknown\''))).toThrow('source differs');
		expect(() => restoreWalletSettingsBaseline(file, source.replace('支払い用の居住地', 'Changed residence'))).toThrow('source differs');
	});

	test('does not alter another component', () => {
		expect(restoreWalletSettingsBaseline('another.vue', source)).toBe(source);
	});
});

const adminFile = 'packages/features/navigation/frontend/pages/admin/index.vue';
const adminSource = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../..', adminFile), 'utf8');
test('admin navigation preserves every historical source byte and rejects unrelated edits', () => {
	const restored = restoreWalletSettingsBaseline(adminFile, adminSource);
	expect(restored).not.toContain('to: \'/admin/wallet-chains\'');
	expect(restored).not.toContain('"walletChains":');
	expect(() => restoreWalletSettingsBaseline(adminFile, adminSource.replace('"general":', '"changedGeneral":'))).toThrow('source differs');
});
