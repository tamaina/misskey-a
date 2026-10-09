<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-device-tv"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || $locale.sfc.channel }}</span>
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
		title: $locale.value.sfc.selectChannel,
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
	text: $locale.value.sfc.selectChannel,
	action: setChannel,
}, {
	icon: 'ti ti-bell',
	text: $locale.value.sfc.newNoteNotificationSettings,
	action: () => soundSettingsButton(soundSetting),
}];
</script>

<locale locale="ar-SA" lang="json">
{
	"channel": "القنوات",
	"selectChannel": "اختر قناة",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"channel": "Canals",
	"selectChannel": "Selecciona un canal",
	"newNoteNotificationSettings": "Configuració de notificacions per a notes noves"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"channel": "Kanály",
	"selectChannel": "Vybrat kanál",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"channel": "Channel",
	"selectChannel": "Select a channel",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"channel": "Kanal",
	"selectChannel": "Kanal auswählen",
	"newNoteNotificationSettings": "Benachrichtigungseinstellungen für neue Notizen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"channel": "Channel",
	"selectChannel": "Select a channel",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"channel": "Canal",
	"selectChannel": "Seleccionar canal",
	"newNoteNotificationSettings": "Configuración de las notificaciones para notas nuevas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"channel": "Canal",
	"selectChannel": "Sélectionner un canal",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"channel": "Kanal",
	"selectChannel": "Pilih kanal",
	"newNoteNotificationSettings": "Pengaturan notifikasi untuk note baru"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"channel": "Canali",
	"selectChannel": "Seleziona canale",
	"newNoteNotificationSettings": "Preferenze per le notifiche di nuove Note"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"channel": "チャンネル",
	"selectChannel": "チャンネルを選択",
	"newNoteNotificationSettings": "新着ノート通知の設定"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"channel": "チャンネル",
	"selectChannel": "チャンネルを選ぶ",
	"newNoteNotificationSettings": "新着ノート通知の設定"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"channel": "Channel",
	"selectChannel": "Select a channel",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"channel": "Channel",
	"selectChannel": "Select a channel",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"channel": "채널",
	"selectChannel": "채널 선택",
	"newNoteNotificationSettings": "새 노트 알림 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"channel": "Kanalen",
	"selectChannel": "Kanaal selecteren",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"channel": "Kanaler",
	"selectChannel": "Velg en kanal",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"channel": "Kanały",
	"selectChannel": "Wybierz kanał",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"channel": "Canais",
	"selectChannel": "Selecionar canal",
	"newNoteNotificationSettings": "Opções de notificação para novas notas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"channel": "Каналы",
	"selectChannel": "Выберите канал",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"channel": "Kanály",
	"selectChannel": "Zvoľte kanál",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"channel": "ช่อง",
	"selectChannel": "เลือกช่อง",
	"newNoteNotificationSettings": "ตั้งค่าการแจ้งเตือนเมื่อมีโน้ตใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"channel": "Kanal",
	"selectChannel": "Kanal seç",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"channel": "Channel",
	"selectChannel": "Select a channel",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"channel": "Канали",
	"selectChannel": "Виберіть канал",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"channel": "Kênh",
	"selectChannel": "Lựa chọn kênh",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"channel": "频道",
	"selectChannel": "选择频道",
	"newNoteNotificationSettings": "新帖子通知设定"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"channel": "頻道",
	"selectChannel": "選擇頻道",
	"newNoteNotificationSettings": "新貼文通知的設定"
}
</locale>
