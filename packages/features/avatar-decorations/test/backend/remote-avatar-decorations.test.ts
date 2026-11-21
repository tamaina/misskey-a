/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { fetchRemoteAvatarDecorations, normalizeRemoteAvatarDecorations, packRemoteAvatarDecorations } from '../../backend/remote-avatar-decorations.js';
import type { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';

const actor = { uri: 'https://source.example/users/alice', host: 'source.example', username: 'alice' };
const decoration = { id: 'deco123', url: 'https://cdn.example/animated.webp', angle: 0.25, flipH: true, offsetX: 0.1, offsetY: -0.1 };
const reply = (avatarDecorations: unknown) => ({ username: 'alice', host: null, avatarDecorations });
const allowed = () => true;

test('normalization bounds transforms and copies only renderer fields; empty arrays authorize removal', () => {
	expect(normalizeRemoteAvatarDecorations([{ ...decoration, name: 'untrusted', roleIdsThatCanBeUsedThisDecoration: ['admin'], scale: 999 }])).toEqual([decoration]);
	expect(normalizeRemoteAvatarDecorations([{ id: 'default', url: decoration.url }])).toEqual([{ id: 'default', url: decoration.url, angle: 0, flipH: false, offsetX: 0, offsetY: 0 }]);
	expect(normalizeRemoteAvatarDecorations([])).toEqual([]);
	expect(normalizeRemoteAvatarDecorations(undefined)).toBeUndefined();
	expect(normalizeRemoteAvatarDecorations({})).toBeUndefined();
	expect(normalizeRemoteAvatarDecorations(Array(100).fill(decoration))).toHaveLength(16);
});

test.each([
	null, [], { ...decoration, id: '' }, { ...decoration, id: 'a'.repeat(129) },
	{ ...decoration, angle: Infinity }, { ...decoration, angle: NaN }, { ...decoration, angle: 0.6 },
	{ ...decoration, offsetX: '0.1' }, { ...decoration, offsetY: -0.3 }, { ...decoration, flipH: 'false' },
])('drops malformed decoration %#', row => {
	expect(normalizeRemoteAvatarDecorations([row])).toEqual([]);
});

test.each([
	'javascript:alert(1)', 'data:image/svg+xml,evil', 'http://source.example/image', '/image.png',
	'https://user:password@source.example/image', 'https://127.0.0.1/image', 'https://[::1]/image',
	'https://[::ffff:127.0.0.1]/image', 'https://10.0.0.1/image', 'https://169.254.169.254/image',
	'https://localhost/image', 'https://localhost./image', 'https://sub.localhost/image', 'https://foo.local/image',
	'https://2130706433/image', 'https://0x7f000001/image', 'https://source.example/' + 'a'.repeat(1024),
	'https://source.example/' + 'あ'.repeat(120),
])('rejects unsafe media URL %s', url => {
	expect(normalizeRemoteAvatarDecorations([{ ...decoration, url }])).toEqual([]);
});

test('side channel requests only the actor origin, without API credentials', async () => {
	const postPublicJson = vi.fn<HttpRequestService['postPublicJson']>().mockResolvedValue(reply([decoration]));
	expect(await fetchRemoteAvatarDecorations(actor, { postPublicJson }, allowed)).toEqual([decoration]);
	expect(postPublicJson).toHaveBeenCalledWith('https://source.example/api/users/show', JSON.stringify({ username: 'alice' }));
});

test('blocked, private and mismatched actor origins cause no HTTP request', async () => {
	const postPublicJson = vi.fn<HttpRequestService['postPublicJson']>();
	for (const user of [
		{ ...actor, uri: 'https://127.0.0.1/users/alice', host: '127.0.0.1' },
		{ ...actor, uri: 'https://other.example/users/alice' },
		{ ...actor, uri: 'http://source.example/users/alice' },
	]) expect(await fetchRemoteAvatarDecorations(user, { postPublicJson }, allowed)).toBeUndefined();
	expect(await fetchRemoteAvatarDecorations(actor, { postPublicJson }, () => false)).toBeUndefined();
	expect(postPublicJson).not.toHaveBeenCalled();
});

test.each([
	{}, { username: 'other', host: null, avatarDecorations: [] },
	{ username: 'alice', host: 'third.example', avatarDecorations: [] },
	{ username: 'alice', host: null, uri: 'https://source.example/users/other', avatarDecorations: [] },
	{ username: 'alice', host: null, avatarDecorations: {} },
])('unsupported or mismatched API reply preserves old state %#', async data => {
	const postPublicJson = vi.fn<HttpRequestService['postPublicJson']>().mockResolvedValue(data);
	expect(await fetchRemoteAvatarDecorations(actor, { postPublicJson }, allowed)).toBeUndefined();
});

test('HTTP, redirect and JSON failures preserve old state', async () => {
	const postPublicJson = vi.fn<HttpRequestService['postPublicJson']>().mockRejectedValueOnce(new Error('HTTP failure'))
		.mockRejectedValueOnce(new Error('redirect blocked')).mockResolvedValueOnce('<html>unsupported</html>');
	for (let i = 0; i < 3; i++) expect(await fetchRemoteAvatarDecorations(actor, { postPublicJson }, allowed)).toBeUndefined();
});

test('remote images use the configured proxy, preserve animation, and have no raw-origin fallback', () => {
	const [packed] = packRemoteAvatarDecorations([decoration], 'https://receiver.example/proxy');
	const url = new URL(packed.url);
	expect(url.origin).toBe('https://receiver.example');
	expect(url.pathname).toBe('/proxy/image.webp');
	expect([...url.searchParams.keys()]).toEqual(['url']);
	expect(url.searchParams.get('url')).toBe(decoration.url);
	expect(packed).toMatchObject({ id: decoration.id, angle: 0.25, flipH: true, offsetX: 0.1, offsetY: -0.1 });
});
