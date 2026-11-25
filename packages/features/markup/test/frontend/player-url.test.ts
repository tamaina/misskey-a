/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { afterEach, expect, test } from 'vitest';
import { preferState } from '../../../../frontend/test/setup.unit.js';
import { transformPlayerUrl } from '../../frontend/utility/url-preview.js';

afterEach(() => { preferState.autoplayEmbededPlayerOfUrlPreview = true; });

test.each([true, false])('generic embedded players honor autoplay=%s and keep existing parameters', enabled => {
	preferState.autoplayEmbededPlayerOfUrlPreview = enabled;
	const url = new URL(transformPlayerUrl('https://example.com/player?video=42&autoplay=1&auto_play=1'));
	expect(url.searchParams.get('video')).toBe('42');
	expect(url.searchParams.get('autoplay')).toBe(enabled ? '1' : '0');
	expect(url.searchParams.get('auto_play')).toBe(enabled ? '1' : 'false');
});

test.each(['player.twitch.tv', 'clips.twitch.tv'])('Twitch %s explicitly disables autoplay when requested', host => {
	preferState.autoplayEmbededPlayerOfUrlPreview = false;
	const url = new URL(transformPlayerUrl(`https://${host}/?autoplay=true`));
	expect(url.searchParams.get('autoplay')).toBe('false');
	expect(url.searchParams.has('parent')).toBe(true);
});
