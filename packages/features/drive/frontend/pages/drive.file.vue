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
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref, defineAsyncComponent } from 'vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkSwiper from '@features/ui/frontend/components/MkSwiper.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	fileId: string;
}>();

const XFileInfo = defineAsyncComponent(() => import('@features/drive/frontend/pages/drive.file.info.vue'));
const XNotes = defineAsyncComponent(() => import('@features/drive/frontend/pages/drive.file.notes.vue'));

const tab = ref('info');

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'info',
	title: globalLocale.value.env.info,
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
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"attachedNotes": "Notes amb aquest fitxer",
	"title": "Detall del fitxer"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"attachedNotes": "Zugehörige Notizen",
	"title": "Dateiinformationen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"attachedNotes": "Notas adjuntas",
	"title": "Detalles del archivo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"attachedNotes": "Notes avec ce fichier",
	"title": "Détails du fichier"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"attachedNotes": "Catatan yang dilampirkan",
	"title": "Rincian berkas"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"attachedNotes": "Note a cui è allegato",
	"title": "Dettagli del file"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"attachedNotes": "添付されているノート",
	"title": "ファイルの詳細"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"attachedNotes": "ファイルがついてきてるノート",
	"title": "ファイルの詳しい情報"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"attachedNotes": "첨부된 노트",
	"title": "파일 상세"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"attachedNotes": "Notas anexadas",
	"title": "Detalhes do arquivo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"attachedNotes": "Закреплённые заметки",
	"title": "File details"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"attachedNotes": "โน้ตที่แนบมาด้วย",
	"title": "รายละเอียดไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"attachedNotes": "Ekli notlar",
	"title": "Dosya ayrıntıları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"attachedNotes": "Attached notes",
	"title": "File details"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"attachedNotes": "附加到的帖子",
	"title": "文件信息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"attachedNotes": "含有附件的貼文",
	"title": "檔案詳細資訊"
}
</locale>
