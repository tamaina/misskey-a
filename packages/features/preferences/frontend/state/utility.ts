/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, watch } from 'vue';
import type { PreferencesProfile } from '@features/preferences/frontend/state/manager.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import FeatureLocaleMessages from '@features/preferences/frontend/ts-messages.vue';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import * as os from '@features/ui/frontend/os.js';
import { store } from '@features/preferences/frontend/store.js';
import { $i } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';

function canAutoBackup() {
	return prefer.profile.name != null && prefer.profile.name.trim() !== '';
}

export function getPreferencesProfileMenu(): MenuItem[] {
	const autoBackupEnabled = ref(store.s.enablePreferencesAutoCloudBackup);

	watch(autoBackupEnabled, () => {
		if (autoBackupEnabled.value) {
			if (!canAutoBackup()) {
				autoBackupEnabled.value = false;
				os.alert({
					type: 'warning',
					title: FeatureLocaleMessages.$locale._preferencesBackup.youNeedToNameYourProfileToEnableAutoBackup,
				});
				return;
			}

			store.set('enablePreferencesAutoCloudBackup', true);

			cloudBackup();
		} else {
			store.set('enablePreferencesAutoCloudBackup', false);
		}
	});

	const menu: MenuItem[] = [{
		type: 'label',
		text: prefer.profile.name || `(${FeatureLocaleMessages.$locale.noName})`,
	}, {
		text: FeatureLocaleMessages.$locale.rename,
		icon: 'ti ti-pencil',
		action: () => {
			renameProfile();
		},
	}, {
		type: 'switch',
		icon: 'ti ti-cloud-up',
		text: FeatureLocaleMessages.$locale._preferencesBackup.autoBackup,
		ref: autoBackupEnabled,
	}, {
		text: FeatureLocaleMessages.$locale.export,
		icon: 'ti ti-download',
		action: () => {
			exportCurrentProfile();
		},
	}, {
		type: 'divider',
	}, {
		text: FeatureLocaleMessages.$locale._preferencesBackup.restoreFromBackup,
		icon: 'ti ti-cloud-down',
		action: () => {
			restoreFromCloudBackup();
		},
	}, {
		text: FeatureLocaleMessages.$locale.import,
		icon: 'ti ti-upload',
		action: () => {
			importProfile();
		},
	}, {
		type: 'divider',
	}, {
		type: 'link',
		text: FeatureLocaleMessages.$locale._preferencesProfile.manageProfiles + '...',
		icon: 'ti ti-settings-cog',
		to: '/settings/profiles',
	}];

	if (prefer.s.devMode) {
		menu.push({
			text: 'Copy profile as text',
			icon: 'ti ti-clipboard',
			action: () => {
				copyToClipboard(JSON.stringify(prefer.profile, null, '\t'));
			},
		});
	}

	return menu;
}

async function renameProfile() {
	const { canceled, result: name } = await os.inputText({
		title: FeatureLocaleMessages.$locale._preferencesProfile.profileName,
		text: FeatureLocaleMessages.$locale._preferencesProfile.profileNameDescription + '\n' + FeatureLocaleMessages.$locale._preferencesProfile.profileNameDescription2,
		placeholder: prefer.profile.name || null,
		default: prefer.profile.name || null,
	});
	if (canceled || name == null || name.trim() === '') return;

	prefer.renameProfile(name);
}

function exportCurrentProfile() {
	const p = prefer.profile;
	const txtBlob = new Blob([JSON.stringify(p)], { type: 'text/plain' });
	const dummya = window.document.createElement('a');
	dummya.href = URL.createObjectURL(txtBlob);
	dummya.download = `${p.name || p.id}.misskeypreferences`;
	dummya.click();
}

function importProfile() {
	const input = window.document.createElement('input');
	input.type = 'file';
	input.accept = '.misskeypreferences';
	input.onchange = async () => {
		if (input.files == null || input.files.length === 0) return;

		const file = input.files[0];
		const txt = await file.text();
		const profile = JSON.parse(txt) as PreferencesProfile;

		miLocalStorage.setItem('preferences', JSON.stringify(profile));
		miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
		shouldSuggestRestoreBackup.value = false;
		unisonReload();
	};

	input.click();
}

export async function cloudBackup() {
	if ($i == null) return;
	if (!canAutoBackup()) {
		throw new Error('cannot auto backup for this profile');
	}

	await misskeyApi('i/registry/set', {
		scope: ['client', 'preferences', 'backups'],
		key: prefer.profile.name,
		value: prefer.profile,
	});
}

export async function listCloudBackups() {
	const keys = await misskeyApi('i/registry/keys', {
		scope: ['client', 'preferences', 'backups'],
	});

	return keys.map(k => ({
		name: k,
	}));
}

export async function deleteCloudBackup(key: string) {
	await os.apiWithDialog('i/registry/remove', {
		scope: ['client', 'preferences', 'backups'],
		key,
	});
}

export async function restoreFromCloudBackup() {
	if ($i == null) return;

	// TODO: 更新日時でソートしたい
	const backups = await listCloudBackups();

	if (backups.length === 0) {
		os.alert({
			type: 'warning',
			title: FeatureLocaleMessages.$locale._preferencesBackup.noBackupsFoundTitle,
			text: FeatureLocaleMessages.$locale._preferencesBackup.noBackupsFoundDescription,
		});
		return;
	}

	const select = await os.select({
		title: FeatureLocaleMessages.$locale._preferencesBackup.selectBackupToRestore,
		text: 'ℹ️ ' + FeatureLocaleMessages.$locale._preferencesProfile.shareSameProfileBetweenDevicesIsNotRecommended + ' ' + FeatureLocaleMessages.$locale._preferencesProfile.useSyncBetweenDevicesOptionIfYouWantToSyncSetting,
		items: backups.map(backup => ({
			label: backup.name,
			value: backup.name,
		})),
	});
	if (select.canceled) return;
	if (select.result == null) return;

	const profile = await misskeyApi('i/registry/get', {
		scope: ['client', 'preferences', 'backups'],
		key: select.result,
	});

	if (_DEV_) console.log(profile);

	miLocalStorage.setItem('preferences', JSON.stringify(profile));
	miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
	store.set('enablePreferencesAutoCloudBackup', true);
	shouldSuggestRestoreBackup.value = false;
	unisonReload();
}

export async function enableAutoBackup() {
	if (!canAutoBackup()) {
		await renameProfile();
	}

	if (!canAutoBackup()) {
		return;
	}

	store.set('enablePreferencesAutoCloudBackup', true);
}

export const shouldSuggestRestoreBackup = ref(false);

if ($i != null) {
	if (new Date($i.createdAt).getTime() > (Date.now() - 1000 * 60 * 30)) { // アカウント作成直後は意味ないので除外
		miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
	} else {
		if (miLocalStorage.getItem('hidePreferencesRestoreSuggestion') !== 'true') {
			misskeyApi('i/registry/keys', {
				scope: ['client', 'preferences', 'backups'],
			}).then(keys => {
				if (keys.length === 0) {
					miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
				} else {
					shouldSuggestRestoreBackup.value = true;
				}
			});
		}
	}
}

export function hideRestoreBackupSuggestion() {
	miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
	shouldSuggestRestoreBackup.value = false;
}
