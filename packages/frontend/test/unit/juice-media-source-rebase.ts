/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

export const mediaSourceFile = 'packages/features/drive/frontend/components/MkLightbox.item.vue';
const currentSha256 = '9a5f875d7e9ed2bf1baff8d7fdfde49f439b0b58e6f576f78d0b2e230fc5ba48';
export const mediaBaselineSha256 = '1503cab69db003ae900ef34939fabb871e9493faad8ed580034f6623ef5d8e96';
const edits = [
	{
		'current': '\tinitiallyHidden?: boolean;\n',
		'baseline': '',
	},
	{
		'current': '\tinitiallyHidden: false,\n',
		'baseline': '',
	},
	{
		'current': '\tif (content.file == null) return false;\n',
		'baseline': '\tif (content.file == null) return false;\n\tconst hiddenByDefault = shouldHideFileByDefault(content.file, true);\n\tif (!hiddenByDefault) return false;\n',
	},
	{
		'current': '\tif (shouldHideFileByDefault(content.file, true)) {\n\t\treturn true;\n\t}\n\n\t// Match the caller\'s manual hiding even for non-sensitive files.\n\treturn props.initiallyHidden;\n',
		'baseline': '\treturn true;\n',
	},
] as const;
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only this reviewed UI fix before checking the unchanged locale history. */
export function restoreJuiceMediaBaseline(file: string, source: string): string {
	if (file !== mediaSourceFile) return source;
	if (sha256(source) === mediaBaselineSha256) return source;
	if (sha256(source) !== currentSha256) throw new Error(`Source differs from reviewed media visibility fix: ${file}`);
	for (const edit of edits) {
		if (source.split(edit.current).length !== 2) throw new Error(`Media visibility boundary differs: ${file}`);
		source = source.replace(edit.current, edit.baseline);
	}
	if (sha256(source) !== mediaBaselineSha256) throw new Error(`Media visibility baseline differs: ${file}`);
	return source;
}
