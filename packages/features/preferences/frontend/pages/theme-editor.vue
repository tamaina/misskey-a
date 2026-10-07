<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="cwepdizn _gaps_m">
			<MkFolder :defaultOpen="true">
				<template #label>{{ $locale.sfc.backgroundColor }}</template>
				<div class="cwepdizn-colors">
					<div class="row">
						<button v-for="color in bgColors.filter(x => x.kind === 'light')" class="color _button" :class="{ active: theme.props.bg === color.color }" @click="setBgColor(color)">
							<div class="preview" :style="{ background: color.forPreview }"></div>
						</button>
					</div>
					<div class="row">
						<button v-for="color in bgColors.filter(x => x.kind === 'dark')" class="color _button" :class="{ active: theme.props.bg === color.color }" @click="setBgColor(color)">
							<div class="preview" :style="{ background: color.forPreview }"></div>
						</button>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>{{ $locale.sfc.accentColor }}</template>
				<div class="cwepdizn-colors">
					<div class="row">
						<button v-for="color in accentColors" class="color rounded _button" :class="{ active: theme.props.accent === color }" @click="setAccentColor(color)">
							<div class="preview" :style="{ background: color }"></div>
						</button>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>{{ $locale.sfc.textColor }}</template>
				<div class="cwepdizn-colors">
					<div class="row">
						<button v-for="color in fgColors" class="color char _button" :class="{ active: (theme.props.fg === color.forLight) || (theme.props.fg === color.forDark) }" @click="setFgColor(color)">
							<div class="preview" :style="{ color: color.forPreview ? color.forPreview : theme.base === 'light' ? '#5f5f5f' : '#dadada' }">A</div>
						</button>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="false">
				<template #icon><i class="ti ti-code"></i></template>
				<template #label>{{ $locale.sfc.editCode }}</template>

				<div class="_gaps_m">
					<MkCodeEditor v-model="themeCode" lang="json5">
						<template #label>{{ $locale.sfc.themeCode }}</template>
					</MkCodeEditor>
					<MkButton primary @click="applyThemeCode">{{ $locale.sfc.apply }}</MkButton>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="false">
				<template #label>{{ $locale.sfc.addDescription }}</template>

				<div class="_gaps_m">
					<MkTextarea v-model="description">
						<template #label>{{ $locale.sfc.themeDescription }}</template>
					</MkTextarea>
				</div>
			</MkFolder>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import { toUnicode } from 'punycode.js';
import tinycolor from 'tinycolor2';
import JSON5 from 'json5';
import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import { host } from '@@/js/config.js';
import type { Theme } from '@@/js/theme.js';
import { genId } from '@features/runtime/frontend/utility/id.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkCodeEditor from '@features/markup/frontend/components/MkCodeEditor.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { addTheme, themeManager } from '@features/preferences/frontend/theme.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import * as os from '@features/ui/frontend/os.js';
import { store } from '@features/preferences/frontend/store.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { useLeaveGuard } from '@features/navigation/frontend/composables/use-leave-guard.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const $i = ensureSignin();

