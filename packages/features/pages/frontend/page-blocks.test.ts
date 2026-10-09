/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { describe, expect, test } from 'vitest';
import { getKnownPageBlocks, isKnownPageBlock, replaceKnownPageBlocks } from './page-blocks.js';

describe('page block content', () => {
	const first: Misskey.entities.PageBlock = { id: 'first', type: 'text', text: 'first' };
	const deprecated: Misskey.entities.PageBlock = { id: 'deprecated', type: 'button' };
	const last: Misskey.entities.PageBlock = { id: 'last', type: 'note', detailed: false, note: null };
	const opaque = { extension: 'keep me' };
	const content = [first, opaque, deprecated, last];

	test('recognizes valid and deprecated blocks while excluding opaque content', () => {
		expect(isKnownPageBlock(first)).toBe(true);
		expect(isKnownPageBlock(deprecated)).toBe(true);
		expect(isKnownPageBlock(opaque)).toBe(false);
		expect(getKnownPageBlocks(content)).toEqual([first, deprecated, last]);
	});

	test('reorders recognized blocks without moving or replacing opaque entries', () => {
		const reordered = replaceKnownPageBlocks(content, [last, first, deprecated]);

		expect(reordered).toEqual([last, opaque, first, deprecated]);
		expect(reordered[1]).toBe(opaque);
	});

	test('removes a recognized block and keeps opaque entries', () => {
		const reordered = replaceKnownPageBlocks(content, [deprecated, last]);

		expect(reordered).toEqual([deprecated, opaque, last]);
		expect(reordered[1]).toBe(opaque);
	});

	test('round-trips unknown entries unchanged when recognized blocks are unmodified', () => {
		const roundTripped = replaceKnownPageBlocks(content, getKnownPageBlocks(content));

		expect(roundTripped).toEqual(content);
		expect(roundTripped[1]).toBe(opaque);
	});

	test('keeps valid section children visible while retaining an opaque child', () => {
		const validChild: Misskey.entities.PageBlock = { id: 'child', type: 'text', text: 'visible' };
		const opaqueChild = { extension: { untouched: true } };
		const section = {
			id: 'section',
			type: 'section',
			title: 'Section',
			children: [validChild, opaqueChild],
		};

		expect(isKnownPageBlock(section)).toBe(true);
		expect(getKnownPageBlocks(section.children)).toEqual([validChild]);
		const childrenAfterEdit = replaceKnownPageBlocks(section.children, [validChild]);
		expect(childrenAfterEdit).toEqual([validChild, opaqueChild]);
		expect(childrenAfterEdit[1]).toBe(opaqueChild);
	});
});
