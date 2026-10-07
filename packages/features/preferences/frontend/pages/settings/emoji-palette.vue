<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/emoji-palette" :label="$locale.sfc.emojiPalette" :keywords="['emoji', 'palette']" icon="ti ti-mood-happy">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f3a8.png" color="#ff9100">
			<SearchText>{{ $locale.sfc.emojiPaletteBanner }}</SearchText>
		</MkFeatureBanner>

		<FormSection first>
			<template #label>{{ $locale.sfc.palettes }}</template>

			<div class="_gaps_s">
				<XPalette
					v-for="palette in prefer.r.emojiPalettes.value"
					:key="palette.id"
					:palette="palette"
					@updateEmojis="emojis => updatePaletteEmojis(palette.id, emojis)"
					@updateName="name => updatePaletteName(palette.id, name)"
					@del="delPalette(palette.id)"
				/>
				<MkButton primary rounded style="margin: auto;" @click="addPalette"><i class="ti ti-plus"></i></MkButton>
			</div>
		</FormSection>

		<FormSection>
			<div class="_gaps_m">
				<SearchMarker :keywords="['sync', 'palettes', 'devices']">
					<MkSwitch :modelValue="palettesSyncEnabled" @update:modelValue="changePalettesSyncEnabled">
						<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ $locale.sfc.enableSyncBetweenDevicesForPalettes }}</SearchLabel></template>
					</MkSwitch>
				</SearchMarker>
			</div>
		</FormSection>

		<FormSection>
			<div class="_gaps_m">
				<SearchMarker :keywords="['main', 'palette']">
					<MkPreferenceContainer k="emojiPaletteForMain">
						<MkSelect v-model="emojiPaletteForMain" :items="emojiPaletteForMainDef">
							<template #label><SearchLabel>{{ $locale.sfc.paletteForMain }}</SearchLabel></template>
						</MkSelect>
					</MkPreferenceContainer>
				</SearchMarker>

				<SearchMarker :keywords="['reaction', 'palette']">
					<MkPreferenceContainer k="emojiPaletteForReaction">
						<MkSelect v-model="emojiPaletteForReaction" :items="emojiPaletteForReactionDef">
							<template #label><SearchLabel>{{ $locale.sfc.paletteForReaction }}</SearchLabel></template>
						</MkSelect>
					</MkPreferenceContainer>
				</SearchMarker>
			</div>
		</FormSection>

		<SearchMarker :keywords="['emoji', 'picker', 'display']">
			<FormSection>
				<template #label><SearchLabel>{{ $locale.sfc.emojiPickerDisplay }}</SearchLabel></template>

				<div class="_gaps_m">
					<SearchMarker :keywords="['emoji', 'picker', 'scale', 'size']">
						<MkPreferenceContainer k="emojiPickerScale">
							<MkRadios
								v-model="emojiPickerScale"
								:options="emojiPickerScaleDef"
							>
								<template #label><SearchLabel>{{ $locale.sfc.size }}</SearchLabel></template>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'width', 'column', 'size']">
						<MkPreferenceContainer k="emojiPickerWidth">
							<MkRadios
								v-model="emojiPickerWidth"
								:options="emojiPickerWidthDef"
							>
								<template #label><SearchLabel>{{ $locale.sfc.numberOfColumn }}</SearchLabel></template>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'height', 'size']">
						<MkPreferenceContainer k="emojiPickerHeight">
							<MkRadios
								v-model="emojiPickerHeight"
								:options="emojiPickerHeightDef"
							>
								<template #label><SearchLabel>{{ $locale.sfc.height }}</SearchLabel></template>
							</MkRadios>
						</MkPreferenceContainer>
					</SearchMarker>

					<SearchMarker :keywords="['emoji', 'picker', 'style']">
						<MkPreferenceContainer k="emojiPickerStyle">
							<MkSelect
								v-model="emojiPickerStyle" :items="[
									{ label: $locale.sfc.auto, value: 'auto' },
									{ label: $locale.sfc.popup, value: 'popup' },
									{ label: $locale.sfc.drawer, value: 'drawer' },
								]"
							>
								<template #label><SearchLabel>{{ $locale.sfc.style }}</SearchLabel></template>
								<template #caption>{{ $locale.sfc.needReloadToApply }}</template>
							</MkSelect>
						</MkPreferenceContainer>
					</SearchMarker>

					<MkButton @click="previewPicker"><i class="ti ti-eye"></i> {{ $locale.sfc.preview }}</MkButton>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import XPalette from '@features/preferences/frontend/pages/settings/emoji-palette.palette.vue';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import type { MkRadiosOption } from '@features/ui/frontend/components/MkRadios.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkPreferenceContainer from '@features/preferences/frontend/components/MkPreferenceContainer.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { emojiPicker } from '@features/emojis/frontend/utility/emoji-picker.js';

