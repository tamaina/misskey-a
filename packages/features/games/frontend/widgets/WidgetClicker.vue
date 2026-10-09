<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-clicker">
	<template #icon><i class="ti ti-cookie"></i></template>
	<template #header>Clicker</template>
	<MkClickerGame/>
</MkContainer>
</template>

<script lang="ts" setup>
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkClickerGame from '@features/games/frontend/components/MkClickerGame.vue';

const name = 'clicker';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: false,
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

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"showHeader": "Mostrar la capçalera"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"showHeader": "Kopfzeile anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"showHeader": "Mostrar encabezados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"showHeader": "Mostra la testata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"showHeader": "ヘッダーを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"showHeader": "ヘッダー出す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"showHeader": "해더를 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"showHeader": "Exibir cabeçalho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"showHeader": "แสดงส่วนหัว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"showHeader": "Başlığı göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"showHeader": "Show header"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"showHeader": "显示标题"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"showHeader": "檢視標頭 "
}
</locale>
