/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import rebases from './channel-federation-source-rebase.json';

const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Reverse the browser-verified narrow-grid fix without changing historical locale proof hashes. */
export function restoreChannelExploreLayoutBaseline(file: string, source: string): string {
	if (file !== 'packages/features/channels/frontend/pages/channels.vue') return source;
	if (sha256(source) !== 'd7dad390d0feca3f41009f3262fdcb06b98db004f202223db25d4b91f4342c5b') {
		throw new Error(`Source differs from the reviewed channel layout fix: ${file}`);
	}
	return source.replace(
		'grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));',
		'grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));',
	);
}

/** Reverse only the reviewed channel federation controls before checking frozen locale proofs. */
export function restoreChannelFederationSourceBaseline(file: string, source: string): string {
	const rebase = rebases.find(entry => entry.file === file);
	if (!rebase) return source;
	source = restoreChannelExploreLayoutBaseline(file, source);
	if (sha256(source) !== rebase.currentSha256) throw new Error(`Source differs from the reviewed channel federation change: ${file}`);
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error(`Channel federation rebase boundary differs: ${file}`);
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (sha256(source) !== rebase.baselineSha256) throw new Error(`Channel federation baseline was not restored: ${file}`);
	return source;
}