const emojiPaletteForReaction = prefer.model('emojiPaletteForReaction');
const emojiPaletteForReactionDef = computed<MkSelectItem[]>(() => [
	{ label: `(${$locale.value.sfc.auto})`, value: null },
	...prefer.s.emojiPalettes.map(palette => ({
		label: palette.name === '' ? `(${$locale.value.sfc.noName})` : palette.name,
		value: palette.id,
	})),
]);
const emojiPaletteForMain = prefer.model('emojiPaletteForMain');
const emojiPaletteForMainDef = computed<MkSelectItem[]>(() => [
	{ label: `(${$locale.value.sfc.auto})`, value: null },
	...prefer.s.emojiPalettes.map(palette => ({
		label: palette.name === '' ? `(${$locale.value.sfc.noName})` : palette.name,
		value: palette.id,
	})),
]);
const emojiPickerScale = prefer.model('emojiPickerScale');
const emojiPickerScaleDef = [
	{ label: $locale.value.sfc.small, value: 1 },
	{ label: $locale.value.sfc.medium, value: 2 },
	{ label: $locale.value.sfc.large, value: 3 },
	{ label: $locale.value.sfc.large + '+', value: 4 },
	{ label: $locale.value.sfc.large + '++', value: 5 },
] as MkRadiosOption<number>[];

const emojiPickerWidth = prefer.model('emojiPickerWidth');
const emojiPickerWidthDef = [
	{ label: '5', value: 1 },
	{ label: '6', value: 2 },
	{ label: '7', value: 3 },
	{ label: '8', value: 4 },
	{ label: '9', value: 5 },
] as MkRadiosOption<number>[];

const emojiPickerHeight = prefer.model('emojiPickerHeight');
const emojiPickerHeightDef = [
	{ label: $locale.value.sfc.small, value: 1 },
	{ label: $locale.value.sfc.medium, value: 2 },
	{ label: $locale.value.sfc.large, value: 3 },
	{ label: $locale.value.sfc.large + '+', value: 4 },
] as MkRadiosOption<number>[];

const emojiPickerStyle = prefer.model('emojiPickerStyle');

const palettesSyncEnabled = ref(prefer.isSyncEnabled('emojiPalettes'));

function changePalettesSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('emojiPalettes').then((res) => {
			if (res == null) return;
			if (res.enabled) palettesSyncEnabled.value = true;
		});
	} else {
		prefer.disableSync('emojiPalettes');
		palettesSyncEnabled.value = false;
	}
}

function addPalette() {
	prefer.commit('emojiPalettes', [
		...prefer.s.emojiPalettes,
		{
			id: genId(),
			name: '',
			emojis: [],
		},
	]);
}

function updatePaletteEmojis(id: string, emojis: string[]) {
	prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map(palette => {
		if (palette.id === id) {
			return {
				...palette,
				emojis,
			};
		} else {
			return palette;
		}
	}));
}

function updatePaletteName(id: string, name: string) {
	prefer.commit('emojiPalettes', prefer.s.emojiPalettes.map(palette => {
		if (palette.id === id) {
			return {
				...palette,
				name,
			};
		} else {
			return palette;
		}
	}));
}

