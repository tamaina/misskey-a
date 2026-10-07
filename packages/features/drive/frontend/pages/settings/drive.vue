<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/drive" :label="$locale.sfc.drive" :keywords="['drive']" icon="ti ti-cloud">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/2601.png" color="#0059ff">
			<SearchText>{{ $locale.sfc.settingsDriveBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['capacity', 'usage']">
			<FormSection first>
				<template #label><SearchLabel>{{ $locale.sfc.usageAmount }}</SearchLabel></template>

				<div v-if="!fetching" class="_gaps_m">
					<div>
						<div :class="$style.meter"><div :class="$style.meterValue" :style="meterStyle"></div></div>
					</div>
					<FormSplit>
						<MkKeyValue>
							<template #key>{{ $locale.sfc.capacity }}</template>
							<template #value>{{ bytes(capacity, 1) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ $locale.sfc.inUse }}</template>
							<template #value>{{ bytes(usage, 1) }}</template>
						</MkKeyValue>
					</FormSplit>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['statistics', 'usage']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.statistics }}</SearchLabel></template>
				<MkChart src="per-user-drive" :args="{ user: $i }" span="day" :limit="7 * 5" :bar="true" :stacked="true" :detailed="false" :aspectRatio="6"/>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['general']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.general }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['default', 'upload', 'folder']">
						<FormLink @click="chooseUploadFolder()">
							<SearchLabel>{{ $locale.sfc.uploadFolder }}</SearchLabel>
							<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
							<template #icon><i class="ti ti-folder"></i></template>
						</FormLink>
					</SearchMarker>

					<FormLink to="/settings/drive/cleaner">
						{{ $locale.sfc.drivecleaner }}
					</FormLink>

					<SearchMarker :keywords="['keep', 'original', 'filename']">
						<MkPreferenceContainer k="keepOriginalFilename">
							<MkSwitch v-model="keepOriginalFilename">
								<template #label><SearchLabel>{{ $locale.sfc.keepOriginalFilename }}</SearchLabel></template>
								<template #caption><SearchText>{{ $locale.sfc.keepOriginalFilenameDescription }}</SearchText></template>
							</MkSwitch>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['always', 'default', 'mark', 'nsfw', 'sensitive', 'media', 'file']">
						<MkSwitch v-model="alwaysMarkNsfw" @update:modelValue="saveProfile()">
							<template #label><SearchLabel>{{ $locale.sfc.alwaysMarkSensitive }}</SearchLabel></template>
						</MkSwitch>
					</SearchMarker>

					<SearchMarker :keywords="['auto', 'nsfw', 'sensitive', 'media', 'file']">
						<MkSwitch v-model="autoSensitive" @update:modelValue="saveProfile()">
							<template #label><SearchLabel>{{ $locale.sfc.enableAutoSensitive }}</SearchLabel><span class="_beta">{{ $locale.sfc.beta }}</span></template>
							<template #caption><SearchText>{{ $locale.sfc.enableAutoSensitiveDescription }}</SearchText></template>
						</MkSwitch>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['image']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.image }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['watermark', 'credit']">
						<MkFolder v-if="$i.policies.watermarkAvailable">
							<template #icon><i class="ti ti-copyright"></i></template>
							<template #label><SearchLabel>{{ $locale.sfc.watermark }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.watermarkEditorTip }}</template>

							<div class="_gaps">
								<div class="_gaps_s">
									<XWatermarkItem
										v-for="(preset, i) in prefer.r.watermarkPresets.value"
										:key="preset.id"
										:preset="preset"
										@updatePreset="onUpdateWatermarkPreset(preset.id, $event)"
										@del="onDeleteWatermarkPreset(preset.id)"
									/>

									<MkButton iconOnly rounded style="margin: 0 auto;" @click="addWatermarkPreset"><i class="ti ti-plus"></i></MkButton>

									<SearchMarker :keywords="['sync', 'watermark', 'preset', 'devices']">
										<MkSwitch :modelValue="watermarkPresetsSyncEnabled" @update:modelValue="changeWatermarkPresetsSyncEnabled">
											<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ $locale.sfc.syncBetweenDevices }}</SearchLabel></template>
										</MkSwitch>
									</SearchMarker>
								</div>

								<hr>

								<SearchMarker :keywords="['default', 'watermark', 'preset']">
									<MkPreferenceContainer k="defaultWatermarkPresetId">
										<MkSelect v-model="defaultWatermarkPresetId" :items="[{ label: $locale.sfc.none, value: null }, ...prefer.r.watermarkPresets.value.map(p => ({ label: p.name || $locale.sfc.noName, value: p.id }))]">
											<template #label><SearchLabel>{{ $locale.sfc.defaultPreset }}</SearchLabel></template>
										</MkSelect>
									</MkPreferenceContainer>
								</SearchMarker>
							</div>
						</MkFolder>
					</SearchMarker>

					<SearchMarker :keywords="['label', 'frame', 'credit', 'metadata']">
						<MkFolder>
							<template #icon><i class="ti ti-device-ipad-horizontal"></i></template>
							<template #label><SearchLabel>{{ $locale.sfc.frame }}</SearchLabel></template>
							<template #caption>{{ $locale.sfc.imageFrameEditorTip }}</template>

							<div class="_gaps">
								<div class="_gaps_s">
									<XImageFrameItem
										v-for="(preset, i) in prefer.r.imageFramePresets.value"
										:key="preset.id"
										:preset="preset"
										@updatePreset="onUpdateImageFramePreset(preset.id, $event)"
										@del="onDeleteImageFramePreset(preset.id)"
									/>

									<MkButton iconOnly rounded style="margin: 0 auto;" @click="addImageFramePreset"><i class="ti ti-plus"></i></MkButton>

									<SearchMarker :keywords="['sync', 'frame', 'label', 'preset', 'devices']">
										<MkSwitch :modelValue="imageFramePresetsSyncEnabled" @update:modelValue="changeImageFramePresetsSyncEnabled">
											<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ $locale.sfc.syncBetweenDevices }}</SearchLabel></template>
										</MkSwitch>
									</SearchMarker>
								</div>
							</div>
						</MkFolder>
					</SearchMarker>

					<SearchMarker :keywords="['default', 'image', 'compression']">
						<MkPreferenceContainer k="defaultImageCompressionLevel">
							<MkSelect
								v-model="defaultImageCompressionLevel" :items="[
									{ label: $locale.sfc.none, value: 0 },
									{ label: `${$locale.sfc.low} (${$locale.sfc.compressionQualityHigh}; ${$locale.sfc.compressionSizeLarge})`, value: 1 },
									{ label: `${$locale.sfc.medium} (${$locale.sfc.compressionQualityMedium}; ${$locale.sfc.compressionSizeMedium})`, value: 2 },
									{ label: `${$locale.sfc.high} (${$locale.sfc.compressionQualityLow}; ${$locale.sfc.compressionSizeSmall})`, value: 3 },
								]"
							>
								<template #label><SearchLabel>{{ $locale.sfc.defaultCompressionLevel }}</SearchLabel></template>
								<template #caption><div v-html="$locale.sfc.defaultCompressionLevel_description"></div></template>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['video']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.video }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['default', 'video', 'compression']">
						<MkPreferenceContainer k="defaultVideoCompressionLevel">
							<MkSelect
								v-model="defaultVideoCompressionLevel" :items="[
									{ label: $locale.sfc.none, value: 0 },
									{ label: `${$locale.sfc.low} (${$locale.sfc.compressionQualityHigh}; ${$locale.sfc.compressionSizeLarge})`, value: 1 },
									{ label: `${$locale.sfc.medium} (${$locale.sfc.compressionQualityMedium}; ${$locale.sfc.compressionSizeMedium})`, value: 2 },
									{ label: `${$locale.sfc.high} (${$locale.sfc.compressionQualityLow}; ${$locale.sfc.compressionSizeSmall})`, value: 3 },
								]"
							>
								<template #label><SearchLabel>{{ $locale.sfc.defaultCompressionLevel }}</SearchLabel></template>
								<template #caption><div v-html="$locale.sfc.defaultCompressionLevel_description"></div></template>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import tinycolor from 'tinycolor2';
