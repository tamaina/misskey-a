/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { describe, expect, test } from 'vitest';
import { codeToHtml } from 'shiki';
import { codeDiffTransformer, getCodeDiff } from '../../frontend/utility/code-diff.js';

describe('Shiki code differences', () => {
	test('separates replacements without a final newline', () => {
		expect(getCodeDiff('old', 'new')).toEqual([{ text: 'old', kind: 'remove' }, { text: 'new', kind: 'add' }]);
	});
	test('keeps changed empty lines', () => {
		expect(getCodeDiff('one\n', 'one\n\n')).toContainEqual({ text: '', kind: 'add' });
	});
	test('keeps CRLF lines and literal transformer notation', () => {
		expect(getCodeDiff('old\r\n', '// [!code ++]\r\n')).toEqual([{ text: 'old', kind: 'remove' }, { text: '// [!code ++]', kind: 'add' }]);
	});
	test('supports an empty baseline and a deleted target', () => {
		expect(getCodeDiff('', 'new')).toEqual([{ text: 'new', kind: 'add' }]);
		expect(getCodeDiff('old', '')).toEqual([{ text: 'old', kind: 'remove' }]);
	});
	test('retains five context lines and compacts a large unchanged region', () => {
		const before = Array.from({ length: 10000 }, (_, i) => `line ${i}`).join('\n');
		const after = before.replace('line 5000\n', 'changed\n');
		const rows = getCodeDiff(before, after);
		expect(rows).toHaveLength(14);
		expect(rows[0].kind).toBe('omit');
		expect(rows.at(-1)?.kind).toBe('omit');
		expect(rows.filter(row => row.kind === 'context')).toHaveLength(10);
	});
	test('renders escaped text and visible signs using actual Shiki 4', async () => {
		const rows = getCodeDiff('<script>old</script>', '<img src=x onerror=alert(1)> // [!code ++]');
		const html = await codeToHtml(rows.map(row => row.text).join('\n'), { lang: 'text', theme: 'dark-plus', transformers: [codeDiffTransformer(rows)] });
		expect(html).toContain('class="line diff remove"');
		expect(html).toContain('class="line diff add"');
		expect(html).toContain('class="diff-sign">-');
		expect(html).toContain('class="diff-sign">+');
		expect(html).toContain('&#x3C;script>');
		expect(html).toContain('// [!code ++]');
		expect(html).not.toContain('<img');
	});
});

for (const [before, after, kind] of [['one\n', 'one\n\n', 'add'], ['one\n\n', 'one\n', 'remove']]) {
	test(`actual Shiki keeps a changed final empty ${kind} line`, async () => {
		const rows = getCodeDiff(before, after);
		const html = await codeToHtml(rows.map(row => row.text).join('\n'), { lang: 'text', theme: 'dark-plus', transformers: [codeDiffTransformer(rows)] });
		expect(html).toContain(`class="line diff ${kind}"`);
		expect(html.match(/class="diff-sign"/g)).toHaveLength(rows.length);
		expect(html).toContain(`<span class="diff-sign">${kind === 'add' ? '+' : '-'}</span><span></span></span>`);
	});
}