function delPalette(id: string) {
	if (prefer.s.emojiPalettes.length === 1) {
		addPalette();
	}
	prefer.commit('emojiPalettes', prefer.s.emojiPalettes.filter(palette => palette.id !== id));
	if (prefer.s.emojiPaletteForMain === id) {
		prefer.commit('emojiPaletteForMain', null);
	}
	if (prefer.s.emojiPaletteForReaction === id) {
		prefer.commit('emojiPaletteForReaction', null);
	}
}

function getHTMLElement(ev: PointerEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function previewPicker(ev: PointerEvent) {
	emojiPicker.show(getHTMLElement(ev));
}

definePage(() => ({
	title: $locale.value.sfc.emojiPalette,
	icon: 'ti ti-mood-happy',
}));
</script>

<style lang="scss" module>
.emojis {
  padding: 12px;
  font-size: 1.1em;
}

.emojisItem {
  display: inline-block;
  padding: 8px;
  cursor: move;
}

.emojisAdd {
  display: inline-block;
  padding: 8px;
}

.editorCaption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"auto": "تلقائي",
	"noName": "No name",
	"small": "صغير",
	"medium": "متوسط",
	"large": "كبير",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "الحجم",
	"numberOfColumn": "عدد الأعمدة",
	"height": "الإرتفاع",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "سيطبق هذا بعد إعادة التحميل.",
	"preview": "معاينة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"auto": "Automàtic ",
	"noName": "No hi ha un nom disponible ",
	"small": "Petit",
	"medium": "Mitjà",
	"large": "Gran",
	"emojiPalette": "Calaix d'emojis",
	"emojiPaletteBanner": "Pots registrar ajustos preestablerts com paletes perquè es mostrin permanentment al selector d'emojis, o personalitzar la configuració de visió del selector.",
	"palettes": "Calaixos d'emojis",
	"enableSyncBetweenDevicesForPalettes": "Activa la sincronització dels calaixos d'emojis entre dispositius",
	"paletteForMain": "Calaix d'emojis principal",
	"paletteForReaction": "Calaix d'emojis per reaccions",
	"emojiPickerDisplay": "Mostrar el selector d'emojis",
	"size": "Mida",
	"numberOfColumn": "Nombre de columnes",
	"height": "Alçària",
	"popup": "Emergent",
	"drawer": "Calaix",
	"style": "Estil",
	"needReloadToApply": "Es requereix recarregar per reflectir aquesta opció ",
	"preview": "Vista prèvia"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Malé",
	"medium": "Střední",
	"large": "Velké",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Velikost",
	"numberOfColumn": "Počet sloupců",
	"height": "Výška",
	"popup": "Vyskakovací okno",
	"drawer": "Boční menu",
	"style": "Vzhled",
	"needReloadToApply": "K projevení nastavení je zapotřebí obnovit stránku.",
	"preview": "Náhled"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Size",
	"numberOfColumn": "Number of columns",
	"height": "Height",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "A reload is required for this to be reflected.",
	"preview": "Preview"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"auto": "Automatisch",
	"noName": "Kein Name",
	"small": "Klein",
	"medium": "Mittel",
	"large": "Groß",
	"emojiPalette": "Emoji-Palette",
	"emojiPaletteBanner": "Sie können Voreinstellungen, die im Emoji-Picker dauerhaft angezeigt werden sollen, als Palette registrieren oder die Anzeigeart des Pickers anpassen.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Synchronisierung der Paletten zwischen Geräten aktivieren",
	"paletteForMain": "Hauptpalette",
	"paletteForReaction": "Reaktions-Palette",
	"emojiPickerDisplay": "Anzeige der Emoji-Auswahl",
	"size": "Größe",
	"numberOfColumn": "Spaltenanzahl",
	"height": "Höhe",
	"popup": "Pop-up",
	"drawer": "App-Übersicht",
	"style": "Stil",
	"needReloadToApply": "Diese Einstellung tritt nach einer Aktualisierung der Seite in Kraft.",
	"preview": "Vorschau"
}
</locale>

