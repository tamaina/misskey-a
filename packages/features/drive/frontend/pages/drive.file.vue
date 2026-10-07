<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>

	<MkSwiper v-model:tab="tab" :tabs="headerTabs">
		<div v-if="tab === 'info'" class="_spacer" style="--MI_SPACER-w: 800px;">
			<XFileInfo :fileId="fileId"/>
		</div>

		<div v-else-if="tab === 'notes'" class="_spacer" style="--MI_SPACER-w: 800px;">
			<XNotes :fileId="fileId"/>
		</div>
	</MkSwiper>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, defineAsyncComponent } from 'vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkSwiper from '@features/ui/frontend/components/MkSwiper.vue';

const props = defineProps<{
	fileId: string;
}>();

const XFileInfo = defineAsyncComponent(() => import('@features/drive/frontend/pages/drive.file.info.vue'));
const XNotes = defineAsyncComponent(() => import('@features/drive/frontend/pages/drive.file.notes.vue'));

const tab = ref('info');

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'info',
	title: $locale.value.sfc.info,
	icon: 'ti ti-info-circle',
}, {
	key: 'notes',
	title: $locale.value.sfc.attachedNotes,
	icon: 'ti ti-pencil',
}]);

definePage(() => ({
	title: $locale.value.sfc.title,
	icon: 'ti ti-file',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"info": "عن",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"info": "Informació",
	"attachedNotes": "Notes amb aquest fitxer",
	"title": "Detall del fitxer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"info": "Informace",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"info": "About",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"info": "Über",
	"attachedNotes": "Zugehörige Notizen",
	"title": "Dateiinformationen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"info": "About",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"info": "Información",
	"attachedNotes": "Notas adjuntas",
	"title": "Detalles del archivo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"info": "Informations",
	"attachedNotes": "Notes avec ce fichier",
	"title": "Détails du fichier"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"info": "Informasi",
	"attachedNotes": "Catatan yang dilampirkan",
	"title": "Rincian berkas"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"info": "Informazioni",
	"attachedNotes": "Note a cui è allegato",
	"title": "Dettagli del file"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"info": "情報",
	"attachedNotes": "添付されているノート",
	"title": "ファイルの詳細"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"info": "情報",
	"attachedNotes": "ファイルがついてきてるノート",
	"title": "ファイルの詳しい情報"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"info": "About",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"info": "About",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"info": "정보",
	"attachedNotes": "첨부된 노트",
	"title": "파일 상세"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"info": "Over",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"info": "Infomasjon",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"info": "Informacje",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"info": "Informações",
	"attachedNotes": "Notas anexadas",
	"title": "Detalhes do arquivo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"info": "Описание",
	"attachedNotes": "Закреплённые заметки",
	"title": "File details"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"info": "Informácie",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"info": "เกี่ยวกับ",
	"attachedNotes": "โน้ตที่แนบมาด้วย",
	"title": "รายละเอียดไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"info": "Hakkında",
	"attachedNotes": "Ekli notlar",
	"title": "Dosya ayrıntıları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"info": "About",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"info": "Інформація",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"info": "Giới thiệu",
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"info": "关于",
	"attachedNotes": "附加到的帖子",
	"title": "文件信息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"info": "資訊",
	"attachedNotes": "含有附件的貼文",
	"title": "檔案詳細資訊"
}
</locale>
