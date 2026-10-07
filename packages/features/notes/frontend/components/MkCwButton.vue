<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkButton rounded full small @click="toggle"><b>{{ modelValue ? $locale.sfc.hide : $locale.sfc.show }}</b><span v-if="!modelValue" :class="$style.label">{{ label }}</span></MkButton>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { PollEditorModelValue } from '@features/notes/frontend/components/MkPollEditor.vue';
import { concat } from '@features/runtime/frontend/utility/array.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

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
		props.renote ? [$locale.value.sfc.quote] : [],
		props.files && props.files.length !== 0 ? [interpolateLocaleParameters($locale.value.sfc.files, { count: props.files.length })] : [],
		props.poll != null ? [$locale.value.sfc.poll] : [],
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
	"quote": "اقتبس",
	"files": "{count} ملفات",
	"poll": "استطلاع رأي",
	"hide": "إخفاء",
	"show": "عرض المزيد"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"chars": "{count} caràcters ",
	"quote": "Cita",
	"files": "{count} fitxer(s)",
	"poll": "Enquesta",
	"hide": "Amagar",
	"show": "Carregar més"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"chars": "{count} charakterů",
	"quote": "Citovat",
	"files": "{count} souborů",
	"poll": "Anketa",
	"hide": "Skrýt",
	"show": "Zobrazit více"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"chars": "{count} characters",
	"quote": "Quote",
	"files": "{count} file(s)",
	"poll": "Poll",
	"hide": "Hide",
	"show": "Show content"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"chars": "{count} Zeichen",
	"quote": "Zitieren",
	"files": "{count} Datei(en)",
	"poll": "Umfrage",
	"hide": "Inhalt verbergen",
	"show": "Inhalt anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"chars": "{count} characters",
	"quote": "Quote",
	"files": "{count} file(s)",
	"poll": "Poll",
	"hide": "Hide",
	"show": "Show content"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"chars": "{count} caracteres",
	"quote": "Citar",
	"files": "{count} archivos",
	"poll": "Encuesta",
	"hide": "Ocultar",
	"show": "Ver más"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"chars": "{count} caractères",
	"quote": "Citer",
	"files": "{count} fichiers",
	"poll": "Sondage",
	"hide": "Masquer",
	"show": "Afficher le contenu"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"chars": "{count} karakter",
	"quote": "Kutip",
	"files": "{count} berkas",
	"poll": "Angket",
	"hide": "Sembunyikan",
	"show": "Lihat konten"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"chars": "{count} caratteri",
	"quote": "Citazione",
	"files": "{count} file",
	"poll": "Sondaggio",
	"hide": "Nascondere",
	"show": "Continua la lettura..."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"chars": "{count}文字",
	"quote": "引用",
	"files": "{count}ファイル",
	"poll": "アンケート",
	"hide": "隠す",
	"show": "もっと見る"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"chars": "{count}文字",
	"quote": "引用",
	"files": "{count}ファイル",
	"poll": "アンケート",
	"hide": "隠す",
	"show": "続き見して！"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"chars": "{count} characters",
	"quote": "Quote",
	"files": "{count} file(s)",
	"poll": "Poll",
	"hide": "Hide",
	"show": "Wali ugar"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"chars": "{count} characters",
	"quote": "Quote",
	"files": "{count} file(s)",
	"poll": "Poll",
	"hide": "Hide",
	"show": "ಇನ್ನಷ್ಟು ನೋಡು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"chars": "{count} 문자",
	"quote": "인용",
	"files": "{count} 파일",
	"poll": "투표",
	"hide": "숨기기",
	"show": "더 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"chars": "{count} characters",
	"quote": "Quote",
	"files": "{count} file(s)",
	"poll": "Peiling",
	"hide": "Hide",
	"show": "Laad meer"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"chars": "{count} characters",
	"quote": "Sitat",
	"files": "{count} file(s)",
	"poll": "Avstemning",
	"hide": "Skjul",
	"show": "Vis mer"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"chars": "{count} znaków",
	"quote": "Cytuj",
	"files": "{count} plików",
	"poll": "Ankieta",
	"hide": "Ukryj",
	"show": "Załaduj więcej"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"chars": "{count} caracteres",
	"quote": "Citar",
	"files": "{count} arquivo(s)",
	"poll": "Enquetes",
	"hide": "Esconder",
	"show": "Carregar mais"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"chars": "знаков: {count}",
	"quote": "Цитата",
	"files": "файлов: {count}",
	"poll": "Опрос",
	"hide": "Спрятать",
	"show": "Показать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"chars": "{count} znakov",
	"quote": "Citovať",
	"files": "{count} súbor/ov",
	"poll": "Hlasovanie",
	"hide": "Skryť",
	"show": "Zobraziť viac"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"chars": "{count} ตัวอักษร",
	"quote": "อ้างอิง",
	"files": "{count} ไฟล์",
	"poll": "โพล",
	"hide": "ซ่อน",
	"show": "ดูเพิ่มเติม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"chars": "{count} karakter",
	"quote": "Alıntı",
	"files": "{count} dosya(lar)",
	"poll": "Anket",
	"hide": "Gizle",
	"show": "İçeriği göster"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"chars": "{count} characters",
	"quote": "Quote",
	"files": "{count} file(s)",
	"poll": "Poll",
	"hide": "Hide",
	"show": "Show content"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"chars": "{count} символів",
	"quote": "Цитата",
	"files": "{count} файлів",
	"poll": "Опитування",
	"hide": "Сховати",
	"show": "Показати більше"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"chars": "{count} ký tự",
	"quote": "Trích dẫn",
	"files": "{count} tập tin",
	"poll": "Bình chọn",
	"hide": "Ẩn",
	"show": "Tải thêm"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"chars": "{count} 个字符",
	"quote": "引用",
	"files": "{count} 个文件",
	"poll": "投票",
	"hide": "隐藏",
	"show": "查看更多"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"chars": "{count} 個字元",
	"quote": "引用",
	"files": "{count} 個檔案",
	"poll": "票選活動",
	"hide": "隱藏",
	"show": "顯示內容"
}
</locale>
