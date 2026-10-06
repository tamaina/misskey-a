<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" :dragStartCallback="dragStartCallback" @remove="() => emit('remove')">
	<template #header><i class="ti ti-note"></i> {{ $locale.sfc.note }}</template>

	<section style="padding: 16px;" class="_gaps_s">
		<MkInput v-model="id">
			<template #label>{{ $locale.sfc.id }}</template>
			<template #caption>{{ $locale.sfc.idDescription }}</template>
		</MkInput>
		<MkSwitch v-model="props.modelValue.detailed"><span>{{ $locale.sfc.detailed }}</span></MkSwitch>

		<MkNote v-if="note && !props.modelValue.detailed" :key="note.id + ':normal'" v-model:note="note" style="margin-bottom: 16px;"/>
		<MkNoteDetailed v-if="note && props.modelValue.detailed" :key="note.id + ':detail'" v-model:note="note" style="margin-bottom: 16px;"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '@features/pages/frontend/pages/page-editor/page-editor.container.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import MkNoteDetailed from '@features/notes/frontend/components/MkNoteDetailed.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const props = defineProps<{
	dragStartCallback?: (ev: DragEvent) => void;
	modelValue: Misskey.entities.PageBlock & { type: 'note' };
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'note' }): void;
	(ev: 'remove'): void;
}>();

const id = ref(props.modelValue.note);
const note = ref<Misskey.entities.Note | null>(null);

watch(id, async () => {
	if (id.value && (id.value.startsWith('http://') || id.value.startsWith('https://'))) {
		id.value = (id.value.endsWith('/') ? id.value.slice(0, -1) : id.value).split('/').pop() ?? null;
	}

	if (!id.value) {
		note.value = null;
		return;
	}

	emit('update:modelValue', {
		...props.modelValue,
		note: id.value,
	});
	note.value = await misskeyApi('notes/show', { noteId: id.value });
}, {
	immediate: true,
});
</script>

<locale locale="ar-SA" lang="json">
{
  "note": "ملاحظة مضمّنة",
  "id": "معرّف الملاحظة",
  "idDescription": "كبديل يمكنك إدخال رابك الملاحظة هنا",
  "detailed": "عرض مفصّل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "note": "Incorporar una Nota",
  "id": "ID de la publicació",
  "idDescription": "Alternativament pots enganxar l'adreça URL de la nota aquí.",
  "detailed": "Mostra els detalls"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "note": "Vestavěná poznámka",
  "id": "ID poznámky",
  "idDescription": "Adresu URL poznámky můžete vložit také sem.",
  "detailed": "Podrobné zobrazení"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "note": "Eingebettete Notiz",
  "id": "Notiz-ID",
  "idDescription": "Du kannst alternativ auch die Notiz-URL angeben.",
  "detailed": "Detailierte Ansicht"
}
</locale>

<locale locale="en-US" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "note": "Nota embebida",
  "id": "Id de la nota",
  "idDescription": "Pega la URL de la nota para configurarla",
  "detailed": "Ver Detalles"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "note": "Note intégrée",
  "id": "Identifiant de la note",
  "idDescription": "Pour configurer la note, vous pouvez aussi coller ici l'URL correspondante.",
  "detailed": "Afficher les détails"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "note": "Catatan yang ditanam",
  "id": "ID Catatan",
  "idDescription": "Kamu dapat menyetel ini dengan menempelkan tautan URL Catatan.",
  "detailed": "Tampilan rincian"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "note": "Nota integrata",
  "id": "ID nota",
  "idDescription": "Qui puoi anche incollare l'URL della nota che vuoi impostare.",
  "detailed": "Visualizzazione dettagliata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "note": "ノート埋め込み",
  "id": "ノートID",
  "idDescription": "ノートURLをペーストして設定することもできます。",
  "detailed": "詳細な表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "note": "ノート埋め込み",
  "id": "ノートID",
  "idDescription": "ノートURLをペーストして設定することもできるで。",
  "detailed": "詳細な表示"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "note": "노트필기",
  "id": "노트 ID",
  "idDescription": "노트 URL을 붙여넣어 설정할 수도 있습니다.",
  "detailed": "세부 정보 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "note": "Osadzony wpis",
  "id": "ID wpisu",
  "idDescription": "Możesz też wkleić adres URL wpisu, aby go ustawić.",
  "detailed": "Szczegółowy widok"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "note": "Nota embutida",
  "id": "ID da nota",
  "idDescription": "Você também pode colar o URL da nota aqui.",
  "detailed": "Visão detalhada"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "note": "Встроенная заметка",
  "id": "Идентификатор заметки",
  "idDescription": "Можно также вставить ссылку на заметку.",
  "detailed": "Подробный вид"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "note": "Vložená poznámka",
  "id": "ID poznámky",
  "idDescription": "Alebo môžete vložiť URL poznámky sem",
  "detailed": "Podrobný pohľad"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "note": "โน้ตที่ฝังตัว",
  "id": "โน้ต ID",
  "idDescription": "คุณสามารถจะวาง URL ของโน้ตที่นี่ก็ได้นะ",
  "detailed": "มุมมองโดยละเอียด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "note": "Gömülü not",
  "id": "Not Kimliği",
  "idDescription": "Alternatif olarak notun URL buraya yapıştırabilirsin.",
  "detailed": "Ayrıntılı görünüm"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "note": "Embedded note",
  "id": "Note ID",
  "idDescription": "You can alternatively paste the note URL here.",
  "detailed": "Detailed view"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "note": "Вбудована нотатка",
  "id": "Ідентифікатор нотатки",
  "idDescription": "Також можна вказати посилання на нотатку",
  "detailed": "Детальний вигляд"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "note": "Tút đã nhúng",
  "id": "ID tút",
  "idDescription": "Ngoài ra, bạn có thể dán URL tút vào đây.",
  "detailed": "Xem chi tiết"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "note": "嵌入的帖子",
  "id": "帖子 ID",
  "idDescription": "您也可以通过粘贴帖子的URL来进行设置。",
  "detailed": "显示详细信息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "note": "嵌式貼文",
  "id": "貼文ID",
  "idDescription": "您也可以貼上貼文 URL 來進行設定。 ",
  "detailed": "顯示詳細內容"
}
</locale>