import XWatermarkItem from '@features/drive/frontend/pages/settings/drive.WatermarkItem.vue';
import XImageFrameItem from '@features/drive/frontend/pages/settings/drive.ImageFrameItem.vue';
import type { WatermarkPreset } from '@features/media/frontend/utility/watermark/WatermarkRenderer.js';
import type { ImageFramePreset } from '@features/media/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import bytes from '@features/ui/frontend/filters/bytes.js';
import MkChart from '@features/statistics/frontend/components/MkChart.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkPreferenceContainer from '@features/preferences/frontend/components/MkPreferenceContainer.vue';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { selectDriveFolder } from '@features/drive/frontend/utility/drive.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';

const $i = ensureSignin();

const fetching = ref(true);
const usage = ref<number | null>(null);
const capacity = ref<number | null>(null);
const uploadFolder = ref<Misskey.entities.DriveFolder | null>(null);
const alwaysMarkNsfw = ref($i.alwaysMarkNsfw);
const autoSensitive = ref($i.autoSensitive);

const meterStyle = computed(() => {
	if (!capacity.value || !usage.value) return {};
	return {
		width: `${usage.value / capacity.value * 100}%`,
		background: tinycolor({
			h: 180 - (usage.value / capacity.value * 180),
			s: 0.7,
			l: 0.5,
		}).toHslString(),
	};
});

const keepOriginalFilename = prefer.model('keepOriginalFilename');
const defaultWatermarkPresetId = prefer.model('defaultWatermarkPresetId');
const defaultImageCompressionLevel = prefer.model('defaultImageCompressionLevel');
const defaultVideoCompressionLevel = prefer.model('defaultVideoCompressionLevel');

const watermarkPresetsSyncEnabled = ref(prefer.isSyncEnabled('watermarkPresets'));

function changeWatermarkPresetsSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('watermarkPresets').then((res) => {
			if (res == null) return;
			if (res.enabled) watermarkPresetsSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('watermarkPresets');
		watermarkPresetsSyncEnabled.value = false;
	}
}

const imageFramePresetsSyncEnabled = ref(prefer.isSyncEnabled('imageFramePresets'));

function changeImageFramePresetsSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('imageFramePresets').then((res) => {
			if (res == null) return;
			if (res.enabled) imageFramePresetsSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('imageFramePresets');
		imageFramePresetsSyncEnabled.value = false;
	}
}

misskeyApi('drive').then(info => {
	capacity.value = info.capacity;
	usage.value = info.usage;
	fetching.value = false;
});

if (prefer.s.uploadFolder) {
	misskeyApi('drive/folders/show', {
		folderId: prefer.s.uploadFolder,
	}).then(response => {
		uploadFolder.value = response;
	});
}

function chooseUploadFolder() {
	selectDriveFolder(null).then(async ({ canceled, folders }) => {
		if (canceled) return;
		prefer.commit('uploadFolder', folders[0] ? folders[0].id : null);
		os.success();
		if (prefer.s.uploadFolder) {
			uploadFolder.value = await misskeyApi('drive/folders/show', {
				folderId: prefer.s.uploadFolder,
			});
		} else {
			uploadFolder.value = null;
		}
	});
}

async function addWatermarkPreset() {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/media/frontend/components/MkWatermarkEditorDialog.vue').then(x => x.default), {
		presetEditMode: true,
		preset: null,
		layers: [],
	}, {
		presetOk: (preset) => {
			prefer.commit('watermarkPresets', [...prefer.s.watermarkPresets, preset]);
		},
		closed: () => dispose(),
	});
}

function onUpdateWatermarkPreset(id: string, preset: WatermarkPreset) {
	const index = prefer.s.watermarkPresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('watermarkPresets', [
			...prefer.s.watermarkPresets.slice(0, index),
			preset,
			...prefer.s.watermarkPresets.slice(index + 1),
		]);
	}
}

function onDeleteWatermarkPreset(id: string) {
	const index = prefer.s.watermarkPresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('watermarkPresets', [
			...prefer.s.watermarkPresets.slice(0, index),
			...prefer.s.watermarkPresets.slice(index + 1),
		]);

		if (prefer.s.defaultWatermarkPresetId === id) {
			prefer.commit('defaultWatermarkPresetId', null);
		}
	}
}

function onUpdateImageFramePreset(id: string, preset: ImageFramePreset) {
	const index = prefer.s.imageFramePresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('imageFramePresets', [
			...prefer.s.imageFramePresets.slice(0, index),
			preset,
			...prefer.s.imageFramePresets.slice(index + 1),
		]);
	}
}

function onDeleteImageFramePreset(id: string) {
	const index = prefer.s.imageFramePresets.findIndex(p => p.id === id);
	if (index !== -1) {
		prefer.commit('imageFramePresets', [
			...prefer.s.imageFramePresets.slice(0, index),
			...prefer.s.imageFramePresets.slice(index + 1),
		]);
	}
}

async function addImageFramePreset() {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/media/frontend/components/MkImageFrameEditorDialog.vue').then(x => x.default), {
		presetEditMode: true,
		preset: null,
		params: null,
	}, {
		presetOk: (preset) => {
			prefer.commit('imageFramePresets', [...prefer.s.imageFramePresets, preset]);
		},
		closed: () => dispose(),
	});
}

function saveProfile() {
	misskeyApi('i/update', {
		alwaysMarkNsfw: !!alwaysMarkNsfw.value,
		autoSensitive: !!autoSensitive.value,
	}).catch(err => {
		os.alert({
			type: 'error',
			title: $locale.value.sfc.error,
			text: err.message,
		});
		alwaysMarkNsfw.value = true;
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.drive,
	icon: 'ti ti-cloud',
}));
</script>

<style lang="scss" module>
.meter {
	height: 10px;
	background: rgba(0, 0, 0, 0.1);
	border-radius: 999px;
	overflow: clip;
}

