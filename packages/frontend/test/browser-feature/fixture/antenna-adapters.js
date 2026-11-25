/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ref, shallowRef } from 'vue';
export const menu = shallowRef(null);
export const saved = ref(JSON.parse(sessionStorage.getItem('synthetic-antenna') ?? 'null'));
export const request = ref(null);
export const prefer = { s: { animation: false, menuStyle: 'popup', enableHapticFeedback: false }, r: { enableInfiniteScroll: ref(false) } };
export const $i = null;
export const instance = {};
export const lang = 'ja-JP';
export const themeManager = { on() {}, off() {} };
export const miLocalStorage = { getItem: () => null, getItemAsJson: () => null, setItem() {} };
export const claimZIndex = () => 1000;
export const misskeyApi = async () => [];
export function popupMenu(items, anchorElement, options = {}) {
	return new Promise(resolve => { menu.value = { items, anchorElement, ...options, resolve }; });
}
export function closeMenu() { menu.value?.resolve(); menu.value = null; }
export async function apiWithDialog(endpoint, input) {
	request.value = { endpoint, input };
	saved.value = { ...input, id: input.antennaId ?? 'synthetic-antenna' };
	sessionStorage.setItem('synthetic-antenna', JSON.stringify(saved.value));
	return saved.value;
}
export const confirm = async () => ({ canceled: true });
export function success() {}
export function popup() { throw new Error('Unexpected autocomplete popup in fixture'); }
export function selectUser() { throw new Error('Unexpected user selection in fixture'); }

export class Autocomplete { constructor() { throw new Error('Autocomplete is outside this fixture'); } }
