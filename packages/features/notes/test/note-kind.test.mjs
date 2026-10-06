/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCreationRenote, isCreationQuote } from '../built/shared/index.js';

test('renote checks the related object, without infrastructure or entities', () => {
	for (const note of [{}, { renote: null }, { renote: undefined }]) assert.equal(isCreationRenote(note), false);
	assert.equal(isCreationRenote({ renote: { id: 'note' } }), true);
});

test('bare renotes and empty attachments are not quotes', () => {
	const renote = { id: 'note' };
	for (const fields of [{}, { text: null, cw: null, reply: null, poll: null }, { files: [] }, { files: null }]) {
		assert.equal(isCreationQuote({ renote, ...fields }), false);
	}
});

test('each content form makes a quote, including empty text and CW', () => {
	for (const fields of [{ text: 'text' }, { text: '' }, { cw: 'cw' }, { cw: '' }, { reply: {} }, { poll: {} }, { files: [{}] }]) {
		assert.equal(isCreationQuote({ renote: {}, ...fields }), true);
	}
});
