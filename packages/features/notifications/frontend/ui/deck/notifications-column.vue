<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :menu="menu" :refresher="async () => { await notificationsComponent?.reload() }">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name || i18n.ts._deck._columns.notifications }}</template>

	<MkStreamingNotificationsTimeline ref="notificationsComponent" :excludeTypes="props.column.excludeTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, useTemplateRef } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotificationsTimeline from '@features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { i18n } from '@features/runtime/frontend/i18n.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const notificationsComponent = useTemplateRef('notificationsComponent');

async function func() {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/notifications/frontend/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: props.column.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			updateColumn(props.column.id, {
				excludeTypes: excludeTypes,
			});
		},
		closed: () => dispose(),
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.notificationSetting,
	action: func,
}];
</script>
