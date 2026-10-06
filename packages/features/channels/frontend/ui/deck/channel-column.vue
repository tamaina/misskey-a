<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-device-tv"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || i18n.ts._deck._columns.channel }}</span>
	</template>

	<template v-if="column.channelId">
		<div style="padding: 8px; text-align: center;">
			<MkButton primary gradate rounded inline small @click="post"><i class="ti ti-pencil"></i></MkButton>
		</div>
		<MkStreamingNotesTimeline ref="timeline" src="channel" :channel="column.channelId"/>
	</template>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { favoritedChannelsCache } from '@features/runtime/frontend/cache.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { i18n } from '@features/runtime/frontend/i18n.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const channel = shallowRef<Misskey.entities.Channel>();
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

onMounted(() => {
	if (props.column.channelId == null) {
		setChannel();
	} else if (!props.column.name && props.column.channelId) {
		misskeyApi('channels/show', { channelId: props.column.channelId })
			.then(value => updateColumn(props.column.id, { timelineNameCache: value.name }));
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setChannel() {
	const channels = await favoritedChannelsCache.fetch();
	const { canceled, result: chosenChannelId } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map(x => ({
			value: x.id, label: x.name,
		})),
		default: channels.find(x => x.id === props.column.channelId)?.id,
	});
	if (canceled || chosenChannelId == null) return;
	const chosenChannel = channels.find(x => x.id === chosenChannelId)!;
	updateColumn(props.column.id, {
		channelId: chosenChannel.id,
		timelineNameCache: chosenChannel.name,
	});
}

async function post() {
	if (props.column.channelId == null) return;
	if (!channel.value || channel.value.id !== props.column.channelId) {
		channel.value = await misskeyApi('channels/show', {
			channelId: props.column.channelId,
		});
	}

	os.post({
		channel: channel.value,
	});
}

const menu: MenuItem[] = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.selectChannel,
	action: setChannel,
}, {
	icon: 'ti ti-bell',
	text: i18n.ts._deck.newNoteNotificationSettings,
	action: () => soundSettingsButton(soundSetting),
}];
</script>
