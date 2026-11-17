/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { markRaw, ref } from 'vue';
export const popup = ref(null);
export const prefer = { s: { animation: false, enableHighQualityImagePlaceholders: true, nsfw: 'respect', dataSaver: { media: false }, loadRawImages: true, mediaListWithOneImageAppearance: '16_9', useNativeUiForVideoAudioPlayer: true }, r: { enableInfiniteScroll: ref(false) } };
export const $i = null;
export const instance = {};
export const lang = 'en-US';
export const themeManager = { on() {}, off() {} };
export const miLocalStorage = { getItem: () => null, getItemAsJson: () => null, setItem() {} };
export const claimZIndex = () => 1000;
export const getFileMenu = () => [];
export const getStaticImageUrl = url => url;
export const confirm = async () => ({ canceled: false });
export function popupMenu() {}
export function contextMenu() {}
export async function popupAsyncWithDialog(component, props, events) {
	const dispose = () => { popup.value = null; };
	popup.value = { component: markRaw(await component), props, events };
	return { dispose };
}

export function toast() {}