.meterValue {
	height: 100%;
	border-radius: 999px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"drive": "قرص التخرين",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "الإستخدام",
	"capacity": "السعة",
	"inUse": "مستخدم",
	"statistics": "الإحصائيات",
	"general": "الرئيسية",
	"uploadFolder": "المجلد الافتراضي للرفع",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "علّم افتراضيًا جميع ملاحظاتي كذات محتوى حساس",
	"enableAutoSensitive": "تعيين تلقائي كمحتوى حساس NSFW",
	"beta": "بيتا",
	"enableAutoSensitiveDescription": "عند الاستطاعة يسمح باكتشاف المحتوى حساس NSFW تلقائيًا في الوسائط باستخدام تعلم الآلة ووسمها تبعًا لذلك. قد يكون هذا الخيار مفعلا من جهة الخادم وسيعمل حتى وان عُطل.",
	"image": "صور",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "لا شيء",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "منخفضة",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "متوسط",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "عالية",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "فيديو",
	"error": "خطأ"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"drive": "Disc",
	"settingsDriveBanner": "Pots gestionar i configurar el Disc, comprovar el seu ús i establir una configuració per a la càrrega d'arxius.",
	"usageAmount": "Ús ",
	"capacity": "Capacitat",
	"inUse": "Fet servir",
	"statistics": "Estadístiques",
	"general": "General",
	"uploadFolder": "Carpeta per defecte on desar els arxius pujats",
	"drivecleaner": "Netejador de Disc",
	"keepOriginalFilename": "Desa el nom del fitxer original",
	"keepOriginalFilenameDescription": "Si desactives aquesta opció els noms dels fitxers se substituiran per una cadena aleatòria quan carreguis nous fitxers de forma automàtica.",
	"alwaysMarkSensitive": "Marcar com a sensible per defecte",
	"enableAutoSensitive": "Marcar com a sensible automàticament ",
	"beta": "Proves",
	"enableAutoSensitiveDescription": "Permet la detecció i el marcat automàtic dels mitjans sensibles fent servir aprenentatge automàtic quan sigui possible. Si aquesta opció es troba desactivada potser que estigui activada per a tota la instància. ",
	"image": "Imatge",
	"watermark": "Marca d'aigua ",
	"watermarkEditorTip": "A la imatge es pot afegir una marca d'aigua com informació sobre drets.",
	"syncBetweenDevices": "Sincronització entre dispositius",
	"none": "Res",
	"noName": "No hi ha un nom disponible ",
	"defaultPreset": "Per defecte",
	"frame": "Marc",
	"imageFrameEditorTip": "Pots decorar les imatges afegint etiquetes que continguin marcs i metadades.",
	"low": "Baixa",
	"compressionQualityHigh": "Qualitat alta",
	"compressionSizeLarge": "Mida gran",
	"medium": "Mitjà",
	"compressionQualityMedium": "Qualitat mitjana",
	"compressionSizeMedium": "Mida mitjana",
	"high": "Alta",
	"compressionQualityLow": "Qualitat baixa",
	"compressionSizeSmall": "Mida petita",
	"defaultCompressionLevel": "Nivell de compressió predeterminat",
	"defaultCompressionLevel_description": "Si el redueixes augmentaràs la qualitat de la imatge, però la mida de l'arxiu serà més gran. <br>Si augmentes l'opció redueixes la mida de l'arxiu i la qualitat de la imatge és pitjor.",
	"video": "Vídeo",
	"error": "Error"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"drive": "Úložiště",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Využití",
	"capacity": "Kapacita",
	"inUse": "Používáno",
	"statistics": "Statistiky",
	"general": "Obecně",
	"uploadFolder": "Výchozí lokace pro upload",
	"drivecleaner": "Čistič disku",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Výchozně označovat jako citlivý",
	"enableAutoSensitive": "Automaticky označovat jako citlivé",
	"beta": "Beta verze",
	"enableAutoSensitiveDescription": "Umožňuje automatickou detekci a označování citlivého média skrze strojového účení všude kde je možno. I pokud je tahle možnost vypnutá, může být povolena instancí.",
	"image": "Obrázky",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Žádný",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Nízká",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Střední",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Vysoká",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Chyba"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"drive": "Drive",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Usage",
	"capacity": "Capacity",
	"inUse": "Used",
	"statistics": "Statistics",
	"general": "General",
	"uploadFolder": "Default folder for uploads",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Mark as sensitive by default",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Image",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "None",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Low",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "High",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Error"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"drive": "Drive",
	"settingsDriveBanner": "Du kannst den Drive verwalten und konfigurieren, die Auslastung überprüfen und Einstellungen für das Hochladen von Dateien vornehmen.",
	"usageAmount": "Verwendung",
	"capacity": "Kapazität",
	"inUse": "Verwendet",
	"statistics": "Statistiken",
	"general": "Allgemein",
	"uploadFolder": "Standardordner für Uploads",
	"drivecleaner": "Drive-Reiniger",
	"keepOriginalFilename": "Ursprünglichen Dateinamen beibehalten",
	"keepOriginalFilenameDescription": "Wenn diese Einstellung deaktiviert ist, wird der Dateiname beim Hochladen automatisch durch eine zufällige Zeichenfolge ersetzt.",
	"alwaysMarkSensitive": "Medien standardmäßig als sensibel markieren",
	"enableAutoSensitive": "Automarkierung sensibler Medien",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Setzt soweit möglich durch Verwendung von Machine Learning automatisch Markierungen für sensible Medien. Auch wenn du diese Option deaktiviert hast, ist sie möglicherweise auf Instanzebene aktiviert.",
	"image": "Bild",
	"watermark": "Wasserzeichen",
	"watermarkEditorTip": "Dem Bild kann ein Wasserzeichen, z. B. eine Quellenangabe, hinzugefügt werden.",
	"syncBetweenDevices": "Zwischen Geräten synchronisieren",
	"none": "Nichts",
	"noName": "Kein Name",
	"defaultPreset": "Standard-Voreinstellungen",
	"frame": "Rahmen",
	"imageFrameEditorTip": "Sie können das Bild dekorieren, indem Sie einen Rahmen sowie ein Etikett mit Metadaten hinzufügen.",
	"low": "Niedrig",
	"compressionQualityHigh": "Hohe Qualität",
	"compressionSizeLarge": "Groß",
	"medium": "Mittel",
	"compressionQualityMedium": "Mittlere Qualität",
	"compressionSizeMedium": "Medium",
	"high": "Hoch",
	"compressionQualityLow": "Niedrige Qualität",
	"compressionSizeSmall": "Klein",
	"defaultCompressionLevel": "Standard-Kompressionsgrad",
	"defaultCompressionLevel_description": "Bei einem niedrigeren Wert bleibt die Qualität erhalten, aber die Dateigröße nimmt zu.<br> Bei einem höheren Wert lässt sich die Dateigröße verringern, aber die Qualität nimmt ab.",
	"video": "Video",
	"error": "Fehler"
}
</locale>

