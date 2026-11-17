/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ref } from 'vue';

export const $i = { id: 'viewer', policies: { canCreateChannel: true } };
export const prefer = { s: { animation: false, enablePullToRefresh: false }, r: { enableInfiniteScroll: ref(false) } };
export const instance = {};
export const lang = 'en-US';
export const themeManager = { on() {}, off() {} };
export const miLocalStorage = { getItem: () => null, getItemAsJson: () => null, setItem() {} };
export class Autocomplete { detach() {} }
export function useRouter() { return {}; }
export function definePage(value) { window.document.title = value().title; }
export function contextMenu() {}
const fixture = window.channelFixture = { calls: [], hold: null, pending: [], failNext: false };

export async function misskeyApi(endpoint, params) {
	fixture.calls.push({ endpoint, params: structuredClone(params) });
	if (fixture.hold === `${endpoint}:${params.origin}` || fixture.hold === 'older' && params.untilId) {
		await new Promise(resolve => { fixture.pending.push(resolve); });
	}
	if (fixture.failNext) { fixture.failNext = false; throw new Error('Synthetic request failure'); }
	const origin = params.origin ?? 'personal';
	const count = endpoint === 'channels/search' ? params.untilId ? 2 : params.limit : 2;
	return Array.from({ length: count }, (_, index) => ({
		id: `${origin[0]}${String((params.untilId ? 50 : 100) - index).padStart(15, '0')}`,
		name: `${origin} ${endpoint === 'channels/search' ? params.query : 'channel'} ${params.untilId ? 'older ' : ''}${index + 1}`,
		description: `Synthetic ${origin} channel description`, userId: 'owner', usersCount: 3, notesCount: 7,
		createdAt: '2026-11-16T00:00:00Z', lastNotedAt: null, bannerUrl: null, isSensitive: false, isFollowing: false, isFavorited: false,
	}));
}
