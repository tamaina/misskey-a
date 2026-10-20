/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { parse } from 'vue/compiler-sfc';
import rebases from './channel-federation-source-rebase.json';
import { restoreChannelFederationSourceBaseline } from './channel-federation-source-rebase.js';

const root = resolve(import.meta.dirname, '../../../..');

test.each(rebases)('$file restores the exact pre-federation source, preserves CSS and rejects unreviewed changes', proof => {
	const source = readFileSync(resolve(root, proof.file), 'utf8');
	const restored = restoreChannelFederationSourceBaseline(proof.file, source);
	expect(createHash('sha256').update(restored).digest('hex')).toBe(proof.baselineSha256);
	const current = parse(source, { filename: proof.file });
	const baseline = parse(restored, { filename: proof.file });
	expect(current.errors).toEqual([]);
	expect(baseline.errors).toEqual([]);
	expect(current.descriptor.styles.map(block => ({ attrs: block.attrs, content: block.content }))).toEqual(baseline.descriptor.styles.map(block => ({ attrs: block.attrs, content: block.content })));
	expect(() => restoreChannelFederationSourceBaseline(proof.file, '// unreviewed\n' + source)).toThrow('Source differs');
	expect(() => restoreChannelFederationSourceBaseline(proof.file, source + '\n')).toThrow('Source differs');
});

test('channel exploration reuses user Explore local/remote labels in every existing locale', () => {
	const dictionaries = (file: string) => new Map(parse(readFileSync(resolve(root, file), 'utf8'), { filename: file }).descriptor.customBlocks
		.filter(block => block.type === 'locale')
		.map(block => [String(block.attrs.locale), JSON.parse(block.content) as Record<string, string>]));
	const channels = dictionaries('packages/features/channels/frontend/pages/channels.vue');
	const users = dictionaries('packages/features/discovery/frontend/pages/explore.users.vue');
	expect(channels.size).toBe(28);
	for (const [language, labels] of channels) {
		expect({ local: labels.local, remote: labels.remote }).toEqual({ local: users.get(language)?.local, remote: users.get(language)?.remote });
	}
});
