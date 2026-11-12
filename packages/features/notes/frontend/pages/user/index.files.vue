<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer>
	<template #icon><i class="ti ti-photo"></i></template>
	<template #header>{{ $locale.sfc.files }}</template>
	<div :class="$style.root">
		<MkLoading v-if="fetching"/>
		<div v-if="!fetching && notes.length > 0" class="_gaps_s">
			<div :class="$style.stream">
				<MkNoteMediaGrid v-for="note in notes" :note="note"/>
			</div>
			<MkButton rounded full @click="emit('showMore')">{{ globalLocale.env.showMore }} <i class="ti ti-arrow-right"></i></MkButton>
		</div>
		<p v-if="!fetching && notes.length == 0">{{ $locale.sfc.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkNoteMediaGrid from '@features/notes/frontend/components/MkNoteMediaGrid.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const emit = defineEmits<{
	(ev: 'showMore'): void;
}>();

const fetching = ref(true);
const notes = ref<Misskey.entities.Note[]>([]);

onMounted(() => {
	misskeyApi('users/notes', {
		userId: props.user.id,
		withFiles: true,
		limit: 10,
	}).then(_notes => {
		notes.value = _notes;
		fetching.value = false;
	});
});
</script>

<style lang="scss" module>
.root {
	padding: 8px;
}

.stream {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	grid-gap: 6px;

	>:nth-child(n+9) {
		display: none;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "files": "الملفات",
  "nothing": "لا يوجد شيء هنا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "files": "Fitxers",
  "nothing": "No hi ha res per veure aquí "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "files": "Soubor(ů)",
  "nothing": "Nic nebylo nalezeno"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "files": "Files",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "files": "Dateien",
  "nothing": "Hier gibt es nichts zu sehen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "files": "Files",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "files": "Archivos",
  "nothing": "No hay nada que ver aqui"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "files": "Fichiers",
  "nothing": "Il n'y a rien à voir ici"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "files": "Berkas",
  "nothing": "Tidak ada sama sekali disini"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "files": "Allegati",
  "nothing": "Niente da visualizzare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "files": "ファイル",
  "nothing": "ありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "files": "ファイル",
  "nothing": "あらへん"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "files": "Ifuyla",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "files": "ಕಡತಗಳು",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "files": "파일",
  "nothing": "아무것도 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "files": "Bestanden",
  "nothing": "Niets te zien hier"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "files": "Filer",
  "nothing": "Ingenting"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "files": "Pliki",
  "nothing": "Nie ma tu niczego"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "files": "Arquivos",
  "nothing": "Não há nada aqui"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "files": "Файлы",
  "nothing": "Ничего нет"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "files": "Súbor/y",
  "nothing": "Nič tu nie je"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "files": "ไฟล์",
  "nothing": "ไม่พบผลลัพธ์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "files": "Dosyalar",
  "nothing": "Burada görülecek bir şey yok."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "files": "Files",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "files": "Файли",
  "nothing": "Тут нічого немає"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "files": "Tập tin",
  "nothing": "Không có gì ở đây"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "files": "文件",
  "nothing": "无"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "files": "檔案",
  "nothing": "查無項目"
}
</locale>