<locale lang="json" locale="en-US">
{
	"drive": "Drive",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Usage",
	"capacity": "Capacity",
	"inUse": "Used",
	"statistics": "Statistics",
	"general": "General",
	"uploadFolder": "Default folder for uploads",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Mark as sensitive by default",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Image",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "None",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Low",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "High",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Error"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"drive": "Drive",
	"settingsDriveBanner": "Puedes gestionar y configurar la unidad, comprobar su uso y configurar los ajustes de carga de archivos.",
	"usageAmount": "Uso",
	"capacity": "Capacidad",
	"inUse": "Usado",
	"statistics": "Estadísticas",
	"general": "General",
	"uploadFolder": "Carpeta de subidas por defecto",
	"drivecleaner": "Limpiador del Drive",
	"keepOriginalFilename": "Mantener el nombre original del archivo",
	"keepOriginalFilenameDescription": "Si desactivas esta opción, los nombres de los archivos serán remplazados por una cadena de caracteres aleatoria cuando subas los archivos.",
	"alwaysMarkSensitive": "Marcar los medios de comunicación como contenido sensible por defecto",
	"enableAutoSensitive": "Marcar automáticamente contenido NSFW",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Permite la detección y marcado automático de contenido NSFW usando 'Machine Learning' cuando sea posible. Incluso si esta opción está desactivada, puede ser activado para toda la instancia.",
	"image": "Imágenes",
	"watermark": "Marca de Agua",
	"watermarkEditorTip": "Se puede añadir a la imagen una marca de agua, como información crediticia.",
	"syncBetweenDevices": "Sincronizar entre dispositivos",
	"none": "Ninguna",
	"noName": "No hay nombre.",
	"defaultPreset": "Por defecto",
	"frame": "Marco",
	"imageFrameEditorTip": "Decora tus imágenes con marcos y etiquetas que contengan metadatos.",
	"low": "Baja",
	"compressionQualityHigh": "Calidad\u00a0alta",
	"compressionSizeLarge": "Tamaño grande",
	"medium": "Mediano",
	"compressionQualityMedium": "Calidad media",
	"compressionSizeMedium": "Tamaño mediano",
	"high": "Alta",
	"compressionQualityLow": "Calidad baja",
	"compressionSizeSmall": "Tamaño pequeño",
	"defaultCompressionLevel": "Nivel de compresión predeterminado",
	"defaultCompressionLevel_description": "Al reducir el ajuste se conserva la calidad, pero aumenta el tamaño del archivo.<br>Al aumentar el ajuste se reduce el tamaño del archivo, pero disminuye la calidad.",
	"video": "Video",
	"error": "Error"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"drive": "Disque",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Utilisation",
	"capacity": "Capacité\u00a0",
	"inUse": "utilisé",
	"statistics": "Statistiques",
	"general": "Général",
	"uploadFolder": "Emplacement de téléversement par défaut",
	"drivecleaner": "Nettoyeur du Disque",
	"keepOriginalFilename": "Garder le nom original du fichier",
	"keepOriginalFilenameDescription": "Si vous désactivez ce paramètre, les noms de fichiers seront automatiquement remplacés par des noms aléatoires lorsque vous téléchargerez des fichiers.",
	"alwaysMarkSensitive": "Marquer les médias comme contenu sensible par défaut",
	"enableAutoSensitive": "Détermination automatique de NSFW",
	"beta": "Bêta",
	"enableAutoSensitiveDescription": "S'il est disponible, le drapeau NSFW est automatiquement défini sur le média en utilisant l'apprentissage automatique. Même si cette fonction est désactivée, elle peut être réglée automatiquement dans certains cas.",
	"image": "Images",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Rien",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Basse",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Moyen",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Haute",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Vidéo",
	"error": "Erreur"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"drive": "Drive",
	"settingsDriveBanner": "Anda dapat mengelola dan mengatur drive, melihat penggunaan, dan mengatur pengaturan unggahan berkas.",
	"usageAmount": "Penggunaan",
	"capacity": "Kapasitas",
	"inUse": "Digunakan",
	"statistics": "Statistik",
	"general": "Umum",
	"uploadFolder": "Lokasi unggah folder bawaan",
	"drivecleaner": "Pembersih Drive",
	"keepOriginalFilename": "Gunakan nama asli berkas",
	"keepOriginalFilenameDescription": "Apabila pengaturan ini dimatikan, nama berkas akan diganti dengan string acak secara otomatis ketika kamu mengunggah berkas.",
	"alwaysMarkSensitive": "Tandai media dalam catatan sebagai media sensitif",
	"enableAutoSensitive": "Penandaan NSFW otomatis",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Mendeteksi otomatis dan menandai media NSFW menggunakan Pembelajaran Mesin jika memungkinkan. Meskipun opsi ini dimatikan, ada kemungkinan dinyalakan secara menyeluruh pada instansi peladen.",
	"image": "Gambar",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Tidak ada",
	"noName": "Tidak ada nama",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Rendah",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Sedang",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Tinggi",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Kompresi yang rendah akan menjaga kualitas namun memperbesar ukuran berkas. Kompresi yang tinggi akan mengurangi ukuran berkas namun mengurangi kualitas.",
	"video": "Video",
	"error": "Galat"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"drive": "Drive",
	"settingsDriveBanner": "Permette di gestire e configurare il Drive, controllare il consumo di spazio e configurare il caricamento dei file.",
	"usageAmount": "Quantità utilizzata",
	"capacity": "Capacità",
	"inUse": "Usata da",
	"statistics": "Statistiche",
	"general": "Generali",
	"uploadFolder": "Destinazione caricamento predefinita",
	"drivecleaner": "Pulizia del Drive",
	"keepOriginalFilename": "Mantieni il nome file originale",
	"keepOriginalFilenameDescription": "Disattivandola, i file verranno caricati usando nomi casuali.",
	"alwaysMarkSensitive": "Segnare automaticamente come espliciti gli allegati",
	"enableAutoSensitive": "Determinazione automatica del NSFW",
	"beta": "Versione beta",
	"enableAutoSensitiveDescription": "Se disponibile, il flag NSFW viene impostato automaticamente sui media utilizzando l'apprendimento automatico. Anche se questa funzione è disattivata, in alcuni casi può essere impostata automaticamente.",
	"image": "Immagini",
	"watermark": "Filigrana",
	"watermarkEditorTip": "Puoi aggiungere una filigrana, ad esempio con i crediti alle tue immagini.",
	"syncBetweenDevices": "Sincronizzazione tra i dispositivi",
	"none": "Nessuna",
	"noName": "Senza nome",
	"defaultPreset": "Impostazioni predefinite",
	"frame": "Cornice",
	"imageFrameEditorTip": "Puoi decorare le immagini aggiungendo etichette con cornici e metadati.",
	"low": "Bassa",
	"compressionQualityHigh": "Alta qualità",
	"compressionSizeLarge": "Taglia grande",
	"medium": "Medio",
	"compressionQualityMedium": "Media qualità",
	"compressionSizeMedium": "Taglia media",
	"high": "Alta",
	"compressionQualityLow": "Bassa qualità",
	"compressionSizeSmall": "Taglia piccola",
	"defaultCompressionLevel": "Compressione predefinita",
	"defaultCompressionLevel_description": "Diminuisci per mantenere la qualità aumentando le dimensioni del file.<br> Aumenta per ridurre le dimensioni del file e anche la qualità.",
	"video": "Video",
	"error": "Errore"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"drive": "ドライブ",
	"settingsDriveBanner": "ドライブの管理と設定、使用量の確認、ファイルをアップロードする際の設定を行えます。",
	"usageAmount": "使用量",
	"capacity": "容量",
	"inUse": "使用中",
	"statistics": "統計",
	"general": "全般",
	"uploadFolder": "既定アップロード先",
	"drivecleaner": "ドライブクリーナー",
	"keepOriginalFilename": "オリジナルのファイル名を保持",
	"keepOriginalFilenameDescription": "この設定をオフにすると、アップロード時にファイル名が自動でランダム文字列に置き換えられます。",
	"alwaysMarkSensitive": "デフォルトでメディアをセンシティブ設定にする",
	"enableAutoSensitive": "自動センシティブ判定",
	"beta": "ベータ",
	"enableAutoSensitiveDescription": "利用可能な場合は、機械学習を利用して自動でメディアにセンシティブフラグを設定します。この機能をオフにしても、サーバーによっては自動で設定されることがあります。",
	"image": "画像",
	"watermark": "ウォーターマーク",
	"watermarkEditorTip": "画像にクレジット情報などのウォーターマークを追加できます。",
	"syncBetweenDevices": "デバイス間で同期",
	"none": "なし",
	"noName": "名前はありません",
	"defaultPreset": "デフォルトのプリセット",
	"frame": "フレーム",
	"imageFrameEditorTip": "画像にフレームやメタデータを含んだラベルを追加して装飾できます。",
	"low": "低",
	"compressionQualityHigh": "高品質",
	"compressionSizeLarge": "サイズ大",
	"medium": "中",
	"compressionQualityMedium": "中品質",
	"compressionSizeMedium": "サイズ中",
	"high": "高",
	"compressionQualityLow": "低品質",
	"compressionSizeSmall": "サイズ小",
	"defaultCompressionLevel": "デフォルトの圧縮度",
	"defaultCompressionLevel_description": "低くすると品質を保てますが、ファイルサイズは増加します。<br>高くするとファイルサイズを減らせますが、品質は低下します。",
	"video": "動画",
	"error": "エラー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"drive": "ドライブ",
	"settingsDriveBanner": "ドライブの管理と設定、使用量の確認、ファイルをアップロードするときの設定ができるで。",
	"usageAmount": "使用量",
	"capacity": "容量",
	"inUse": "使用中",
	"statistics": "統計",
	"general": "全般",
	"uploadFolder": "とりあえずアップロードしたやつ置いとく所",
	"drivecleaner": "ドライブキレイキレイ",
	"keepOriginalFilename": "オリジナルのファイル名を保持",
	"keepOriginalFilenameDescription": "この設定をオフにすると、アップロード時にファイル名が自動でランダム文字列に置き換えられるで。",
	"alwaysMarkSensitive": "デフォルトでメディアを閲覧注意にするで",
	"enableAutoSensitive": "自動できわどいか判断する",
	"beta": "ベータ",
	"enableAutoSensitiveDescription": "使える時は、機械学習を使って自動でメディアにNSFWフラグを設定するで。この機能をオフにしても、サーバーによっては自動で設定されることがあるで。",
	"image": "画像",
	"watermark": "ウォーターマーク",
	"watermarkEditorTip": "画像にクレジット情報とかのウォーターマークをのっけられるで。",
	"syncBetweenDevices": "デバイス間で同期",
	"none": "なし",
	"noName": "名前はあらへんで",
	"defaultPreset": "デフォルトのプリセット",
	"frame": "フレーム",
	"imageFrameEditorTip": "画像にフレームとかメタデータを入れたラベルとかを付け足していい感じにできるで。",
	"low": "低い",
	"compressionQualityHigh": "高品質",
	"compressionSizeLarge": "サイズ大",
	"medium": "ふつう",
	"compressionQualityMedium": "中品質",
	"compressionSizeMedium": "サイズ中",
	"high": "高い",
	"compressionQualityLow": "低品質",
	"compressionSizeSmall": "サイズ小",
	"defaultCompressionLevel": "デフォルトの圧縮度",
	"defaultCompressionLevel_description": "低くすると品質は保てるんやけど、ファイルサイズが増えるで。<br>高くするとファイルサイズは減らせるんやけど、品質が落ちるで。",
	"video": "動画",
	"error": "おかしなったで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"drive": "Drive",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Usage",
	"capacity": "Capacity",
	"inUse": "Used",
	"statistics": "Statistics",
	"general": "General",
	"uploadFolder": "Default folder for uploads",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Mark as sensitive by default",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Image",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "None",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Low",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "High",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Error"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"drive": "Drive",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Usage",
	"capacity": "Capacity",
	"inUse": "Used",
	"statistics": "Statistics",
	"general": "General",
	"uploadFolder": "Default folder for uploads",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Mark as sensitive by default",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Image",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "None",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Low",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "High",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Error"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"drive": "드라이브",
	"settingsDriveBanner": "드라이브 관리, 사용량 확인, 파일 업로드에 관한 설정을 합니다.",
	"usageAmount": "사용량",
	"capacity": "용량",
	"inUse": "사용중",
	"statistics": "통계",
	"general": "일반",
	"uploadFolder": "기본 업로드 위치",
	"drivecleaner": "드라이브 정리",
	"keepOriginalFilename": "원본 파일 이름을 유지",
	"keepOriginalFilenameDescription": "이 설정을 끄면 업로드를 할 때 파일 이름이 자동으로 무작위 문자열로 바뀝니다.",
	"alwaysMarkSensitive": "미디어를 항상 열람 주의로 설정",
	"enableAutoSensitive": "자동 NSFW 탐지",
	"beta": "베타",
	"enableAutoSensitiveDescription": "이용 가능할 경우 기계학습을 통해 자동으로 미디어 NSFW를 설정합니다. 이 기능을 해제하더라도, 서버 정책에 따라 자동으로 설정될 수 있습니다.",
	"image": "이미지",
	"watermark": "워터마크",
	"watermarkEditorTip": "이미지에 크레딧 정보 등의 워터마크를 추가할 수 있습니다.",
	"syncBetweenDevices": "장치간 동기화",
	"none": "없음",
	"noName": "이름이 없습니다.",
	"defaultPreset": "기본 프리셋",
	"frame": "프레임",
	"imageFrameEditorTip": "이미지에 프레임이나 메타 데이터를 포함한 라벨을 추가해 장식할 수 있습니다.",
	"low": "낮음",
	"compressionQualityHigh": "고품질",
	"compressionSizeLarge": "대형",
	"medium": "보통",
	"compressionQualityMedium": "중간 품질",
	"compressionSizeMedium": "중형",
	"high": "높음",
	"compressionQualityLow": "저품질",
	"compressionSizeSmall": "소형",
	"defaultCompressionLevel": "기본 압축 정도 ",
	"defaultCompressionLevel_description": "낮추면 품질을 유지합니다만 파일 크기는 증가합니다. <br>높이면 파일 크기를 줄일 수 있습니다만 품질은 저하됩니다.",
	"video": "동영상",
	"error": "오류"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"drive": "Schijf",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Gebruik",
	"capacity": "Capaciteit",
	"inUse": "Gebruikt",
	"statistics": "Statistieken",
	"general": "Algemeen",
	"uploadFolder": "Standaardmap voor uploaden",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Markeer media standaard als gevoelig",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Afbeeldingen",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Niets",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Lage",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Hoge",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Fout"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"drive": "Drive",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Usage",
	"capacity": "Capacity",
	"inUse": "Used",
	"statistics": "Statistikk",
	"general": "Generelt",
	"uploadFolder": "Default folder for uploads",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Mark as sensitive by default",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Bilde",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Ingen",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Lav",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Høy",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Feil"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"drive": "Dysk",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Użycie",
	"capacity": "Pojemność",
	"inUse": "Użyto",
	"statistics": "Statystyki",
	"general": "Ogólne",
	"uploadFolder": "Domyślne położenie wysłanych",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Oznacz domyślnie jako NSFW",
	"enableAutoSensitive": "Automatyczne oznaczanie NSFW",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Umożliwia automatyczne wykrywanie i oznaczanie zawartości NSFW za pomocą uczenia maszynowego. Nawet jeśli ta opcja jest wyłączona, może być włączona w całej instancji.",
	"image": "Zdjęcia",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Brak",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Niski",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Średnie",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Wysoki",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Błąd"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"drive": "Drive",
	"settingsDriveBanner": "Você consegue administrar e configurar o drive, conferir o seu uso e configurar as opções de envio de arquivos.",
	"usageAmount": "Quantidade utilizada",
	"capacity": "Capacidade",
	"inUse": "Em uso",
	"statistics": "Estatísticas",
	"general": "Geral",
	"uploadFolder": "Destino de upload padrão",
	"drivecleaner": "Limpeza do drive",
	"keepOriginalFilename": "Manter nome original do arquivo",
	"keepOriginalFilenameDescription": "Se você desabilitar essa opção, os nomes de arquivos serão substituídos por uma sequência aleatória ao enviar arquivos.",
	"alwaysMarkSensitive": "Marcar como sensível por padrão",
	"enableAutoSensitive": "Marcar automaticamente como conteúdo sensível",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Quando disponível, a marcação de mídia sensível será automaticamente atribuído ao conteúdo de mídia usando aprendizado de máquina. Mesmo que você desative essa função, em alguns servidores, isso pode ser configurado automaticamente.",
	"image": "imagem",
	"watermark": "Marca d'água",
	"watermarkEditorTip": "Uma marca d'água, como informação de autoria, pode ser adicionada à imagem.",
	"syncBetweenDevices": "Sincronizar entre dispositivos",
	"none": "Nenhum",
	"noName": "Sem nome",
	"defaultPreset": "Predefinição Padrão",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Baixo",
	"compressionQualityHigh": "Qualidade alta",
	"compressionSizeLarge": "Tamanho grande",
	"medium": "Médio",
	"compressionQualityMedium": "Qualidade média",
	"compressionSizeMedium": "Tamanho médio",
	"high": "Alto",
	"compressionQualityLow": "Qualidade baixa",
	"compressionSizeSmall": "Tamanho pequeno",
	"defaultCompressionLevel": "Nível padrão de compressão",
	"defaultCompressionLevel_description": "Menor compressão preserva a qualidade mas aumenta o tamanho do arquivo.<br>Maior compressão reduz o tamanho do arquivo mas diminui a qualidade.",
	"video": "Vídeo",
	"error": "Erro"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"drive": "Диск",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Использовано",
	"capacity": "Ёмкость",
	"inUse": "Занято",
	"statistics": "Статистика",
	"general": "Общее",
	"uploadFolder": "Место загрузки по умолчанию",
	"drivecleaner": "Очиститель дисков",
	"keepOriginalFilename": "Сохранять исходное имя файла",
	"keepOriginalFilenameDescription": "Если вы выключите данную настройку, имена файлов будут автоматически заменены случайной строкой при загрузке.",
	"alwaysMarkSensitive": "Отмечать файлы как «содержимое не для всех» по умолчанию",
	"enableAutoSensitive": "Автоматическое определение содержимого не для всех",
	"beta": "Бета",
	"enableAutoSensitiveDescription": "Позволяет определять наличие содержимого не для всех при помощи искусственного интеллекта там, где это возможно. Даже если эту опцию отключить, она всё равно может быть включена на весь инстанс.",
	"image": "Изображения",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Синхронизировать между устройствами",
	"none": "Ничего",
	"noName": "Имя не указано",
	"defaultPreset": "Default Preset",
	"frame": "Рамки",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Низкий",
	"compressionQualityHigh": "Высокое качество",
	"compressionSizeLarge": "Крупный размер",
	"medium": "Средне",
	"compressionQualityMedium": "Среднее качество",
	"compressionSizeMedium": "Средний размер",
	"high": "Высокий",
	"compressionQualityLow": "Низкое качество",
	"compressionSizeSmall": "Маленький размер",
	"defaultCompressionLevel": "Уровень сжатия по умолчанию",
	"defaultCompressionLevel_description": "Уровень сжатия ниже сохраняет качество лучше, но увеличивает размер файла.<br>Уровень сжатия выше уменьшает размер файла, но уменьшает качество.",
	"video": "Видео",
	"error": "Ошибка"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"drive": "Disk",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Využitie",
	"capacity": "Kapacita",
	"inUse": "Použité",
	"statistics": "Štatistiky",
	"general": "Všeobecné",
	"uploadFolder": "Predvolený priečinok pre nahrávanie",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Predvolene označovať ako NSFW",
	"enableAutoSensitive": "Automatická detekcia NSFW",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Ak je zapnuté, príznak NSFW sa na médiách automaticky nastaví pomocou strojového učenia. Aj keď je táto funkcia vypnutá, v niektorých prípadoch sa môže nastaviť automaticky.",
	"image": "Obrázky",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Žiadne",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Málo",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Stredné",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Vysoká",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Chyba"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"drive": "ไดรฟ์",
	"settingsDriveBanner": "สามารถจัดการและตั้งค่าไดรฟ์ ตรวจสอบการใช้งาน และตั้งค่าการอัปโหลดไฟล์ได้",
	"usageAmount": "การใช้งาน",
	"capacity": "ความจุ",
	"inUse": "ใช้แล้ว",
	"statistics": "สถิติการใช้งาน",
	"general": "ทั่วไป",
	"uploadFolder": "โฟลเดอร์เริ่มต้นสำหรับอัปโหลด",
	"drivecleaner": "ทำความสะอาดไดรฟ์",
	"keepOriginalFilename": "คงชื่อไฟล์เดิมไว้",
	"keepOriginalFilenameDescription": "หากปิดการตั้งค่านี้ ในระหว่างการอัปโหลดชื่อไฟล์จะถูกแทนที่ด้วยสตริงแบบสุ่มโดยอัตโนมัติ",
	"alwaysMarkSensitive": "ทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อนเป็นค่าเริ่มต้น",
	"enableAutoSensitive": "ทำเครื่องหมายว่ามีเนื้อหาที่ละเอียดอ่อนโดยอัตโนมัติ",
	"beta": "เบต้า",
	"enableAutoSensitiveDescription": "อนุญาตให้ตรวจหาและทำเครื่องหมายสื่อว่ามีเนื้อหาโดยละเอียดอ่อนโดยอัตโนมัติ ผ่าน Machine Learning หากเป็นไปได้ แม้ว่าคุณจะปิดคุณสมบัตินี้ ก็อาจถูกตั้งค่าโดยอัตโนมัติ ทั้งนี้ขึ้นอยู่กับเซิร์ฟเวอร์",
	"image": "รูปภาพ",
	"watermark": "ลายน้ำ",
	"watermarkEditorTip": "สามารถเพิ่มลายน้ำ เช่น ข้อมูลเครดิต ลงในภาพได้",
	"syncBetweenDevices": "ซิงค์ระหว่างอุปกรณ์",
	"none": "ไม่มี",
	"noName": "ไม่มีชื่อ",
	"defaultPreset": "พรีเซ็ตเริ่มต้น",
	"frame": "เฟรม",
	"imageFrameEditorTip": "สามารถตกแต่งภาพโดยการเพิ่มป้ายที่มีเฟรมหรือเมทาเดต้าได้",
	"low": "ต่ำ",
	"compressionQualityHigh": "คุณภาพสูง",
	"compressionSizeLarge": "ขนาดใหญ่",
	"medium": "ปานกลาง",
	"compressionQualityMedium": "คุณภาพปานกลาง",
	"compressionSizeMedium": "ขนาดปานกลาง",
	"high": "สูง",
	"compressionQualityLow": "คุณภาพต่ำ",
	"compressionSizeSmall": "ขนาดเล็ก",
	"defaultCompressionLevel": "ค่าการบีบอัดเริ่มต้น",
	"defaultCompressionLevel_description": "ถ้าต่ำ จะรักษาคุณภาพได้ แต่ขนาดไฟล์จะเพิ่มขึ้น<br>ถ้าสูง จะลดขนาดไฟล์ได้ แต่คุณภาพจะลดลง",
	"video": "วีดีโอ",
	"error": "ผิดพลาด!"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"drive": "Drive",
	"settingsDriveBanner": "Drive'ı yönetebilir ve yapılandırabilir, kullanımı kontrol edebilir ve dosya yükleme ayarlarını yapılandırabilirsin.",
	"usageAmount": "Kullanım",
	"capacity": "Kapasite",
	"inUse": "Kullanılıyor",
	"statistics": "İstatistikler",
	"general": "Genel",
	"uploadFolder": "Yüklemeler için varsayılan klasör",
	"drivecleaner": "Drive Temizleyici",
	"keepOriginalFilename": "Orijinal dosya adını koru",
	"keepOriginalFilenameDescription": "Bu ayarı kapatırsan, dosya yüklediğinde dosya adları otomatik olarak rastgele bir dizeyle değiştirilecek.",
	"alwaysMarkSensitive": "Varsayılan olarak hassas olarak işaretle",
	"enableAutoSensitive": "Otomatik olarak hassas olarak işaretleme",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Mümkün olduğunda, Makine Öğrenimi yoluyla hassas ortamların otomatik olarak algılanmasını ve işaretlenmesini sağlar. Bu seçenek devre dışı bırakılmış olsa bile, örnek genelinde etkinleştirilebilir.",
	"image": "Görsel",
	"watermark": "Filigran",
	"watermarkEditorTip": "Kredi bilgileri gibi bir filigran görüntüye eklenebilir.",
	"syncBetweenDevices": "Cihazlar arasında senkronizasyon",
	"none": "Hiçbiri",
	"noName": "İsim yok",
	"defaultPreset": "Varsayılan Ön Ayar",
	"frame": "Çerçeve",
	"imageFrameEditorTip": "Görselleri, meta verileri içeren çerçeveler ve etiketler ekleyerek süsleyebilirsiniz.",
	"low": "Düşük",
	"compressionQualityHigh": "Yüksek Kalite ",
	"compressionSizeLarge": "Büyük Boyut",
	"medium": "Orta",
	"compressionQualityMedium": "Orta Kalite",
	"compressionSizeMedium": "Orta Boyut",
	"high": "Yüksek",
	"compressionQualityLow": "Düşük Kalite ",
	"compressionSizeSmall": "Küçük Boyut",
	"defaultCompressionLevel": "Varsayılan sıkıştırma seviyesi",
	"defaultCompressionLevel_description": "Ayarı düşürmek kaliteyi koruyacak ancak dosya boyutunu artıracaktır. <br> Ayarı yükseltmek dosya boyutunu küçültecek ancak kaliteyi düşürecektir.",
	"video": "Video",
	"error": "Hata"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"drive": "Drive",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Usage",
	"capacity": "Capacity",
	"inUse": "Used",
	"statistics": "Statistics",
	"general": "General",
	"uploadFolder": "Default folder for uploads",
	"drivecleaner": "Drive Cleaner",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Mark as sensitive by default",
	"enableAutoSensitive": "Automatic marking as sensitive",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Allows automatic detection and marking of sensitive media through Machine Learning where possible. Even if this option is disabled, it may be enabled instance-wide.",
	"image": "Image",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "None",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Low",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Medium",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "High",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Error"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"drive": "Диск",
	"settingsDriveBanner": "Ви можете курувати та налаштовувати диск, дивитися використовування, та керувати налаштуваннями вивантаження файлів. ",
	"usageAmount": "Використане",
	"capacity": "Ємність",
	"inUse": "Зайнято",
	"statistics": "Статистика",
	"general": "Загальне",
	"uploadFolder": "Місце для завантаження за замовчуванням",
	"drivecleaner": "Очищувач Диска\n",
	"keepOriginalFilename": "Зберігати початкову назву файлу",
	"keepOriginalFilenameDescription": "Якщо вимкнути це налаштування, під час завантаження файлів їхні назви автоматично замінюватимуться випадковими рядками.",
	"alwaysMarkSensitive": "Позначати NSFW за замовчуванням",
	"enableAutoSensitive": "Автоматичне маркування NSFW",
	"beta": "Бета",
	"enableAutoSensitiveDescription": "Дозволяє, за можливості, автоматично виявляти й позначати чутливі медіа за допомогою машинного навчання. Навіть якщо цю опцію вимкнено, вона може бути увімкнена на рівні інстансу.",
	"image": "Зображення",
	"watermark": "Водяний знак",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Синхронізувати між пристроями",
	"none": "Відсутній",
	"noName": "Ім'я не вказано",
	"defaultPreset": "Default Preset",
	"frame": "Кадр",
	"imageFrameEditorTip": "Ви можете декорувати зображення додаючи позначки, які мають кадри або метаданні.",
	"low": "Низький",
	"compressionQualityHigh": "Висока якість",
	"compressionSizeLarge": "Великий розмір",
	"medium": "Середній",
	"compressionQualityMedium": "Середня якість",
	"compressionSizeMedium": "Середній розмір",
	"high": "Високий",
	"compressionQualityLow": "Низька якість",
	"compressionSizeSmall": "Малий розмір",
	"defaultCompressionLevel": "Рівень стиснення по замовчуванню",
	"defaultCompressionLevel_description": "Нижчий рівень стиснення зберігає якість, але збільшує розмір файлу.<br>Вищий рівень стиснення зменшує розмір файлу, але погіршує якість.",
	"video": "Відео",
	"error": "Помилка"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"drive": "Ổ đĩa",
	"settingsDriveBanner": "You can manage and configure the drive, check usage, and configure file upload settings.",
	"usageAmount": "Sử dụng",
	"capacity": "Sức chứa",
	"inUse": "Đã dùng",
	"statistics": "Thống kê",
	"general": "Tổng quan",
	"uploadFolder": "Thư mục tải lên mặc định",
	"drivecleaner": "Trình dọn đĩa",
	"keepOriginalFilename": "Keep original file name",
	"keepOriginalFilenameDescription": "If you turn off this setting, files names will be replaced with random string automatically when you upload files.",
	"alwaysMarkSensitive": "Luôn đánh dấu NSFW",
	"enableAutoSensitive": "Tự động đánh dấu NSFW",
	"beta": "Beta",
	"enableAutoSensitiveDescription": "Cho phép tự động phát hiện và đánh dấu media NSFW thông qua học máy, nếu có thể. Ngay cả khi tùy chọn này bị tắt, nó vẫn có thể được bật trên toàn máy chủ.",
	"image": "Hình ảnh",
	"watermark": "Watermark",
	"watermarkEditorTip": "A watermark, such as credit information, can be added to the image.",
	"syncBetweenDevices": "Sync between devices",
	"none": "Không",
	"noName": "No name",
	"defaultPreset": "Default Preset",
	"frame": "Frame",
	"imageFrameEditorTip": "You can decorate images by adding labels that include frames and metadata.",
	"low": "Thấp",
	"compressionQualityHigh": "High quality",
	"compressionSizeLarge": "Large size",
	"medium": "Vừa",
	"compressionQualityMedium": "Medium quality",
	"compressionSizeMedium": "Medium size",
	"high": "Cao",
	"compressionQualityLow": "Low quality",
	"compressionSizeSmall": "Small size",
	"defaultCompressionLevel": "Default compression level",
	"defaultCompressionLevel_description": "Lower compression preserves quality but increases file size.<br>Higher compression reduces file size but lowers quality.",
	"video": "Video",
	"error": "Lỗi"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"drive": "网盘",
	"settingsDriveBanner": "可在此管理和设置网盘、确认使用量及配置上传文件的设置。",
	"usageAmount": "使用量",
	"capacity": "容量",
	"inUse": "已使用",
	"statistics": "统计",
	"general": "常规设置",
	"uploadFolder": "默认上传文件夹",
	"drivecleaner": "网盘整理",
	"keepOriginalFilename": "保持原文件名",
	"keepOriginalFilenameDescription": "若关闭此设置，上传文件时文件名将被替换为随机字符。",
	"alwaysMarkSensitive": "默认将媒体文件标记为敏感内容",
	"enableAutoSensitive": "自动 NSFW 识别",
	"beta": "测试",
	"enableAutoSensitiveDescription": "使用机器学习在可用时自动使用 NSFW 标记来标记媒体。即使您关闭此功能，根据服务器的不同，它仍然可能会自动设置。",
	"image": "图片",
	"watermark": "水印",
	"watermarkEditorTip": "可在图像内增加包含作者等信息的水印。",
	"syncBetweenDevices": "设备间同步",
	"none": "无",
	"noName": "未命名",
	"defaultPreset": "默认预设",
	"frame": "边框",
	"imageFrameEditorTip": "您可以通过添加包含边框和元数据的标签来装饰图片。",
	"low": "低",
	"compressionQualityHigh": "高质量",
	"compressionSizeLarge": "大",
	"medium": "中",
	"compressionQualityMedium": "中质量",
	"compressionSizeMedium": "中",
	"high": "高",
	"compressionQualityLow": "低质量",
	"compressionSizeSmall": "小",
	"defaultCompressionLevel": "默认压缩等级",
	"defaultCompressionLevel_description": "较低的等级可以保持质量，但会增加文件大小。<br>较高的等级可以减少文件大小，但相对应的质量将会降低。",
	"video": "视频",
	"error": "错误"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"drive": "雲端硬碟",
	"settingsDriveBanner": "您可以管理和設定雲端硬碟、確認使用量，以及調整上傳檔案時的設定。",
	"usageAmount": "使用量",
	"capacity": "容量",
	"inUse": "已使用",
	"statistics": "統計",
	"general": "一般",
	"uploadFolder": "預設上傳資料夾",
	"drivecleaner": "雲端硬碟清掃器",
	"keepOriginalFilename": "保留原始檔名",
	"keepOriginalFilenameDescription": "如果關閉此設定，上傳時檔案名稱會自動替換為隨機字串。",
	"alwaysMarkSensitive": "預設標記檔案為敏感內容",
	"enableAutoSensitive": "自動 NSFW 判定",
	"beta": "測試版",
	"enableAutoSensitiveDescription": "如果可行，它將使用機器學習技術判斷檔案是否需要標記為敏感。即使關閉此功能，也可能會依伺服器規則而自動啟用。",
	"image": "圖片",
	"watermark": "浮水印",
	"watermarkEditorTip": "可以在圖片中以浮水印加上出處等資訊。",
	"syncBetweenDevices": "裝置之間的同步化",
	"none": "無",
	"noName": "沒有名稱",
	"defaultPreset": "預設值",
	"frame": "邊框",
	"imageFrameEditorTip": "可以在圖片上添加包含邊框或 EXIF 的標籤來裝飾圖片。",
	"low": "低",
	"compressionQualityHigh": "高品質",
	"compressionSizeLarge": "大",
	"medium": "中",
	"compressionQualityMedium": "中品質",
	"compressionSizeMedium": "中",
	"high": "高",
	"compressionQualityLow": "低品質",
	"compressionSizeSmall": "小",
	"defaultCompressionLevel": "預設的壓縮程度",
	"defaultCompressionLevel_description": "低的話可以保留品質，但是會增加檔案的大小。<br>高的話可以減少檔案大小，但是會降低品質。",
	"video": "影片",
	"error": "錯誤"
}
</locale>
