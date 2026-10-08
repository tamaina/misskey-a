/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { $i, iAmModerator } from '@features/auth/frontend/i.js';
import FeatureLocaleMessages from '@features/drive/frontend/ts-messages.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import * as os from '@features/ui/frontend/os.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';

/** 添付ファイルなど、公開ファイル用のメニュー */
export function getFileMenu(file: Misskey.entities.DriveFile, onHideStateUpdated?: (newState: boolean) => void): MenuItem[] {
	const menuItems: MenuItem[] = [];

	if (onHideStateUpdated != null) {
		menuItems.push({
			text: FeatureLocaleMessages.$locale.hide,
			icon: 'ti ti-eye-off',
			action: () => {
				onHideStateUpdated(true);
			},
		});
	}

	if (iAmModerator) {
		menuItems.push({
			text: file.isSensitive ? FeatureLocaleMessages.$locale.unmarkAsSensitive : FeatureLocaleMessages.$locale.markAsSensitive,
			icon: 'ti ti-eye-exclamation',
			danger: true,
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					text: file.isSensitive ? FeatureLocaleMessages.$locale.unmarkAsSensitiveConfirm : FeatureLocaleMessages.$locale.markAsSensitiveConfirm,
				});

				if (canceled) return;

				os.apiWithDialog('drive/files/update', {
					fileId: file.id,
					isSensitive: !file.isSensitive,
				});
			},
		});
	}

	const details: MenuItem[] = [];
	if ($i?.id === file.userId) {
		details.push({
			type: 'link',
			text: FeatureLocaleMessages.$locale._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${file.id}`,
		});
	}

	if (iAmModerator) {
		details.push({
			type: 'link',
			text: FeatureLocaleMessages.$locale.moderation,
			icon: 'ti ti-photo-exclamation',
			to: `/admin/file/${file.id}`,
		});
	}

	if (details.length > 0) {
		menuItems.push({ type: 'divider' }, ...details);
	}

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
