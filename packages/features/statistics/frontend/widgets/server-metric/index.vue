<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent">
	<template #icon><i class="ti ti-server"></i></template>
	<template #header>{{ $locale.sfc.serverMetric }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="toggleView()"><i class="ti ti-selector"></i></button></template>

	<div v-if="meta" data-testid="mkw-serverMetric" class="mkw-serverMetric">
		<XCpuMemory v-if="widgetProps.view === 0" :connection="connection" :meta="meta"/>
		<XNet v-else-if="widgetProps.view === 1" :connection="connection" :meta="meta"/>
		<XCpu v-else-if="widgetProps.view === 2" :connection="connection" :meta="meta"/>
		<XMemory v-else-if="widgetProps.view === 3" :connection="connection" :meta="meta"/>
		<XDisk v-else-if="widgetProps.view === 4" :meta="meta"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from '../../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from '../../../../ui/frontend/widgets/widget.js';
import XCpuMemory from '@features/statistics/frontend/widgets/server-metric/cpu-mem.vue';
import XNet from '@features/statistics/frontend/widgets/server-metric/net.vue';
import XCpu from '@features/statistics/frontend/widgets/server-metric/cpu.vue';
import XMemory from '@features/statistics/frontend/widgets/server-metric/mem.vue';
import XDisk from '@features/statistics/frontend/widgets/server-metric/disk.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { useStream } from '@features/api/frontend/stream.js';

const name = 'serverMetric';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
	},
	view: {
		type: 'number',
		default: 0,
		hidden: true,
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

const meta = ref<Misskey.entities.ServerInfoResponse | null>(null);

misskeyApiGet('server-info', {}).then(res => {
	meta.value = res;
});

const toggleView = () => {
	if (widgetProps.view === 4) {
		widgetProps.view = 0;
	} else {
		widgetProps.view++;
	}
	save();
};

const connection = useStream().useChannel('serverStats');
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"serverMetric": "إحصائيات الخادم",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"serverMetric": "Mètriques del servidor",
	"showHeader": "Mostrar la capçalera",
	"transparent": "Fons transparent"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"serverMetric": "Metriky serveru",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"serverMetric": "Servermetriken",
	"showHeader": "Kopfzeile anzeigen",
	"transparent": "Hintergrund transparent machen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"serverMetric": "Estadísticas del servidor",
	"showHeader": "Mostrar encabezados",
	"transparent": "Hacer fondo transparente"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"serverMetric": "Statistiques du serveur",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"serverMetric": "Statistik peladen",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"serverMetric": "Statistiche server",
	"showHeader": "Mostra la testata",
	"transparent": "Sfondo trasparente"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"serverMetric": "サーバーメトリクス",
	"showHeader": "ヘッダーを表示",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"serverMetric": "サーバーメトリクス",
	"showHeader": "ヘッダー出す",
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"serverMetric": "서버 통계",
	"showHeader": "해더를 표시",
	"transparent": "배경을 투명하게 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"serverMetric": "Metryka serwera",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"serverMetric": "Métricas do servidor",
	"showHeader": "Exibir cabeçalho",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"serverMetric": "Показатели сервера",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"serverMetric": "Metriky servera",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"serverMetric": "ตัวชี้วัดเซิร์ฟเวอร์",
	"showHeader": "แสดงส่วนหัว",
	"transparent": "ทำพื้นหลังโปรงใส"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"serverMetric": "Sunucu ölçümleri",
	"showHeader": "Başlığı göster",
	"transparent": "Arka planı şeffaf yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"serverMetric": "Server metrics",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"serverMetric": "Показники сервера ",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"serverMetric": "Thống kê máy chủ",
	"showHeader": "Show header",
	"transparent": "Make background transparent"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"serverMetric": "服务器指标",
	"showHeader": "显示标题",
	"transparent": "使背景透明"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"serverMetric": "伺服器指標 ",
	"showHeader": "檢視標頭 ",
	"transparent": "使背景透明"
}
</locale>
