/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import rebase from './drive-preprocessing-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Preserve the frozen locale proof across the exact reviewed image lifecycle fix. */
export function restoreDrivePreprocessingBaseline(file: string, source: string): string {
	if (file !== rebase.file) return source;
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the reviewed image preprocessing change: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Image preprocessing rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Image preprocessing baseline was not restored: ${file}`);
	return source;
}
