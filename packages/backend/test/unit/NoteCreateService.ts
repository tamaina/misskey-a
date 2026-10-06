/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, expect } from 'vitest';
import { isCreationRenote, isCreationQuote } from '@misskey-a/notes/shared';

describe('Note creation predicates', () => {
	describe('is-renote', () => {
		const base = { id: 'some-note-id' };
		const poll = { choices: ['kinoko', 'takenoko'], multiple: false, expiresAt: null };
		const file = { id: 'some-file-id' };

		test('note without renote should not be Renote', () => {
			const note = { renote: null };
			expect(isCreationRenote(note)).toBe(false);
		});

		test('note with renote should be Renote and not be Quote', () => {
			const note = { renote: base };
			expect(isCreationRenote(note)).toBe(true);
			expect(isCreationQuote(note)).toBe(false);
		});

		test('note with renote and text should be Quote', () => {
			const note = { renote: base, text: 'some-text' };
			expect(isCreationRenote(note)).toBe(true);
			expect(isCreationQuote(note)).toBe(true);
		});

		test('note with renote and cw should be Quote', () => {
			const note = { renote: base, cw: 'some-cw' };
			expect(isCreationRenote(note)).toBe(true);
			expect(isCreationQuote(note)).toBe(true);
		});

		test('note with renote and reply should be Quote', () => {
			const note = { renote: base, reply: { ...base, id: 'another-note-id' } };
			expect(isCreationRenote(note)).toBe(true);
			expect(isCreationQuote(note)).toBe(true);
		});

		test('note with renote and poll should be Quote', () => {
			const note = { renote: base, poll };
			expect(isCreationRenote(note)).toBe(true);
			expect(isCreationQuote(note)).toBe(true);
		});

		test('note with renote and non-empty files should be Quote', () => {
			const note = { renote: base, files: [file] };
			expect(isCreationRenote(note)).toBe(true);
			expect(isCreationQuote(note)).toBe(true);
		});
	});
});
