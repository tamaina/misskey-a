<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-antenna"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || i18n.ts._deck._columns.antenna }}</span>
	</template>

	<MkStreamingNotesTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch, defineAsyncComponent, provide } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type * as Misskey from 'misskey-js';
import type { entities as MisskeyEntities } from 'misskey-js';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { i18n } from '@features/runtime/frontend/i18n.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });
const antenna = ref<Misskey.entities.Antenna | null>(null);

provide('currentAntenna', antenna);

watch(() => props.column.antennaId, async (antennaId) => {
	if (antennaId == null) return;
	antenna.value = await misskeyApi('antennas/show', { antennaId });
}, { immediate: true });

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	} else if (props.column.timelineNameCache == null) {
		misskeyApi('antennas/show', { antennaId: props.column.antennaId })
			.then(value => updateColumn(props.column.id, { timelineNameCache: value.name }));
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setAntenna() {
	const antennas = await misskeyApi('antennas/list');
	const { canceled, result: antennaIdOrOperation } = await os.select({
		title: i18n.ts.selectAntenna,
		items: [
			{ value: '_CREATE_', label: i18n.ts.createNew },
			(antennas.length > 0 ? {
				type: 'group' as const,
				label: i18n.ts.createdAntennas,
				items: antennas.map(x => ({
					value: x.id, label: x.name,
				})),
			} : undefined),
		],
		default: antennas.find(x => x.id === props.column.antennaId)?.id,
	});

	if (canceled || antennaIdOrOperation == null) return;

	if (antennaIdOrOperation === '_CREATE_') {
		const { dispose } = await os.popupAsyncWithDialog(import('@features/timelines/frontend/components/MkAntennaEditorDialog.vue').then(x => x.default), {}, {
			created: (newAntenna: MisskeyEntities.Antenna) => {
				antennasCache.delete();
				updateColumn(props.column.id, {
					antennaId: newAntenna.id,
					timelineNameCache: newAntenna.name,
				});
			},
			closed: () => {
				dispose();
			},
		});
		return;
	}

	const selectedAntenna = antennas.find(x => x.id === antennaIdOrOperation);
	if (selectedAntenna == null) return;

	updateColumn(props.column.id, {
		antennaId: selectedAntenna.id,
		timelineNameCache: selectedAntenna.name,
	});
}

function editAntenna() {
	os.pageWindow('/my/antennas/' + props.column.antennaId);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectAntenna,
		action: setAntenna,
	},
	{
		icon: 'ti ti-settings',
		text: i18n.ts.editAntenna,
		action: editAntenna,
	},
	{
		icon: 'ti ti-bell',
		text: i18n.ts._deck.newNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	},
];

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>
