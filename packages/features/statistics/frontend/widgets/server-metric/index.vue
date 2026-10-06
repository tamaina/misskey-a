<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent">
	<template #icon><i class="ti ti-server"></i></template>
	<template #header>{{ i18n.ts._widgets.serverMetric }}</template>
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
import { useWidgetPropsManager } from '../../../../../frontend/src/widgets/widget.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from '../../../../../frontend/src/widgets/widget.js';
import XCpuMemory from '@features/statistics/frontend/widgets/server-metric/cpu-mem.vue';
import XNet from '@features/statistics/frontend/widgets/server-metric/net.vue';
import XCpu from '@features/statistics/frontend/widgets/server-metric/cpu.vue';
import XMemory from '@features/statistics/frontend/widgets/server-metric/mem.vue';
import XDisk from '@features/statistics/frontend/widgets/server-metric/disk.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';

const name = 'serverMetric';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.showHeader,
		default: true,
	},
	transparent: {
		type: 'boolean',
		label: i18n.ts._widgetOptions.transparent,
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
