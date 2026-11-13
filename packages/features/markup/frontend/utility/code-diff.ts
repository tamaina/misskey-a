/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { diffLines } from 'diff';
import type { ShikiTransformer } from 'shiki';

export type DiffLine = { text: string; kind: 'add' | 'remove' | 'context' | 'omit' };

/** Keep line boundaries separate from source text: notation in user text stays literal. */
export function getCodeDiff(before: string, after: string, context = 5): DiffLine[] {
	const rows = diffLines(before, after).flatMap(part => {
		const lines = part.value.split(/\r?\n/);
		if (lines.at(-1) === '') lines.pop();
		return lines.map(text => ({ text, kind: part.added ? 'add' : part.removed ? 'remove' : 'context' } as DiffLine));
	});
	const visible = new Set<number>();
	for (let i = 0; i < rows.length; i++) {
		if (rows[i].kind === 'context') continue;
		for (let j = Math.max(0, i - context); j <= Math.min(rows.length - 1, i + context); j++) visible.add(j);
	}
	// Identical inputs still show their text, as the ordinary code viewer does.
	if (visible.size === 0) return rows;
	const result: DiffLine[] = [];
	for (let i = 0; i < rows.length; i++) {
		if (visible.has(i)) result.push(rows[i]);
		else if (result.at(-1)?.kind !== 'omit') result.push({ text: '…', kind: 'omit' });
	}
	return result;
}

export function codeDiffTransformer(rows: DiffLine[]): ShikiTransformer {
	return {
		name: 'misskey-code-diff',
		line(node, line) {
			const kind = rows[line - 1]?.kind;
			if (kind === 'add' || kind === 'remove') {
				this.addClassToHast(node, ['diff', kind]);
			} else if (kind === 'omit') this.addClassToHast(node, 'diff-omit');
			node.children.unshift({ type: 'element', tagName: 'span', properties: { class: 'diff-sign' }, children: [{ type: 'text', value: kind === 'add' ? '+' : kind === 'remove' ? '-' : ' ' }] });
		},
	};
}
