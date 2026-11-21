/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
import { readApkgMaterial } from '../../backend/apkg-material.js';

async function fixture(name: string) {
	const bytes = await readFile(`../features/games/fukushu/test/backend/fixtures/apkg/${name}`);
	const digest = createHash('sha256').update(bytes).digest('hex');
	return { bytes, digest };
}

test.each(['basic-anki21.apkg', 'basic-21b.apkg'])('imports stock Basic cards from Anki export %s without evaluating HTML', async name => {
	const { bytes, digest } = await fixture(name);
	const material = await readApkgMaterial(bytes, name, digest);
	expect(material.deck).toMatchObject({
		name: '取込テスト', sourceType: 'anki-apkg', sourceFileName: name, sourceHash: digest,
		questionCount: 2, enabledQuestionCount: 2,
	});
	expect(material.questions.map(row => row.payload)).toEqual(expect.arrayContaining([
		expect.objectContaining({ prompt: { format: 'plain', value: '同じ質問' }, answer: { format: 'plain', value: '最初の答え' } }),
		expect.objectContaining({ prompt: { format: 'plain', value: '別の質問' }, answer: { format: 'plain', value: '安全なプレーンテキスト' } }),
	]));
	const retry = await readApkgMaterial(bytes, 'renamed.apkg', digest);
	expect(retry.deck.id).toBe(material.deck.id);
	expect(retry.questions.map(row => row.id)).toEqual(material.questions.map(row => row.id));
});

test.each(['basic-ja-anki21.apkg', 'basic-ja-21b.apkg'])('imports Anki’s stock Japanese Basic template: %s', async name => {
	const { bytes, digest } = await fixture(name);
	const material = await readApkgMaterial(bytes, name, digest);
	expect(material.deck).toMatchObject({ name: '日本語版 標準テスト', sourceType: 'anki-apkg', questionCount: 1 });
	expect(material.questions.map(row => row.payload)).toEqual([expect.objectContaining({
		prompt: { format: 'plain', value: '日本の首都は？' },
		answer: { format: 'plain', value: '東京' },
	})]);
});

test('uses the actual customized Japanese front instead of assuming English Basic ordering', async () => {
	const name = 'custom-ja-21b.apkg';
	const { bytes, digest } = await fixture(name);
	const material = await readApkgMaterial(bytes, name, digest);
	expect(material.questions[0].payload.prompt.value).toBe('東京');
});

test('retains tags on a static card rather than discarding them', async () => {
	const name = 'tagged-21b.apkg';
	const { bytes, digest } = await fixture(name);
	const material = await readApkgMaterial(bytes, name, digest);
	expect(material.questions.some(row => row.payload.ankiTemplate?.tags?.includes('not-supported'))).toBe(true);
});

test('converts an Anki-generated static template with CSS and keeps source provenance separate', async () => {
	const name = 'static-custom-21b.apkg';
	const { bytes, digest } = await fixture(name);
	const material = await readApkgMaterial(bytes, name, digest);
	expect(material.questions[0].payload).toMatchObject({
		prompt: { format: 'plain', value: '箱' }, answer: { format: 'plain', value: 'box' },
		ankiTemplate: {
			frontHtml: '<div class="prompt">箱</div>', backHtml: '<strong class="answer">box</strong>',
			noteType: 'Custom vocabulary', tags: ['synthetic'],
			source: { qfmt: '<div class="prompt">{{Front}}</div>', afmt: '<strong class="answer">{{Back}}</strong>', ordinal: 0 },
		},
	});
	expect(material.questions[0].payload.ankiTemplate?.css).toContain('.prompt');
});

test.each(['interactive-custom-21b.apkg', 'generated-anki-25.09.apkg'])('refuses an export with unsupported contents rather than dropping them: %s', async name => {
	const { bytes, digest } = await fixture(name);
	await expect(readApkgMaterial(bytes, name, digest)).rejects.toMatchObject({ code: 'APKG_UNSUPPORTED' });
});

test('refuses corrupt archive bytes and wrong Drive digests', async () => {
	const bytes = Buffer.from('Not an Anki archive');
	const digest = createHash('sha256').update(bytes).digest('hex');
	await expect(readApkgMaterial(bytes, 'test.apkg', digest)).rejects.toMatchObject({ code: 'APKG_INVALID' });
	const actual = await fixture('basic-21b.apkg');
	await expect(readApkgMaterial(actual.bytes, 'basic-21b.apkg', digest)).rejects.toMatchObject({ code: 'APKG_INVALID' });
});
