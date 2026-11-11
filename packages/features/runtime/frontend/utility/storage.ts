/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useLocale } from 'virtual:vite-vue-internationalization';
import { readonly, ref } from 'vue';
import * as os from '@features/ui/frontend/os.js';
import { store } from '@features/preferences/frontend/store.js';
import type { Locale } from 'i18n';

function getGlobalLocale() {
	return useLocale<Locale>(import.meta.url).value.env;
}

export const storagePersistenceSupported = window.isSecureContext && 'storage' in navigator;
const storagePersisted = ref(false);

export async function getStoragePersistenceStatusRef() {
	if (storagePersistenceSupported) {
		storagePersisted.value = await navigator.storage.persisted().catch(() => false);
	}

	return readonly(storagePersisted);
}

export async function enableStoragePersistence() {
	if (!storagePersistenceSupported) return;
	try {
		const persisted = await navigator.storage.persist();
		if (persisted) {
			storagePersisted.value = true;
		} else {
			os.alert({
				type: 'error',
				text: getGlobalLocale().somethingHappened,
			});
		}
	}	catch (err) {
		os.alert({
			type: 'error',
			text: getGlobalLocale().somethingHappened,
		});
	}
}

export function skipStoragePersistence() {
	store.set('showStoragePersistenceSuggestion', false);
}