<locale locale="en-US" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Size",
	"numberOfColumn": "Number of columns",
	"height": "Height",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "A reload is required for this to be reflected.",
	"preview": "Preview"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"auto": "Automático",
	"noName": "No hay nombre.",
	"small": "Pequeño",
	"medium": "Mediano",
	"large": "Grande",
	"emojiPalette": "Paleta emoji",
	"emojiPaletteBanner": "Puedes registrar ajustes preestablecidos como paletas para que se muestren permanentemente en el selector de emojis, o personalizar el método de visualización del selector.",
	"palettes": "Paleta\n",
	"enableSyncBetweenDevicesForPalettes": "Activar la sincronización de paletas entre dispositivos",
	"paletteForMain": "Paleta principal",
	"paletteForReaction": "Paleta utilizada para las reacciones",
	"emojiPickerDisplay": "Mostrar el selector de emojis",
	"size": "Tamaño",
	"numberOfColumn": "Cantidad de columnas",
	"height": "Altura",
	"popup": "Ventana emergente",
	"drawer": "Cajón de Aplicaciones",
	"style": "Diseño",
	"needReloadToApply": "Se requiere un reinicio para la aplicar los cambios",
	"preview": "Vista previa"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"auto": "Automatique",
	"noName": "No name",
	"small": "Petit",
	"medium": "Moyen",
	"large": "Grand",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Affichage du sélecteur d'émojis",
	"size": "Taille",
	"numberOfColumn": "Nombre de colonnes",
	"height": "Hauteur",
	"popup": "Pop-up",
	"drawer": "Sélecteur",
	"style": "Style",
	"needReloadToApply": "Ce paramètre s'appliquera après un rechargement.",
	"preview": "Aperçu"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"auto": "Otomatis",
	"noName": "Tidak ada nama",
	"small": "Kecil",
	"medium": "Sedang",
	"large": "Besar",
	"emojiPalette": "Palet emoji",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Tampilan palet emoji",
	"size": "Ukuran",
	"numberOfColumn": "Jumlah per kolom",
	"height": "Tinggi",
	"popup": "Pemunculan",
	"drawer": "Drawer",
	"style": "Gaya",
	"needReloadToApply": "Pengaturan ini hanya akan diterapkan setelah memuat ulang halaman.",
	"preview": "Pratinjau"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"auto": "Automatico",
	"noName": "Senza nome",
	"small": "Piccolo",
	"medium": "Medio",
	"large": "Grande",
	"emojiPalette": "Tavolozza emoji",
	"emojiPaletteBanner": "Puoi salvare i le emoji predefinite da appuntare in alto nel raccoglitore emoji come tavolozza e personalizzare in che modo visualizzare il raccoglitore.",
	"palettes": "Tavolozza",
	"enableSyncBetweenDevicesForPalettes": "Attiva la sincronizzazione tra dispositivi",
	"paletteForMain": "Tavolozza principale",
	"paletteForReaction": "Tavolozza per reazioni",
	"emojiPickerDisplay": "Visualizza selettore",
	"size": "Dimensioni",
	"numberOfColumn": "Quantità di colonne",
	"height": "Altezza",
	"popup": "Popup",
	"drawer": "Drawer",
	"style": "Stile",
	"needReloadToApply": "È necessario riavviare per rendere effettive le modifiche.",
	"preview": "Anteprima"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"auto": "自動",
	"noName": "名前はありません",
	"small": "小",
	"medium": "中",
	"large": "大",
	"emojiPalette": "絵文字パレット",
	"emojiPaletteBanner": "絵文字ピッカーに固定表示するプリセットをパレットとして登録したり、ピッカーの表示方法をカスタマイズしたりできます。",
	"palettes": "パレット",
	"enableSyncBetweenDevicesForPalettes": "パレットのデバイス間同期を有効にする",
	"paletteForMain": "メインで使用するパレット",
	"paletteForReaction": "リアクションで使用するパレット",
	"emojiPickerDisplay": "ピッカーの表示",
	"size": "サイズ",
	"numberOfColumn": "列の数",
	"height": "高さ",
	"popup": "ポップアップ",
	"drawer": "ドロワー",
	"style": "スタイル",
	"needReloadToApply": "反映には再起動が必要です。",
	"preview": "プレビュー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"auto": "自動",
	"noName": "名前はあらへんで",
	"small": "ちいさい",
	"medium": "ふつう",
	"large": "でかい",
	"emojiPalette": "絵文字パレット",
	"emojiPaletteBanner": "絵文字ピッカーに置いとくプリセットをパレットっていうので登録したり、ピッカーの見た目を変えたりできるで。",
	"palettes": "パレット",
	"enableSyncBetweenDevicesForPalettes": "パレットのデバイス間同期をつけとく",
	"paletteForMain": "メインで使うパレット",
	"paletteForReaction": "リアクションで使うパレット",
	"emojiPickerDisplay": "ピッカーの表示",
	"size": "大きさ",
	"numberOfColumn": "列の数",
	"height": "高さ",
	"popup": "ポップアップ",
	"drawer": "ドロワー",
	"style": "スタイル",
	"needReloadToApply": "反映には再起動せなあかんで",
	"preview": "プレビュー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Size",
	"numberOfColumn": "Number of columns",
	"height": "Height",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "A reload is required for this to be reflected.",
	"preview": "Preview"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Size",
	"numberOfColumn": "Number of columns",
	"height": "Height",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "A reload is required for this to be reflected.",
	"preview": "Preview"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"auto": "자동",
	"noName": "이름이 없습니다.",
	"small": "작게",
	"medium": "보통",
	"large": "크게",
	"emojiPalette": "이모지 팔레트",
	"emojiPaletteBanner": "이모티콘 선택기에 고정 표시되는 프리셋을 팔레트로 등록하거나 선택기의 표시 방법을 커스터마이징할 수 있습니다.",
	"palettes": "팔레트",
	"enableSyncBetweenDevicesForPalettes": "팔레트의 디바이스 간 동기화를 활성화",
	"paletteForMain": "메인으로 사용할 팔레트",
	"paletteForReaction": "리액션으로 사용할 팔레트",
	"emojiPickerDisplay": "선택기 표시",
	"size": "크기",
	"numberOfColumn": "한 줄에 보일 리액션의 수",
	"height": "높이",
	"popup": "팝업",
	"drawer": "서랍",
	"style": "스타일",
	"needReloadToApply": "변경 사항은 새로고침하면 적용됩니다.",
	"preview": "미리보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Klein",
	"medium": "Medium",
	"large": "Groot",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji kiezer weergave",
	"size": "Size",
	"numberOfColumn": "Number of columns",
	"height": "Hoogte",
	"popup": "Pop-up",
	"drawer": "Lade",
	"style": "Stijl",
	"needReloadToApply": "Deze instelling wordt van kracht nadat de pagina is vernieuwd.",
	"preview": "Voorbeeld"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"auto": "Automatisk",
	"noName": "No name",
	"small": "Liten",
	"medium": "Medium",
	"large": "Stor",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Størrelse",
	"numberOfColumn": "Number of columns",
	"height": "Høyde",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "A reload is required for this to be reflected.",
	"preview": "Preview"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"auto": "Automatycznie",
	"noName": "No name",
	"small": "Małe",
	"medium": "Średnie",
	"large": "Duże",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Wyświetlanie selektora Emoji",
	"size": "Rozmiar",
	"numberOfColumn": "Liczba kolumn",
	"height": "Wysokość",
	"popup": "Wyskakujące okienka",
	"drawer": "Schowek",
	"style": "Styl",
	"needReloadToApply": "To ustawienie zostanie zastosowane po odświeżeniu strony",
	"preview": "Podgląd"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"auto": "Automático",
	"noName": "Sem nome",
	"small": "Pequeno",
	"medium": "Médio",
	"large": "Grande",
	"emojiPalette": "Paleta de emojis",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Paleta",
	"enableSyncBetweenDevicesForPalettes": "Sincronizar paleta entre dispositivos",
	"paletteForMain": "Paleta principal",
	"paletteForReaction": "Paleta de reações",
	"emojiPickerDisplay": "Janela de seleção de emoji",
	"size": "Tamanho",
	"numberOfColumn": "Número da coluna",
	"height": "Altura",
	"popup": "Pop-up",
	"drawer": "Gaveta",
	"style": "Estilo",
	"needReloadToApply": "É necessário recarregar a página para refletir as alterações.",
	"preview": "Pré-visualizar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"auto": "Автоматически",
	"noName": "Имя не указано",
	"small": "Мелко",
	"medium": "Средне",
	"large": "Крупно",
	"emojiPalette": "Палитра эмодзи",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Палитры",
	"enableSyncBetweenDevicesForPalettes": "Включить синхронизацию палитр эмодзи между устройствами",
	"paletteForMain": "Основная палитра",
	"paletteForReaction": "Палитра реакций",
	"emojiPickerDisplay": "Внешний вид палитры",
	"size": "Размер",
	"numberOfColumn": "Количество столбцов",
	"height": "Высота",
	"popup": "Всплывающие окна",
	"drawer": "Панель",
	"style": "Стиль",
	"needReloadToApply": "Изменения вступят в силу после перезагрузки страницы.",
	"preview": "Предпросмотр"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"auto": "Automaticky",
	"noName": "No name",
	"small": "Malé",
	"medium": "Stredné",
	"large": "Veľké",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Veľkosť",
	"numberOfColumn": "Počet stĺpcov",
	"height": "Výška",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "Toto nastavenie sa prejaví až po obnovení stránky.",
	"preview": "Náhľad"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"auto": "อัตโนมัติ",
	"noName": "ไม่มีชื่อ",
	"small": "เล็ก",
	"medium": "ปานกลาง",
	"large": "ใหญ่",
	"emojiPalette": "จานสีเอโมจิ",
	"emojiPaletteBanner": "สามารถบันทึกพรีเซ็ตเป็นจานสีเพื่อตรึงไว้ในตัวจิ้มเอโมจิ หรือปรับแต่งวิธีการแสดงผลของตัวจิ้มเอโมจิได้",
	"palettes": "จานสี",
	"enableSyncBetweenDevicesForPalettes": "เปิดใช้งานการซิงค์จานสีระหว่างอุปกรณ์",
	"paletteForMain": "จานสีหลักที่ใช้",
	"paletteForReaction": "จานสีที่ใช้ในการรีแอคชั่น",
	"emojiPickerDisplay": "แสดงตัวจิ้มเอโมจิ",
	"size": "ขนาด",
	"numberOfColumn": "จำนวนคอลัมน์",
	"height": "ความสูง",
	"popup": "ป๊อปอัพ",
	"drawer": "ตัววาด",
	"style": "สไตล์",
	"needReloadToApply": "ต้องรีโหลดเพื่อให้การเปลี่ยนแปลงมีผล",
	"preview": "แสดงตัวอย่าง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"auto": "Otomatik",
	"noName": "İsim yok",
	"small": "Küçük",
	"medium": "Orta",
	"large": "Büyük",
	"emojiPalette": "Emoji paleti",
	"emojiPaletteBanner": "Emoji seçiciye kalıcı olarak bir palet olarak görüntülenecek ön ayarları kaydedebilir veya seçicinin nasıl görüntüleneceğini özelleştirebilirsiniz.",
	"palettes": "Palet",
	"enableSyncBetweenDevicesForPalettes": "Cihazlar arasında palet senkronizasyonunu etkinleştir",
	"paletteForMain": "Ana palet",
	"paletteForReaction": "Reaksiyon paleti",
	"emojiPickerDisplay": "Emoji seçici ekranı",
	"size": "Boyut",
	"numberOfColumn": "Sütun sayısı",
	"height": "Yükseklik",
	"popup": "Pop-up",
	"drawer": "Çekmece",
	"style": "Stil",
	"needReloadToApply": "Bunun yansıtılması için yeniden yükleme yapılması gerekir.",
	"preview": "Önizleme"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"auto": "Auto",
	"noName": "No name",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Emoji picker display",
	"size": "Size",
	"numberOfColumn": "Number of columns",
	"height": "Height",
	"popup": "Pop up",
	"drawer": "Drawer",
	"style": "Style",
	"needReloadToApply": "A reload is required for this to be reflected.",
	"preview": "Preview"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"auto": "Автоматично",
	"noName": "Ім'я не вказано",
	"small": "Маленький",
	"medium": "Середній",
	"large": "Крупний",
	"emojiPalette": "Палітра емодзі",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Палітра",
	"enableSyncBetweenDevicesForPalettes": "Увімкнути синхронізацію палітр між пристроями",
	"paletteForMain": "Головна палітра",
	"paletteForReaction": "Палітра реакцій",
	"emojiPickerDisplay": "Зображення вибору емодзі",
	"size": "Розмір",
	"numberOfColumn": "Кількість стовпців",
	"height": "Висота",
	"popup": "Спливаючі вікна",
	"drawer": "Панель",
	"style": "Стиль",
	"needReloadToApply": "Зміни набудуть чинності після перезавантаження сторінки.",
	"preview": "Попередній перегляд"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"auto": "Tự động",
	"noName": "No name",
	"small": "Nhỏ",
	"medium": "Vừa",
	"large": "Lớn",
	"emojiPalette": "Emoji palette",
	"emojiPaletteBanner": "You can register presets as palettes to display prominently in the emoji picker or customize the appearance of the picker.",
	"palettes": "Palette",
	"enableSyncBetweenDevicesForPalettes": "Enable palette sync between devices",
	"paletteForMain": "Main palette",
	"paletteForReaction": "Reaction palette",
	"emojiPickerDisplay": "Hiển thị bộ chọn",
	"size": "Kích thước",
	"numberOfColumn": "Số lượng cột",
	"height": "Chiều cao",
	"popup": "Cửa sổ bật lên",
	"drawer": "Ngăn ứng dụng",
	"style": "Phong cách",
	"needReloadToApply": "Cần tải lại để điều này được áp dụng.",
	"preview": "Xem trước"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"auto": "自动",
	"noName": "未命名",
	"small": "小",
	"medium": "中",
	"large": "大",
	"emojiPalette": "表情符号选择器",
	"emojiPaletteBanner": "可以将固定显示在表情符号选择器中的预设注册为调色板，也可以自定义表情符号选择器的显示方式。",
	"palettes": "表情符号托盘",
	"enableSyncBetweenDevicesForPalettes": "在设备间同步表情符号托盘",
	"paletteForMain": "主表情符号托盘",
	"paletteForReaction": "回应时的表情符号托盘",
	"emojiPickerDisplay": "选择器显示设置",
	"size": "大小",
	"numberOfColumn": "列数",
	"height": "高度",
	"popup": "弹窗",
	"drawer": "抽屉",
	"style": "样式",
	"needReloadToApply": "重新载入后应用才会生效。",
	"preview": "预览"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"auto": "自動",
	"noName": "沒有名稱",
	"small": "小",
	"medium": "中",
	"large": "大",
	"emojiPalette": "表情符號調色盤",
	"emojiPaletteBanner": "可以將固定顯示在表情符號選擇器的預設項目註冊為調色盤，或者自訂選擇器的顯示方式。",
	"palettes": "調色盤",
	"enableSyncBetweenDevicesForPalettes": "啟用裝置與裝置之間的調色盤同步化",
	"paletteForMain": "主要使用的調色盤",
	"paletteForReaction": "反應用的調色盤",
	"emojiPickerDisplay": "顯示表情符號選擇器",
	"size": "大小",
	"numberOfColumn": "列數",
	"height": "高度",
	"popup": "彈出式視窗",
	"drawer": "側邊欄",
	"style": "風格",
	"needReloadToApply": "必須重新載入才會生效。",
	"preview": "預覽"
}
</locale>
