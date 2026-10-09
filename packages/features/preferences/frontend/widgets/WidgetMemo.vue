<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-memo" class="mkw-memo">
	<template #icon><i class="ti ti-note"></i></template>
	<template #header>{{ $locale.sfc.widgetsMemo }}</template>

	<div :class="$style.root">
		<textarea v-model="text" :style="`height: ${widgetProps.height}px;`" :class="$style.textarea" :placeholder="$locale.sfc.memo" @input="onChange"></textarea>
		<button :class="$style.save" :disabled="!changed" class="_buttonPrimary" @click="saveMemo">{{ $locale.sfc.save }}</button>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { store } from '@features/preferences/frontend/store.js';

const name = 'memo';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.widgetOptionsShowHeader,
		default: true,
	},
	height: {
		type: 'number',
		label: $locale.value.sfc.height,
		default: 100,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const text = ref<string | null>(store.s.memo);
const changed = ref(false);
let timeoutId: number | null = null;

const saveMemo = () => {
	store.set('memo', text.value);
	changed.value = false;
};

const onChange = () => {
	changed.value = true;
	if (timeoutId != null) window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(saveMemo, 1000);
};

watch(() => store.r.memo, newText => {
	text.value = newText.value;
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding-bottom: 28px + 16px;
}

.textarea {
	display: block;
	width: 100%;
	max-width: 100%;
	min-width: 100%;
	padding: 16px;
	color: var(--MI_THEME-fg);
	background: transparent;
	border: none;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
	border-radius: 0;
	box-sizing: border-box;
	font: inherit;
	font-size: 0.9em;

	&:focus-visible {
		outline: none;
	}
}

.save {
	display: block;
	position: absolute;
	bottom: 8px;
	right: 8px;
	margin: 0;
	padding: 0 10px;
	height: 28px;
	outline: none;
	border-radius: 4px;

	&:disabled {
		opacity: 0.7;
		cursor: default;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"widgetsMemo": "ملاحظة لاصقة",
	"memo": "تذكير",
	"save": "حفظ",
	"widgetOptionsShowHeader": "Show header",
	"height": "الإرتفاع"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"widgetsMemo": "Notes adhesives",
	"memo": "Recordatori",
	"save": "Desa",
	"widgetOptionsShowHeader": "Mostrar la capçalera",
	"height": "Alçària"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"widgetsMemo": "Přilepené poznámky",
	"memo": "Memo",
	"save": "Uložit",
	"widgetOptionsShowHeader": "Show header",
	"height": "Výška"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Memo",
	"save": "Save",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"widgetsMemo": "Merkzettel",
	"memo": "Merkzettel",
	"save": "Speichern",
	"widgetOptionsShowHeader": "Kopfzeile anzeigen",
	"height": "Höhe"
}
</locale>

<locale lang="json" locale="en-US">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Memo",
	"save": "Save",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"widgetsMemo": "Nota adhesiva",
	"memo": "Notas",
	"save": "Guardar",
	"widgetOptionsShowHeader": "Mostrar encabezados",
	"height": "Altura"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"widgetsMemo": "Note collante",
	"memo": "Pense-bête",
	"save": "Enregistrer",
	"widgetOptionsShowHeader": "Show header",
	"height": "Hauteur"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"widgetsMemo": "Catatan memo",
	"memo": "Memo",
	"save": "Simpan",
	"widgetOptionsShowHeader": "Show header",
	"height": "Tinggi"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"widgetsMemo": "Promemoria",
	"memo": "Promemoria",
	"save": "Salva",
	"widgetOptionsShowHeader": "Mostra la testata",
	"height": "Altezza"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"widgetsMemo": "付箋",
	"memo": "メモ",
	"save": "保存",
	"widgetOptionsShowHeader": "ヘッダーを表示",
	"height": "高さ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"widgetsMemo": "付箋",
	"memo": "メモ",
	"save": "とっとく",
	"widgetOptionsShowHeader": "ヘッダー出す",
	"height": "高さ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Memo",
	"save": "Sekles",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Memo",
	"save": "ಉಳಿಸಿ",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"widgetsMemo": "스티커 메모",
	"memo": "메모",
	"save": "저장",
	"widgetOptionsShowHeader": "해더를 표시",
	"height": "높이"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Memo",
	"save": "Opslaan",
	"widgetOptionsShowHeader": "Show header",
	"height": "Hoogte"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Notat",
	"save": "Lagre",
	"widgetOptionsShowHeader": "Show header",
	"height": "Høyde"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"widgetsMemo": "Przypięte notatki",
	"memo": "Notatki",
	"save": "Zapisz",
	"widgetOptionsShowHeader": "Show header",
	"height": "Wysokość"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"widgetsMemo": "Notas adesivas",
	"memo": "Nota",
	"save": "Salvar",
	"widgetOptionsShowHeader": "Exibir cabeçalho",
	"height": "Altura"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"widgetsMemo": "Памятки",
	"memo": "Памятка",
	"save": "Сохранить",
	"widgetOptionsShowHeader": "Show header",
	"height": "Высота"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"widgetsMemo": "Prilepené poznámky",
	"memo": "Memo",
	"save": "Uložiť",
	"widgetOptionsShowHeader": "Show header",
	"height": "Výška"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"widgetsMemo": "โน้ตแปะ",
	"memo": "เมโม",
	"save": "บันทึก",
	"widgetOptionsShowHeader": "แสดงส่วนหัว",
	"height": "ความสูง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"widgetsMemo": "Yapışkan notlar",
	"memo": "Hatırlatıcı",
	"save": "Kaydet",
	"widgetOptionsShowHeader": "Başlığı göster",
	"height": "Yükseklik"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"widgetsMemo": "Sticky notes",
	"memo": "Memo",
	"save": "Save",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"widgetsMemo": "Нагадування",
	"memo": "Примітка",
	"save": "Зберегти",
	"widgetOptionsShowHeader": "Show header",
	"height": "Висота"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"widgetsMemo": "Tút đã ghim",
	"memo": "Lưu ý",
	"save": "Lưu",
	"widgetOptionsShowHeader": "Show header",
	"height": "Chiều cao"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"widgetsMemo": "便签",
	"memo": "备注",
	"save": "保存",
	"widgetOptionsShowHeader": "显示标题",
	"height": "高度"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"widgetsMemo": "備忘錄",
	"memo": "備忘錄",
	"save": "儲存",
	"widgetOptionsShowHeader": "檢視標頭 ",
	"height": "高度"
}
</locale>
