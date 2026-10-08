/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { defineAsyncComponent } from 'vue';
import { selectDriveFolder } from '@features/drive/frontend/utility/drive.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import FeatureLocaleMessages from '@features/drive/frontend/ts-messages.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { globalEvents } from '@features/runtime/frontend/events.js';

function rename(file: Misskey.entities.DriveFile) {
	os.inputText({
		title: FeatureLocaleMessages.$locale.renameFile,
		placeholder: FeatureLocaleMessages.$locale.inputNewFileName,
		default: file.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		misskeyApi('drive/files/update', {
			fileId: file.id,
			name: name,
		}).then(updated => {
			globalEvents.emit('driveFilesUpdated', [updated]);
		});
	});
}

async function describe(file: Misskey.entities.DriveFile) {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/drive/frontend/components/MkFileCaptionEditWindow.vue').then(x => x.default), {
		default: file.comment ?? '',
		file: file,
	}, {
		done: caption => {
			misskeyApi('drive/files/update', {
				fileId: file.id,
				comment: caption.length === 0 ? null : caption,
			}).then(updated => {
				globalEvents.emit('driveFilesUpdated', [updated]);
			});
		},
		closed: () => dispose(),
	});
}

function move(file: Misskey.entities.DriveFile) {
	selectDriveFolder(null).then(({ canceled, folders }) => {
		if (canceled) return;
		misskeyApi('drive/files/update', {
			fileId: file.id,
			folderId: folders[0] ? folders[0].id : null,
		}).then(updated => {
			globalEvents.emit('driveFilesUpdated', [updated]);
		});
	});
}

function toggleSensitive(file: Misskey.entities.DriveFile) {
	misskeyApi('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(updated => {
		globalEvents.emit('driveFilesUpdated', [updated]);
	}).catch(err => {
		os.alert({
			type: 'error',
			title: FeatureLocaleMessages.$locale.error,
			text: err.message,
		});
	});
}

function copyUrl(file: Misskey.entities.DriveFile) {
	copyToClipboard(file.url);
}

/*
function addApp() {
	alert('not implemented yet');
}
*/
async function deleteFile(file: Misskey.entities.DriveFile) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters(FeatureLocaleMessages.$locale.driveFileDeleteConfirm, { name: file.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('drive/files/delete', {
		fileId: file.id,
	});

	globalEvents.emit('driveFilesDeleted', [file]);
}

/** 自分のドライブファイルを操作する際のメニュー */
export function getDriveFileMenu(file: Misskey.entities.DriveFile, folder?: Misskey.entities.DriveFolder | null): MenuItem[] {
	const _isImage = file.type.startsWith('image/');

	const menuItems: MenuItem[] = [];

	menuItems.push({
		type: 'link',
		to: `/my/drive/file/${file.id}`,
		text: FeatureLocaleMessages.$locale._fileViewer.title,
		icon: 'ti ti-info-circle',
	}, { type: 'divider' }, {
		text: FeatureLocaleMessages.$locale.rename,
		icon: 'ti ti-forms',
		action: () => rename(file),
	}, {
		text: FeatureLocaleMessages.$locale.move,
		icon: 'ti ti-folder-symlink',
		action: () => move(file),
	}, {
		text: file.isSensitive ? FeatureLocaleMessages.$locale.unmarkAsSensitive : FeatureLocaleMessages.$locale.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye' : 'ti ti-eye-exclamation',
		action: () => toggleSensitive(file),
	}, {
		text: FeatureLocaleMessages.$locale.describeFile,
		icon: 'ti ti-text-caption',
		action: () => describe(file),
	});

	menuItems.push({ type: 'divider' }, {
		text: FeatureLocaleMessages.$locale.createNoteFromTheFile,
		icon: 'ti ti-pencil',
		action: () => os.post({
			initialFiles: [file],
			instant: true,
		}),
	}, {
		text: FeatureLocaleMessages.$locale.copyUrl,
		icon: 'ti ti-link',
		action: () => copyUrl(file),
	}, {
		type: 'a',
		href: file.url,
		target: '_blank',
		text: FeatureLocaleMessages.$locale.download,
		icon: 'ti ti-download',
		download: file.name,
	}, { type: 'divider' }, {
		text: FeatureLocaleMessages.$locale.delete,
		icon: 'ti ti-trash',
		danger: true,
		action: () => deleteFile(file),
	});

	if (prefer.s.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: FeatureLocaleMessages.$locale.copyFileId,
			action: () => {
				copyToClipboard(file.id);
			},
		});
	}

	return menuItems;
}
