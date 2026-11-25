<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkButton rounded full small @click="toggle"><b>{{ modelValue ? $locale.sfc.hide : $locale.sfc.show }}</b><span v-if="!modelValue" :class="$style.label">{{ label }}</span></MkButton>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { concat } from '@features/runtime/frontend/utility/array.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	modelValue: boolean;
	text: string | null;
	renote?: Misskey.entities.Note | null;
	files?: Misskey.entities.DriveFile[];
	poll?: Misskey.entities.Note['poll'] | PollEditorModelValue | null;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: boolean): void;
}>();

const label = computed(() => {
	return concat([
		props.text ? [interpolateLocaleParameters($locale.value.sfc.chars, { count: props.text.length })] : [],
		props.renote ? [globalLocale.value.env.quote] : [],
		props.files && props.files.length !== 0 ? [interpolateLocaleParameters($locale.value.sfc.files, { count: props.files.length })] : [],
		props.poll != null ? [globalLocale.value.env.poll] : [],
	] as string[][]).join(' / ');
});

function toggle() {
	emit('update:modelValue', !props.modelValue);
}
</script>

<style lang="scss" module>
.label {
	margin-left: 4px;

	&::before {
		content: '(';
	}

	&::after {
		content: ')';
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"chars": "{count} أحرف",
	"files": "{count} ملفات",
	"hide": "إخفاء",
	"show": "عرض المزيد"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"chars": "{count} caràcters ",
	"files": "{count} fitxer(s)",
	"hide": "Amagar",
	"show": "Carregar més"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"chars": "{count} charakterů",
	"files": "{count} souborů",
	"hide": "Skrýt",
	"show": "Zobrazit více"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Hide",
	"show": "Show content"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"chars": "{count} Zeichen",
	"files": "{count} Datei(en)",
	"hide": "Inhalt verbergen",
	"show": "Inhalt anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Hide",
	"show": "Show content"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"chars": "{count} caracteres",
	"files": "{count} archivos",
	"hide": "Ocultar",
	"show": "Ver más"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"chars": "{count} caractères",
	"files": "{count} fichiers",
	"hide": "Masquer",
	"show": "Afficher le contenu"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"chars": "{count} karakter",
	"files": "{count} berkas",
	"hide": "Sembunyikan",
	"show": "Lihat konten"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"chars": "{count} caratteri",
	"files": "{count} file",
	"hide": "Nascondere",
	"show": "Continua la lettura..."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"chars": "{count}文字",
	"files": "{count}ファイル",
	"hide": "隠す",
	"show": "もっと見る"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"chars": "{count}文字",
	"files": "{count}ファイル",
	"hide": "隠す",
	"show": "続き見して！"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Hide",
	"show": "Wali ugar"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Hide",
	"show": "ಇನ್ನಷ್ಟು ನೋಡು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"chars": "{count} 문자",
	"files": "{count} 파일",
	"hide": "숨기기",
	"show": "더 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Hide",
	"show": "Laad meer"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Skjul",
	"show": "Vis mer"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"chars": "{count} znaków",
	"files": "{count} plików",
	"hide": "Ukryj",
	"show": "Załaduj więcej"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"chars": "{count} caracteres",
	"files": "{count} arquivo(s)",
	"hide": "Esconder",
	"show": "Carregar mais"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"chars": "знаков: {count}",
	"files": "файлов: {count}",
	"hide": "Спрятать",
	"show": "Показать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"chars": "{count} znakov",
	"files": "{count} súbor/ov",
	"hide": "Skryť",
	"show": "Zobraziť viac"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"chars": "{count} ตัวอักษร",
	"files": "{count} ไฟล์",
	"hide": "ซ่อน",
	"show": "ดูเพิ่มเติม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"chars": "{count} karakter",
	"files": "{count} dosya(lar)",
	"hide": "Gizle",
	"show": "İçeriği göster"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"chars": "{count} characters",
	"files": "{count} file(s)",
	"hide": "Hide",
	"show": "Show content"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"chars": "{count} символів",
	"files": "{count} файлів",
	"hide": "Сховати",
	"show": "Показати більше"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"chars": "{count} ký tự",
	"files": "{count} tập tin",
	"hide": "Ẩn",
	"show": "Tải thêm"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"chars": "{count} 个字符",
	"files": "{count} 个文件",
	"hide": "隐藏",
	"show": "查看更多"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"chars": "{count} 個字元",
	"files": "{count} 個檔案",
	"hide": "隱藏",
	"show": "顯示內容"
}
</locale>
