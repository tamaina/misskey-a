/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { strictEqual } from 'node:assert';
import { expect, test, vi } from 'vitest';
import { NoteCreateService } from '../../backend/services/NoteCreateService.js';
import { waitForReplyCount } from '../../../../backend/test-federation/test/note-readiness.js';

test('actual saveReply can complete after the first read, while readiness returns the exact updated note', async () => {
	let repliesCount = 0;
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	const increment = vi.fn(async () => { await gate; repliesCount++; });
	const service = Object.create(NoteCreateService.prototype) as NoteCreateService;
	Reflect.set(service, 'notesRepository', { increment });
	const saveReply: unknown = Reflect.get(service, 'saveReply');
	if (typeof saveReply !== 'function') throw new Error('Expected actual saveReply method');
	Reflect.apply(saveReply, service, [{ id: 'parent' }, { id: 'reply' }]);
	expect(increment).toHaveBeenCalledExactlyOnceWith({ id: 'parent' }, 'repliesCount', 1);
	// The historical assertion fails before the actual asynchronous write finishes.
	expect(() => strictEqual(repliesCount, 1)).toThrow();
	let firstRead!: () => void;
	const readReached = new Promise<void>(resolve => { firstRead = resolve; });
	let successfulNote: { id: string; text: string; repliesCount: number } | undefined;
	const read = vi.fn(async () => {
		const note = { id: 'parent', text: 'preserved', repliesCount };
		if (note.repliesCount === 1) successfulNote = note;
		firstRead();
		return note;
	});
	const ready = waitForReplyCount(read, 1, { timeout: 1000, interval: 1 });
	await readReached;
	expect(repliesCount).toBe(0);
	release();
	const note = await ready;
	expect(note).toBe(successfulNote);
	expect(note).toEqual({ id: 'parent', text: 'preserved', repliesCount: 1 });
});

test.each([0, 2])('readiness rejects an incorrect stable reply count %i', async repliesCount => {
	await expect(waitForReplyCount(async () => ({ repliesCount }), 1, { timeout: 30, interval: 1 })).rejects.toThrow();
});

test('readiness preserves read failures instead of accepting stale data', async () => {
	const failure = new Error('synthetic read failure');
	await expect(waitForReplyCount(async () => { throw failure; }, 1, { timeout: 30, interval: 1 })).rejects.toBe(failure);
});
