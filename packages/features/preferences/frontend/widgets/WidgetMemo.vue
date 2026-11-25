<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-memo" class="mkw-memo">
	<template #icon><i class="ti ti-note"></i></template>
	<template #header>{{ $locale.sfc.widgetsMemo }}</template>

	<div :class="$style.root">
		<textarea v-model="text" :style="`height: ${widgetProps.height}px;`" :class="$style.textarea" :placeholder="globalLocale.env.memo" @input="onChange"></textarea>
		<button :class="$style.save" :disabled="!changed" class="_buttonPrimary" @click="saveMemo">{{ globalLocale.env.save }}</button>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, watch } from 'vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { store } from '@features/preferences/frontend/store.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	"widgetOptionsShowHeader": "Show header",
	"height": "الإرتفاع"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"widgetsMemo": "Notes adhesives",
	"widgetOptionsShowHeader": "Mostrar la capçalera",
	"height": "Alçària"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"widgetsMemo": "Přilepené poznámky",
	"widgetOptionsShowHeader": "Show header",
	"height": "Výška"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"widgetsMemo": "Merkzettel",
	"widgetOptionsShowHeader": "Kopfzeile anzeigen",
	"height": "Höhe"
}
</locale>

<locale lang="json" locale="en-US">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"widgetsMemo": "Nota adhesiva",
	"widgetOptionsShowHeader": "Mostrar encabezados",
	"height": "Altura"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"widgetsMemo": "Note collante",
	"widgetOptionsShowHeader": "Show header",
	"height": "Hauteur"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"widgetsMemo": "Catatan memo",
	"widgetOptionsShowHeader": "Show header",
	"height": "Tinggi"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"widgetsMemo": "Promemoria",
	"widgetOptionsShowHeader": "Mostra la testata",
	"height": "Altezza"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"widgetsMemo": "付箋",
	"widgetOptionsShowHeader": "ヘッダーを表示",
	"height": "高さ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"widgetsMemo": "付箋",
	"widgetOptionsShowHeader": "ヘッダー出す",
	"height": "高さ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"widgetsMemo": "스티커 메모",
	"widgetOptionsShowHeader": "해더를 표시",
	"height": "높이"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Hoogte"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Høyde"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"widgetsMemo": "Przypięte notatki",
	"widgetOptionsShowHeader": "Show header",
	"height": "Wysokość"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"widgetsMemo": "Notas adesivas",
	"widgetOptionsShowHeader": "Exibir cabeçalho",
	"height": "Altura"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"widgetsMemo": "Памятки",
	"widgetOptionsShowHeader": "Show header",
	"height": "Высота"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"widgetsMemo": "Prilepené poznámky",
	"widgetOptionsShowHeader": "Show header",
	"height": "Výška"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"widgetsMemo": "โน้ตแปะ",
	"widgetOptionsShowHeader": "แสดงส่วนหัว",
	"height": "ความสูง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"widgetsMemo": "Yapışkan notlar",
	"widgetOptionsShowHeader": "Başlığı göster",
	"height": "Yükseklik"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"widgetsMemo": "Sticky notes",
	"widgetOptionsShowHeader": "Show header",
	"height": "Height"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"widgetsMemo": "Нагадування",
	"widgetOptionsShowHeader": "Show header",
	"height": "Висота"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"widgetsMemo": "Tút đã ghim",
	"widgetOptionsShowHeader": "Show header",
	"height": "Chiều cao"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"widgetsMemo": "便签",
	"widgetOptionsShowHeader": "显示标题",
	"height": "高度"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"widgetsMemo": "備忘錄",
	"widgetOptionsShowHeader": "檢視標頭 ",
	"height": "高度"
}
</locale>
