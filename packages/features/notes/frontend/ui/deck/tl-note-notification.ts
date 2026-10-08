/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { Ref } from 'vue';
import type { SoundType } from '@features/preferences/frontend/utility/sound.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { getSoundDuration, playMisskeySfxFile, soundsTypes } from '@features/preferences/frontend/utility/sound.js';
import FeatureLocaleMessages from '@features/notes/frontend/ts-messages.vue';
import * as os from '@features/ui/frontend/os.js';

export async function soundSettingsButton(soundSetting: Ref<SoundStore>): Promise<void> {
	function getSoundTypeName(f: SoundType): string {
		switch (f) {
			case null:
				return FeatureLocaleMessages.$locale.none;
			case '_driveFile_':
				return FeatureLocaleMessages.$locale._soundSettings.driveFile;
			default:
				return f;
		}
	}

	const { canceled, result } = await os.form(FeatureLocaleMessages.$locale.sound, {
		type: {
			type: 'enum',
			label: FeatureLocaleMessages.$locale.sound,
			default: soundSetting.value.type ?? 'none',
			enum: soundsTypes.map(f => ({
				value: f ?? 'none' as Exclude<SoundType, null> | 'none',
				label: getSoundTypeName(f),
			})),
		},
		soundFile: {
			type: 'drive-file',
			label: FeatureLocaleMessages.$locale.file,
			defaultFileId: soundSetting.value.type === '_driveFile_' ? soundSetting.value.fileId : null,
			hidden: v => v.type !== '_driveFile_',
			validate: async (file: Misskey.entities.DriveFile) => {
				if (!file.type.startsWith('audio')) {
					os.alert({
						type: 'warning',
						title: FeatureLocaleMessages.$locale._soundSettings.driveFileTypeWarn,
						text: FeatureLocaleMessages.$locale._soundSettings.driveFileTypeWarnDescription,
					});
					return false;
				}

				const duration = await getSoundDuration(file.url);
				if (duration >= 2000) {
					const { canceled } = await os.confirm({
						type: 'warning',
						title: FeatureLocaleMessages.$locale._soundSettings.driveFileDurationWarn,
						text: FeatureLocaleMessages.$locale._soundSettings.driveFileDurationWarnDescription,
						okText: FeatureLocaleMessages.$locale.continue,
						cancelText: FeatureLocaleMessages.$locale.cancel,
					});
					if (canceled) return false;
				}

				return true;
			},
		},
		volume: {
			type: 'range',
			label: FeatureLocaleMessages.$locale.volume,
			default: soundSetting.value.volume ?? 1,
			textConverter: (v) => `${Math.floor(v * 100)}%`,
			min: 0,
			max: 1,
			step: 0.05,
		},
		listen: {
			type: 'button',
			content: FeatureLocaleMessages.$locale.listen,
			action: (_, v) => {
				const sound = buildSoundStore(v);
				if (!sound) return;
				playMisskeySfxFile(sound);
			},
		},
	});

	if (canceled) return;

	const res = buildSoundStore(result);
	if (res) soundSetting.value = res;

	function buildSoundStore(r: NonNullable<typeof result>): SoundStore | null {
		const type = (r.type === 'none' ? null : r.type);
		const volume = r.volume;
		const fileId = r.soundFile?.id ?? (soundSetting.value.type === '_driveFile_' ? soundSetting.value.fileId : undefined);
		const fileUrl = r.soundFile?.url ?? (soundSetting.value.type === '_driveFile_' ? soundSetting.value.fileUrl : undefined);

		if (type === '_driveFile_') {
			if (!fileUrl || !fileId) {
				os.alert({
					type: 'warning',
					text: FeatureLocaleMessages.$locale._soundSettings.driveFileWarn,
				});
				return null;
			}
			return { type, volume, fileId, fileUrl };
		} else {
			return { type, volume };
		}
	}
}
