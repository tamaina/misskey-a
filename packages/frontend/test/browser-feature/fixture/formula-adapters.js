/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { reactive } from 'vue';
export const host = 'fixture.invalid';
export const lang = 'en-US';
export const version = 'fixture';
export const prefersReducedMotion = false;
export const instance = reactive({ name: 'Synthetic server', clientOptions: JSON.parse(window.localStorage.getItem('formula-options') ?? '{"unrelated":"keep"}') });
export const serverMetadata = instance;
export const prefer = { s: { animation: false, advancedMfm: true, animatedMfm: false } };
export const $i = null;
export const iAmModerator = false;
export const iAmAdmin = false;
export function definePage() {}
export async function fetchInstance() { return instance; }
export async function misskeyApi(route) {
	if (route !== 'admin/meta') throw new Error(`Unexpected fixture API: ${route}`);
	return { clientOptions: { ...instance.clientOptions }, manifestJsonOverride: '' };
}
export async function apiWithDialog(route, input) {
	if (route !== 'admin/update-meta') throw new Error(`Unexpected fixture write: ${route}`);
	window.document.getElementById('requests').textContent = JSON.stringify([{ route, input }]);
	// Only the transport/storage are synthetic; branding.vue constructs the real request.
	Object.assign(instance.clientOptions, input.clientOptions);
	window.localStorage.setItem('formula-options', JSON.stringify(instance.clientOptions));
}
export function popupMenu(items) {
	const menu = window.document.getElementById('menu');
	menu.replaceChildren();
	for (const item of items) {
		const button = window.document.createElement('button');
		button.textContent = item.text;
		button.onclick = () => { item.action?.(new PointerEvent('click')); menu.replaceChildren(); };
		menu.append(button);
	}
}