const bgColors = [
	{ color: '#f5f5f5', kind: 'light', forPreview: '#f5f5f5' },
	{ color: '#f0eee9', kind: 'light', forPreview: '#f3e2b9' },
	{ color: '#e9eff0', kind: 'light', forPreview: '#bfe3e8' },
	{ color: '#f0e9ee', kind: 'light', forPreview: '#f1d1e8' },
	{ color: '#dce2e0', kind: 'light', forPreview: '#a4dccc' },
	{ color: '#e2e0dc', kind: 'light', forPreview: '#d8c7a5' },
	{ color: '#d5dbe0', kind: 'light', forPreview: '#b0cae0' },
	{ color: '#dad5d5', kind: 'light', forPreview: '#d6afaf' },
	{ color: '#2b2b2b', kind: 'dark', forPreview: '#444444' },
	{ color: '#362e29', kind: 'dark', forPreview: '#735c4d' },
	{ color: '#303629', kind: 'dark', forPreview: '#506d2f' },
	{ color: '#293436', kind: 'dark', forPreview: '#258192' },
	{ color: '#2e2936', kind: 'dark', forPreview: '#504069' },
	{ color: '#252722', kind: 'dark', forPreview: '#3c462f' },
	{ color: '#212525', kind: 'dark', forPreview: '#303e3e' },
	{ color: '#191919', kind: 'dark', forPreview: '#272727' },
] as const;
const accentColors = ['#e36749', '#f29924', '#98c934', '#34c9a9', '#34a1c9', '#606df7', '#8d34c9', '#e84d83'];
const fgColors = [
	{ color: 'none', forLight: '#5f5f5f', forDark: '#dadada', forPreview: null },
	{ color: 'red', forLight: '#7f6666', forDark: '#e4d1d1', forPreview: '#ca4343' },
	{ color: 'yellow', forLight: '#736955', forDark: '#e0d5c0', forPreview: '#d49923' },
	{ color: 'green', forLight: '#586d5b', forDark: '#d1e4d4', forPreview: '#4cbd5c' },
	{ color: 'cyan', forLight: '#5d7475', forDark: '#d1e3e4', forPreview: '#2abdc3' },
	{ color: 'blue', forLight: '#676880', forDark: '#d1d2e4', forPreview: '#7275d8' },
	{ color: 'pink', forLight: '#84667d', forDark: '#e4d1e0', forPreview: '#b12390' },
];

const theme = ref<Theme>({
	id: genId(),
	name: 'untitled',
	author: `@${$i.username}@${toUnicode(host)}`,
	base: 'light',
	props: deepClone(lightTheme.props),
});
const description = ref<string | null>(null);
const themeCode = ref<string>('');
const changed = ref(false);

useLeaveGuard(changed);

function showPreview() {
	os.pageWindow('/preview');
}

function setBgColor(color: typeof bgColors[number]) {
	if (theme.value.base !== color.kind) {
		const base = color.kind === 'dark' ? darkTheme : lightTheme;
		for (const prop of Object.keys(base.props)) {
			if (prop === 'accent') continue;
			if (prop === 'fg') continue;
			theme.value.props[prop] = base.props[prop];
		}
	}
	theme.value.base = color.kind;
	theme.value.props.bg = color.color;

	if (theme.value.props.fg) {
		const matchedFgColor = fgColors.find(x => [tinycolor(x.forLight).toRgbString(), tinycolor(x.forDark).toRgbString()].includes(tinycolor(theme.value.props.fg).toRgbString()));
		if (matchedFgColor) setFgColor(matchedFgColor);
	}
}

function setAccentColor(color: string) {
	theme.value.props.accent = color;
}

function setFgColor(color: typeof fgColors[number]) {
	theme.value.props.fg = theme.value.base === 'light' ? color.forLight : color.forDark;
}

function apply() {
	themeCode.value = JSON5.stringify(theme.value, null, '\t');
	themeManager.previewTheme(theme.value);
	changed.value = true;
}

function applyThemeCode() {
	let parsed;

	try {
		parsed = JSON5.parse(themeCode.value);
	} catch (err) {
		os.alert({
			type: 'error',
			text: $locale.value.sfc.themeInvalid,
		});
		return;
	}

	theme.value = parsed;
}

async function saveAs() {
	const { canceled, result: name } = await os.inputText({
		title: $locale.value.sfc.name,
		minLength: 1,
	});
	if (canceled) return;

	theme.value.id = genId();
	theme.value.name = name;
	if (description.value) theme.value.desc = description.value;
	await addTheme(theme.value);
	themeManager.updateTheme(theme.value);
	if (store.s.darkMode) {
		prefer.commit('darkTheme', theme.value);
	} else {
		prefer.commit('lightTheme', theme.value);
	}
	changed.value = false;
	os.alert({
		type: 'success',
		text: interpolateLocaleParameters($locale.value.sfc.themeInstalled, { name: theme.value.name }),
	});
}

