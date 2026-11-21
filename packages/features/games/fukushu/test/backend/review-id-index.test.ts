/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { ReviewIdIndex } from '../../shared/review-id-index.js';

test('keeps distinct IDs with the same SHA-256 prefix and detects exact repeats after growth', async () => {
	// These two JSON string IDs both hash to a prefix of ec1a045a.
	const ids = ['review-31678', 'review-40804', '\ud800', '\ufffd', ...Array.from({ length: 4000 }, (_, i) => String(i))];
	const parts = [Buffer.from('FUKUSHU-BACKUP-1\n')];
	const offsets = [];
	let position = parts[0].length;
	for (const id of ids) {
		const json = Buffer.from(JSON.stringify({ store: 'reviewLogs', value: { id } }));
		const prefix = Buffer.alloc(4);
		prefix.writeUInt32LE(json.length);
		offsets.push(position);
		parts.push(prefix, json);
		position += 4 + json.length;
	}
	const index = new ReviewIdIndex(new Blob(parts));
	for (const [i, id] of ids.entries()) expect(await index.add(id, offsets[i])).toBe(true);
	for (const i of [0, 1, 2, 3, ids.length - 1]) expect(await index.add(ids[i], offsets[i])).toBe(false);
});
