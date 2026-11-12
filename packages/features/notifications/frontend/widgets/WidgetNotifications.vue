<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" data-testid="mkw-notifications" class="mkw-notifications">
	<template #icon><i class="ti ti-bell"></i></template>
	<template #header>{{ globalLocale.env.notifications }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configureNotification()"><i class="ti ti-settings"></i></button></template>

	<div>
		<MkStreamingNotificationsTimeline :excludeTypes="widgetProps.excludeTypes"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { defineAsyncComponent } from 'vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkStreamingNotificationsTimeline from '@features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { notificationTypes as notificationTypes_typeReferenceOnly } from 'misskey-js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const name = 'notifications';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
	height: {
		type: 'number',
		label: $locale.value.sfc.height,
		default: 300,
	},
	excludeTypes: {
		type: 'array',
		hidden: true,
		default: [] as (typeof notificationTypes_typeReferenceOnly[number])[],
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const configureNotification = async () => {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/notifications/frontend/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: widgetProps.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			widgetProps.excludeTypes = excludeTypes;
			save();
		},
		closed: () => dispose(),
	});
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"showHeader": "Show header",
	"height": "الإرتفاع"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"showHeader": "Mostrar la capçalera",
	"height": "Alçària"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"showHeader": "Show header",
	"height": "Výška"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"showHeader": "Show header",
	"height": "Height"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"showHeader": "Kopfzeile anzeigen",
	"height": "Höhe"
}
</locale>

<locale locale="en-US" lang="json">
{
	"showHeader": "Show header",
	"height": "Height"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"showHeader": "Mostrar encabezados",
	"height": "Altura"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"showHeader": "Show header",
	"height": "Hauteur"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"showHeader": "Show header",
	"height": "Tinggi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"showHeader": "Mostra la testata",
	"height": "Altezza"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"showHeader": "ヘッダーを表示",
	"height": "高さ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"showHeader": "ヘッダー出す",
	"height": "高さ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"showHeader": "Show header",
	"height": "Height"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"showHeader": "Show header",
	"height": "Height"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"showHeader": "해더를 표시",
	"height": "높이"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"showHeader": "Show header",
	"height": "Hoogte"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"showHeader": "Show header",
	"height": "Høyde"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"showHeader": "Show header",
	"height": "Wysokość"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"showHeader": "Exibir cabeçalho",
	"height": "Altura"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"showHeader": "Show header",
	"height": "Высота"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"showHeader": "Show header",
	"height": "Výška"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"showHeader": "แสดงส่วนหัว",
	"height": "ความสูง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"showHeader": "Başlığı göster",
	"height": "Yükseklik"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"showHeader": "Show header",
	"height": "Height"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"showHeader": "Show header",
	"height": "Висота"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"showHeader": "Show header",
	"height": "Chiều cao"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"showHeader": "显示标题",
	"height": "高度"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"showHeader": "檢視標頭 ",
	"height": "高度"
}
</locale>