watch(theme, apply, { deep: true });

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-eye',
	text: $locale.value.sfc.preview,
	handler: showPreview,
}, {
	asFullButton: true,
	icon: 'ti ti-check',
	text: $locale.value.sfc.saveAs,
	handler: saveAs,
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.themeEditor,
	icon: 'ti ti-palette',
}));
</script>

<style lang="scss" scoped>
.cwepdizn {
	::v-deep(.cwepdizn-colors) {
		text-align: center;

		> .row {
			> .color {
				display: inline-block;
				position: relative;
				width: 64px;
				height: 64px;
				border-radius: 8px;

				> .preview {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					margin: auto;
					width: 42px;
					height: 42px;
					border-radius: 4px;
					box-shadow: 0 2px 4px rgb(0 0 0 / 30%);
					transition: transform 0.15s ease;
				}

				&:hover {
					> .preview {
						transform: scale(1.1);
					}
				}

				&.active {
					box-shadow: 0 0 0 2px var(--MI_THEME-divider) inset;
				}

				&.rounded {
					border-radius: 999px;

					> .preview {
						border-radius: 999px;
					}
				}

				&.char {
					line-height: 42px;
				}
			}
		}
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"backgroundColor": "لون الخلفية",
	"accentColor": "طابع لوني",
	"textColor": "لون النص",
	"editCode": "حرر الشفرة",
	"themeCode": "شيفرة القالب",
	"apply": "تطبيق",
	"addDescription": "أضف وصفًا",
	"themeDescription": "الوصف",
	"themeInvalid": "تنسيق السمة غير صالح",
	"name": "الإسم",
	"themeInstalled": "تم تنصيب {name}",
	"preview": "معاينة",
	"saveAs": "احفظ كـ...",
	"themeEditor": "مصمم القوالب"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"backgroundColor": "Color de fons",
	"accentColor": "Color principal",
	"textColor": "Color del text",
	"editCode": "Editar el codi",
	"themeCode": "Codi del tema",
	"apply": "Aplicar",
	"addDescription": "Afegeix una descripció ",
	"themeDescription": "Descripció",
	"themeInvalid": "El format d'aquest tema no és correcte",
	"name": "Nom",
	"themeInstalled": "{name} Instal·lat ",
	"preview": "Vista prèvia",
	"saveAs": "Desar com...",
	"themeEditor": "Editor de temes"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"backgroundColor": "Pozadí",
	"accentColor": "Akcent",
	"textColor": "Barva textu",
	"editCode": "Upravit kód",
	"themeCode": "Kód vzhledu",
	"apply": "Potvrdit",
	"addDescription": "Přidat popis",
	"themeDescription": "Popis",
	"themeInvalid": "Formát tohoto tématu je neplatný",
	"name": "Jméno",
	"themeInstalled": "{name} byl nainstalován",
	"preview": "Náhled",
	"saveAs": "Uložit jako…",
	"themeEditor": "Editor témat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"backgroundColor": "Background color",
	"accentColor": "Accent color",
	"textColor": "Text color",
	"editCode": "Edit code",
	"themeCode": "Theme code",
	"apply": "Apply",
	"addDescription": "Add description",
	"themeDescription": "Description",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Name",
	"themeInstalled": "{name} has been installed",
	"preview": "Preview",
	"saveAs": "Save as...",
	"themeEditor": "Theme editor"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"backgroundColor": "Hintergrundfarbe",
	"accentColor": "Akzentfarbe",
	"textColor": "Textfarbe",
	"editCode": "Code bearbeiten",
	"themeCode": "Farbschemencode",
	"apply": "Anwenden",
	"addDescription": "Beschreibung hinzufügen",
	"themeDescription": "Beschreibung",
	"themeInvalid": "Der Code dieses Farbschemas ist ungültig",
	"name": "Name",
	"themeInstalled": "{name} wurde installiert",
	"preview": "Vorschau",
	"saveAs": "Speichern als …",
	"themeEditor": "Farbschema-Editor"
}
</locale>

<locale lang="json" locale="en-US">
{
	"backgroundColor": "Background color",
	"accentColor": "Accent color",
	"textColor": "Text color",
	"editCode": "Edit code",
	"themeCode": "Theme code",
	"apply": "Apply",
	"addDescription": "Add description",
	"themeDescription": "Description",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Name",
	"themeInstalled": "{name} has been installed",
	"preview": "Preview",
	"saveAs": "Save as...",
	"themeEditor": "Theme editor"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"backgroundColor": "Fondo",
	"accentColor": "Acento",
	"textColor": "Texto",
	"editCode": "Editar código",
	"themeCode": "Código del tema",
	"apply": "Aplicar",
	"addDescription": "Agregar descripción",
	"themeDescription": "Descripción",
	"themeInvalid": "El formato del tema no es válido",
	"name": "Nombre",
	"themeInstalled": "{name} ha sido instalado",
	"preview": "Vista previa",
	"saveAs": "Guardar como…",
	"themeEditor": "Editor de temas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"backgroundColor": "Arrière-plan",
	"accentColor": "Accentuation",
	"textColor": "Texte",
	"editCode": "Modifier le code",
	"themeCode": "Code du thème",
	"apply": "Appliquer",
	"addDescription": "Ajouter une description",
	"themeDescription": "Description",
	"themeInvalid": "Le format du thème n'est pas valide",
	"name": "Nom",
	"themeInstalled": "{name} a été installé",
	"preview": "Aperçu",
	"saveAs": "Enregistrer sous ...",
	"themeEditor": "Éditeur de thèmes"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"backgroundColor": "Latar Belakang",
	"accentColor": "Aksen",
	"textColor": "Teks",
	"editCode": "Sunting kode",
	"themeCode": "Kode tema",
	"apply": "Terapkan",
	"addDescription": "Tambahkan deskripsi",
	"themeDescription": "Deskripsi",
	"themeInvalid": "Format tema tidak valid",
	"name": "Nama",
	"themeInstalled": "{name} telah dipasang",
	"preview": "Pratinjau",
	"saveAs": "Simpan sebagai…",
	"themeEditor": "Penyunting tema"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"backgroundColor": "Sfondo",
	"accentColor": "Colore principale",
	"textColor": "Testo",
	"editCode": "Modifica codice",
	"themeCode": "Codice tema",
	"apply": "Applica",
	"addDescription": "Aggiungi descrizione",
	"themeDescription": "Descrizione",
	"themeInvalid": "Il formato tema non è valido",
	"name": "Nome",
	"themeInstalled": "{name} è installato",
	"preview": "Anteprima",
	"saveAs": "Salva con nome",
	"themeEditor": "Editor di temi"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"backgroundColor": "背景",
	"accentColor": "アクセント",
	"textColor": "文字",
	"editCode": "コードを編集",
	"themeCode": "テーマコード",
	"apply": "適用",
	"addDescription": "説明を追加",
	"themeDescription": "説明",
	"themeInvalid": "テーマの形式が間違っています",
	"name": "名前",
	"themeInstalled": "{name}をインストールしました",
	"preview": "プレビュー",
	"saveAs": "名前を付けて保存",
	"themeEditor": "テーマエディター"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"backgroundColor": "背景",
	"accentColor": "アクセント",
	"textColor": "文字",
	"editCode": "コードを編集",
	"themeCode": "テーマコード",
	"apply": "適用",
	"addDescription": "説明を入れるで",
	"themeDescription": "説明",
	"themeInvalid": "テーマの形式が間違ってるみたいや",
	"name": "名前",
	"themeInstalled": "{name}をインストールしたで。",
	"preview": "プレビュー",
	"saveAs": "名前を付けて保存",
	"themeEditor": "テーマエディター"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"backgroundColor": "Background color",
	"accentColor": "Accent color",
	"textColor": "Text color",
	"editCode": "Edit code",
	"themeCode": "Theme code",
	"apply": "Apply",
	"addDescription": "Add description",
	"themeDescription": "Description",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Name",
	"themeInstalled": "{name} has been installed",
	"preview": "Preview",
	"saveAs": "Save as...",
	"themeEditor": "Theme editor"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"backgroundColor": "Background color",
	"accentColor": "Accent color",
	"textColor": "Text color",
	"editCode": "Edit code",
	"themeCode": "Theme code",
	"apply": "Apply",
	"addDescription": "Add description",
	"themeDescription": "Description",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Name",
	"themeInstalled": "{name} has been installed",
	"preview": "Preview",
	"saveAs": "Save as...",
	"themeEditor": "Theme editor"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"backgroundColor": "배경 색",
	"accentColor": "강조 색상",
	"textColor": "문자 색",
	"editCode": "코드 수정",
	"themeCode": "테마 코드",
	"apply": "적용",
	"addDescription": "설명 추가",
	"themeDescription": "설명",
	"themeInvalid": "테마 형식이 올바르지 않습니다",
	"name": "이름",
	"themeInstalled": "{name} 테마가 설치되었습니다",
	"preview": "미리보기",
	"saveAs": "다른 이름으로 저장",
	"themeEditor": "테마 에디터"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"backgroundColor": "Achtergrondkleur",
	"accentColor": "Accentkleur",
	"textColor": "Tekstkleur",
	"editCode": "Code bewerken",
	"themeCode": "Theme code",
	"apply": "Toepassen",
	"addDescription": "Beschrijving toevoegen",
	"themeDescription": "Beschrijving",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Naam",
	"themeInstalled": "{name} has been installed",
	"preview": "Voorbeeld",
	"saveAs": "Opslaan als…",
	"themeEditor": "Thema-editor"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"backgroundColor": "Background color",
	"accentColor": "Accent color",
	"textColor": "Text color",
	"editCode": "Edit code",
	"themeCode": "Theme code",
	"apply": "Apply",
	"addDescription": "Legg til beskrivelse",
	"themeDescription": "Beskrivelse",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Navn",
	"themeInstalled": "{name} has been installed",
	"preview": "Preview",
	"saveAs": "Lagre som",
	"themeEditor": "Theme editor"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"backgroundColor": "Tło",
	"accentColor": "Akcent",
	"textColor": "Tekst",
	"editCode": "Edytuj kod",
	"themeCode": "Kod motywu",
	"apply": "Zastosuj",
	"addDescription": "Dodaj opis",
	"themeDescription": "Opis",
	"themeInvalid": "Format motywu jest nieprawidłowy.",
	"name": "Nazwa",
	"themeInstalled": "Zainstalowano {name}",
	"preview": "Podgląd",
	"saveAs": "Zapisz jako…",
	"themeEditor": "Edytor motywu"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"backgroundColor": "Cor de fundo",
	"accentColor": "Cor de destaque",
	"textColor": "Cor do texto",
	"editCode": "Editar código",
	"themeCode": "Código do tema",
	"apply": "Aplicar",
	"addDescription": "Adicionar descrição",
	"themeDescription": "Descrição",
	"themeInvalid": "O formato desse tema é invalido",
	"name": "Nome",
	"themeInstalled": "{name} foi instalado",
	"preview": "Pré-visualizar",
	"saveAs": "Salvar como",
	"themeEditor": "Editor de temas"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"backgroundColor": "Фон",
	"accentColor": "Акцент",
	"textColor": "Текст",
	"editCode": "Редактировать исходный текст",
	"themeCode": "Код темы",
	"apply": "Применить",
	"addDescription": "Добавить описание",
	"themeDescription": "Описание",
	"themeInvalid": "Формат темы некорректный.",
	"name": "Название",
	"themeInstalled": "Тема «{name}» установлена.",
	"preview": "Предпросмотр",
	"saveAs": "Сохранить под названием…",
	"themeEditor": "Редактор темы оформления"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"backgroundColor": "Pozadie",
	"accentColor": "Akcent",
	"textColor": "Text",
	"editCode": "Upraviť kód",
	"themeCode": "Kód témy",
	"apply": "Použiť",
	"addDescription": "Pridať popis",
	"themeDescription": "Popis",
	"themeInvalid": "Formát tejto témy je nesprávny",
	"name": "Názov",
	"themeInstalled": "{name} je nainštalovaná",
	"preview": "Náhľad",
	"saveAs": "Uložiť ako...",
	"themeEditor": "Editor tém"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"backgroundColor": "สีพื้นหลัง",
	"accentColor": "สีหลัก",
	"textColor": "สีข้อความ",
	"editCode": "แก้ไขโค้ด",
	"themeCode": "โค้ดธีม",
	"apply": "นำไปใช้",
	"addDescription": "เพิ่มคำอธิบาย",
	"themeDescription": "คำอธิบาย",
	"themeInvalid": "รูปแบบของธีมนี้ไม่ถูกต้องนะ",
	"name": "ชื่อ",
	"themeInstalled": "{name} ได้รับการติดตั้ง",
	"preview": "แสดงตัวอย่าง",
	"saveAs": "บันทึกเป็น...",
	"themeEditor": "ตัวแก้ไขธีม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"backgroundColor": "Arka plan rengi",
	"accentColor": "Vurgu rengi",
	"textColor": "Metin rengi",
	"editCode": "Kodu düzenle",
	"themeCode": "Tema kodu",
	"apply": "Uygula",
	"addDescription": "Açıklama ekle",
	"themeDescription": "Açıklama",
	"themeInvalid": "Bu temanın biçimi geçersizdir.",
	"name": "İsim",
	"themeInstalled": "{name} kuruldu",
	"preview": "Önizleme",
	"saveAs": "Farklı kaydet",
	"themeEditor": "Tema düzenleyici"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"backgroundColor": "Background color",
	"accentColor": "Accent color",
	"textColor": "Text color",
	"editCode": "Edit code",
	"themeCode": "Theme code",
	"apply": "Apply",
	"addDescription": "Add description",
	"themeDescription": "Description",
	"themeInvalid": "The format of this theme is invalid",
	"name": "Name",
	"themeInstalled": "{name} has been installed",
	"preview": "Preview",
	"saveAs": "Save as...",
	"themeEditor": "Theme editor"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"backgroundColor": "Фон",
	"accentColor": "Акцент",
	"textColor": "Текст",
	"editCode": "Редагувати вихідний текст",
	"themeCode": "Код теми",
	"apply": "Застосувати",
	"addDescription": "Додатковий опис.",
	"themeDescription": "Опис",
	"themeInvalid": "Неправильний формат теми",
	"name": "Ім'я",
	"themeInstalled": "Тему {name} встановлено",
	"preview": "Попередній перегляд",
	"saveAs": "Зберегти як…",
	"themeEditor": "Редактор тем"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"backgroundColor": "Màu nền",
	"accentColor": "Màu phụ",
	"textColor": "Màu chữ",
	"editCode": "Chỉnh sửa mã",
	"themeCode": "Mã theme",
	"apply": "Áp dụng",
	"addDescription": "Thêm mô tả",
	"themeDescription": "Mô tả",
	"themeInvalid": "Định dạng của theme này không hợp lệ",
	"name": "Tên",
	"themeInstalled": "{name} đã được cài đặt",
	"preview": "Xem trước",
	"saveAs": "Lưu thành",
	"themeEditor": "Công cụ thiết kế theme"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"backgroundColor": "背景",
	"accentColor": "强调色",
	"textColor": "文本",
	"editCode": "编辑代码",
	"themeCode": "主题代码",
	"apply": "应用",
	"addDescription": "添加描述",
	"themeDescription": "描述",
	"themeInvalid": "主题格式错误",
	"name": "名称",
	"themeInstalled": "{name} 已安装",
	"preview": "预览",
	"saveAs": "另存为",
	"themeEditor": "主题编辑器"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"backgroundColor": "背景",
	"accentColor": "重點色彩",
	"textColor": "文字",
	"editCode": "編輯程式碼",
	"themeCode": "佈景主題代碼",
	"apply": "套用",
	"addDescription": "新增描述",
	"themeDescription": "描述",
	"themeInvalid": "佈景主題格式錯誤",
	"name": "名稱",
	"themeInstalled": "{name}已安裝",
	"preview": "預覽",
	"saveAs": "另存新檔",
	"themeEditor": "佈景主題編輯器"
}
</locale>
