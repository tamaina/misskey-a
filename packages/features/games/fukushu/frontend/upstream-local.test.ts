/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, test, vi } from 'vitest';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { inspectLocalUpstream } from './upstream-local.js';

afterEach(() => vi.unstubAllGlobals());
const bytes = readFileSync('../features/games/fukushu/test/backend/fixtures/upstream-backup.fukushu');

test('Web Crypto reads the upstream writer fixture without network or browser storage', async () => {
	vi.stubGlobal('crypto', webcrypto);
	const fetch = vi.fn(() => { throw new Error('Network forbidden'); }); vi.stubGlobal('fetch', fetch);
	const local = vi.spyOn(Storage.prototype, 'setItem');
	try {
		const result = await inspectLocalUpstream(new File([new Uint8Array(bytes)], 'original.fukushu'));
		expect(result).toMatchObject({ imported: false, canImport: false, counts: { decks: 1, questions: 2, reviewLogs: 2 } });
		expect(result.history.every(row => row.questionSnapshot === 'unavailable' && row.cardBefore === null && row.scheduler === null)).toBe(true);
		expect(fetch).not.toHaveBeenCalled(); expect(local).not.toHaveBeenCalled();
	} finally { local.mockRestore(); }
});

test('rejects file size and extension before reading file contents', async () => {
	for (const [name, size, code] of [['big.fukushu', MAX_BACKUP_BYTES + 1, 'BACKUP_TOO_LARGE'], ['unknown.json', 1, 'INVALID_BACKUP']] as const) {
		const arrayBuffer = vi.fn();
		await expect(inspectLocalUpstream({ name, size, arrayBuffer } as unknown as File)).rejects.toThrow(code);
		expect(arrayBuffer).not.toHaveBeenCalled();
	}
});

test('Web Crypto rejects altered bytes rather than returning a partial report', async () => {
	vi.stubGlobal('crypto', webcrypto);
	const bad = new Uint8Array(bytes); bad[bad.length - 1] ^= 1;
	await expect(inspectLocalUpstream(new File([bad], 'altered.fukushu'))).rejects.toThrow('INVALID_BACKUP');
});
