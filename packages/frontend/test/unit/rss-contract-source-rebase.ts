/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { restoreNativeApiSourceBaseline } from './native-api-source-rebase.js';
import rebases from './rss-contract-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only the reviewed RSS contract edits before checking frozen locale migration proofs. */
export function restoreRssContractBaseline(file: string, source: string): string {
	source = restoreNativeApiSourceBaseline(file, source);
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	const localeStart = source.indexOf('<locale locale=');
	if (localeStart < 0) throw new Error(`Missing frozen RSS locale blocks: ${file}`);
	let body = source.slice(0, localeStart);
	const locales = source.slice(localeStart);
	if (sha256(body) !== rebase.currentBodySha256 || sha256(locales) !== rebase.localeBlocksSha256) {
		throw new Error(`RSS source differs from the reviewed contract change: ${file}`);
	}
	for (const edit of [...rebase.edits].reverse()) {
		if (body.slice(edit.start, edit.end) !== edit.current) throw new Error(`RSS rebase boundary differs: ${file}`);
		body = body.slice(0, edit.start) + edit.baseline + body.slice(edit.end);
	}
	if (sha256(body) !== rebase.baselineBodySha256) throw new Error(`RSS baseline was not restored: ${file}`);
	return body + locales;
}
