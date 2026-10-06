<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ $locale.sfc.thisPageCanBeSeenFromTheAuthor }}</MkInfo>

	<MkPagination :paginator="paginator">
		<template #default="{ items }">
			<XMessage v-for="item in items" :key="item.id" :message="item" :isSearchResult="true"/>
		</template>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';

const props = defineProps<{
	fileId: string;
}>();

const realFileId = computed(() => props.fileId);

const paginator = markRaw(new Paginator('drive/files/attached-chat-messages', {
	limit: 10,
	params: {
		fileId: realFileId.value,
	},
}));
</script>

<locale locale="ar-SA" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Aquesta pàgina només la pot veure l'usuari que ha pujat aquest fitxer."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="da-DK" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="de-DE" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Nur der Benutzer, der diese Datei hochgeladen hat, kann diese Seite sehen."
}
</locale>

<locale locale="en-US" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="es-ES" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Esta página solo puede ser vista por el autor."
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Cette page ne peut être vue que par l'utilisateur qui a téléversé ce fichier."
}
</locale>

<locale locale="id-ID" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Halaman ini hanya dapat dilihat oleh pengguna yang mengunggah bekas ini."
}
</locale>

<locale locale="it-IT" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Questa pagina può essere vista solo da chi ha caricato il file."
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "このページは、このファイルをアップロードしたユーザーしか閲覧できません。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "このページはこのファイルをアップした人しか見れへんねん。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "이 페이지는 파일 소유자만 열람할 수 있습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Essa página só pode ser vista pelo usuário que enviou esse arquivo."
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="th-TH" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "เฉพาะผู้ใช้ที่อัปโหลดไฟล์นี้เท่านั้นที่สามารถดูหน้าเพจนี้ได้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "Bu sayfa, bu dosyayı yükleyen kullanıcı tarafından görülebilir."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "This page can only be seen by the user who uploaded this file."
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "此页只能被该文件的上传者查看。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "thisPageCanBeSeenFromTheAuthor": "本頁面僅限上傳了這個檔案的使用者可以檢視。"
}
</locale>
