/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { shallowRef } from 'vue';

const role = new URL(window.location.href).searchParams.get('role') ?? 'anonymous';
export const $i = role === 'anonymous' ? null : {
	isModerator: role === 'moderator',
	isAdmin: role === 'admin',
	policies: { canManageCustomEmojis: ['moderator', 'manager', 'admin'].includes(role) },
};
export const customEmojis = shallowRef([
	{ aliases: ['canine'], name: 'feature_fox', category: 'Animals', url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' },
	{ aliases: ['feline'], name: 'feature_cat', category: null, url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' },
]);
export const customEmojiCategories = shallowRef(['Animals', null]);
const requests = [];
let disposals = 0;
const element = id => window.document.getElementById(id);

export function copyToClipboard(value) { element('copied').textContent = value; }
export async function misskeyApiGet(route, input) {
	requests.push({ route, name: input.name });
	element('requests').textContent = JSON.stringify(requests);
	const emoji = customEmojis.value.find(item => item.name === input.name);
	if (!emoji) throw new Error('Unknown fixture emoji');
	return { ...emoji, id: 'fixture', host: null, license: null, localOnly: false, isSensitive: false, roleIdsThatCanBeUsedThisEmojiAsReaction: [] };
}
export function popupMenu(items) {
	const menu = element('menu');
	menu.replaceChildren();
	for (const item of items) {
		const node = window.document.createElement(item.type === 'label' ? 'span' : 'button');
		node.textContent = item.text;
		if (item.action) node.onclick = async () => {
			try { await item.action(); } catch (error) { element('action-error').textContent = String(error); }
		};
		menu.append(node);
	}
}
export function popup(_component, props, events) {
	const dialog = element('dialog');
	dialog.textContent = props.emoji.name;
	dialog.dataset.kind = 'detail';
	const close = window.document.createElement('button');
	close.id = 'dialog-close'; close.textContent = 'Close'; close.onclick = () => events.closed();
	dialog.append(close);
	return { dispose() { disposals++; element('disposals').textContent = String(disposals); dialog.replaceChildren(); } };
}
export async function popupAsyncWithDialog(component, props, events) {
	await component;
	const result = popup(null, props, events);
	element('dialog').dataset.kind = 'edit';
	return result;
}
