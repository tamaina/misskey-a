/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import rebases from './pwa-share-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse only the reviewed PWA edits before applying frozen migration proofs. */
export function restorePwaShareSourceBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	const localeStart = source.search(/<locale\s/);
	let body = localeStart < 0 ? source : source.slice(0, localeStart);
	let locales = localeStart < 0 ? '' : source.slice(localeStart);
	if (sha256(body) !== rebase.currentBodySha256 || sha256(locales) !== rebase.currentLocaleBlocksSha256) {
		throw new Error(`Source differs from the reviewed PWA share change: ${file}`);
	}
	for (const edit of [...rebase.bodyEdits].reverse()) {
		if (body.slice(edit.start, edit.end) !== edit.current) throw new Error(`PWA body rebase boundary differs: ${file}`);
		body = body.slice(0, edit.start) + edit.baseline + body.slice(edit.end);
	}
	for (const edit of [...rebase.localeEdits].reverse()) {
		if (locales.slice(edit.start, edit.end) !== edit.current) throw new Error(`PWA locale rebase boundary differs: ${file}`);
		locales = locales.slice(0, edit.start) + edit.baseline + locales.slice(edit.end);
	}
	if (sha256(body) !== rebase.baselineBodySha256 || sha256(locales) !== rebase.baselineLocaleBlocksSha256) {
		throw new Error(`PWA baseline was not restored: ${file}`);
	}
	return body + locales;
}
