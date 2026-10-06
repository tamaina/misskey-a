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
			<MkButton rounded full @click="emit('showMore')">{{ $locale.sfc.showMore }} <i class="ti ti-arrow-right"></i></MkButton>
		</div>
		<p v-if="!fetching && notes.length == 0">{{ $locale.sfc.nothing }}</p>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkNoteMediaGrid from '@features/notes/frontend/components/MkNoteMediaGrid.vue';

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
  "showMore": "عرض المزيد",
  "nothing": "لا يوجد شيء هنا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "files": "Fitxers",
  "showMore": "Veure més",
  "nothing": "No hi ha res per veure aquí "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "files": "Soubor(ů)",
  "showMore": "Zobrazit více",
  "nothing": "Nic nebylo nalezeno"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "files": "Files",
  "showMore": "Show more",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "files": "Dateien",
  "showMore": "Mehr anzeigen",
  "nothing": "Hier gibt es nichts zu sehen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "files": "Files",
  "showMore": "Show more",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "files": "Archivos",
  "showMore": "Ver más",
  "nothing": "No hay nada que ver aqui"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "files": "Fichiers",
  "showMore": "Voir plus",
  "nothing": "Il n'y a rien à voir ici"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "files": "Berkas",
  "showMore": "Selebihnya",
  "nothing": "Tidak ada sama sekali disini"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "files": "Allegati",
  "showMore": "Espandi",
  "nothing": "Niente da visualizzare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "files": "ファイル",
  "showMore": "もっと見る",
  "nothing": "ありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "files": "ファイル",
  "showMore": "まだまだあるで！",
  "nothing": "あらへん"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "files": "Ifuyla",
  "showMore": "Wali ugar",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "files": "ಕಡತಗಳು",
  "showMore": "ಇನ್ನಷ್ಟು ನೋಡು",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "files": "파일",
  "showMore": "더 보기",
  "nothing": "아무것도 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "files": "Bestanden",
  "showMore": "Toon meer",
  "nothing": "Niets te zien hier"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "files": "Filer",
  "showMore": "Vis mer",
  "nothing": "Ingenting"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "files": "Pliki",
  "showMore": "Załaduj więcej",
  "nothing": "Nie ma tu niczego"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "files": "Arquivos",
  "showMore": "Ver mais",
  "nothing": "Não há nada aqui"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "files": "Файлы",
  "showMore": "Показать ещё",
  "nothing": "Ничего нет"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "files": "Súbor/y",
  "showMore": "Zobraziť viac",
  "nothing": "Nič tu nie je"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "files": "ไฟล์",
  "showMore": "แสดงเพิ่มเติม",
  "nothing": "ไม่พบผลลัพธ์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "files": "Dosyalar",
  "showMore": "Daha fazlasını göster",
  "nothing": "Burada görülecek bir şey yok."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "files": "Files",
  "showMore": "Show more",
  "nothing": "There's nothing to see here"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "files": "Файли",
  "showMore": "Показати більше",
  "nothing": "Тут нічого немає"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "files": "Tập tin",
  "showMore": "Xem thêm",
  "nothing": "Không có gì ở đây"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "files": "文件",
  "showMore": "查看更多",
  "nothing": "无"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "files": "檔案",
  "showMore": "載入更多",
  "nothing": "查無項目"
}
</locale>
