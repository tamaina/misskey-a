/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import rebases from './upstream-common-utilities-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse exact reviewed PR17994 utility edits while preserving frozen locale proofs. */
export function restoreCommonUtilitiesBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	const localeStart = source.search(/<locale\s/);
	let body = localeStart < 0 ? source : source.slice(0, localeStart);
	const locales = localeStart < 0 ? '' : source.slice(localeStart);
	if (sha256(body) !== rebase.currentBodySha256 || sha256(locales) !== rebase.localeBlocksSha256) {
		throw new Error(`Source differs from the reviewed common utility change: ${file}`);
	}
	for (const edit of [...rebase.edits].reverse()) {
		if (body.slice(edit.start, edit.end) !== edit.current) throw new Error(`Common utility rebase boundary differs: ${file}`);
		body = body.slice(0, edit.start) + edit.baseline + body.slice(edit.end);
	}
	if (sha256(body) !== rebase.baselineBodySha256) throw new Error(`Common utility baseline was not restored: ${file}`);
	return body + locales;
}
