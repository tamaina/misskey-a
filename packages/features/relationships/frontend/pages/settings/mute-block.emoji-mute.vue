<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div :class="$style.emojis">
		<div v-for="emoji in emojis" :key="`emojiMute-${emoji}`" :class="$style.emoji" @click="onEmojiClick($event, emoji)">
			<MkCustomEmoji
				v-if="emoji.startsWith(':')"
				:name="customEmojiName(emoji)"
				:host="customEmojiHost(emoji)"
				:normal="true"
				:menu="false"
				:menuReaction="false"
				:ignoreMuted="true"
			/>
			<MkEmoji
				v-else
				:emoji="emoji"
				:menu="false"
				:menuReaction="false"
				:ignoreMuted="true"
			></MkEmoji>
		</div>
	</div>

	<MkButton primary inline @click="add"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>

	<hr>

	<SearchMarker :keywords="['sync', 'devices']">
		<MkSwitch :modelValue="syncEnabled" @update:modelValue="changeSyncEnabled">
			<template #label><i class="ti ti-cloud-cog"></i> <SearchLabel>{{ $locale.sfc.syncBetweenDevices }}</SearchLabel></template>
		</MkSwitch>
	</SearchMarker>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import {
	mute as muteEmoji,
	unmute as unmuteEmoji,
	extractCustomEmojiName as customEmojiName,
	extractCustomEmojiHost as customEmojiHost,
} from '@features/emojis/frontend/utility/emoji-mute.js';

const emojis = prefer.model('mutingEmojis');

function getHTMLElement(ev: PointerEvent): HTMLElement {
	const target = ev.currentTarget ?? ev.target;
	return target as HTMLElement;
}

function add(ev: PointerEvent) {
	os.pickEmoji(getHTMLElement(ev), { showPinned: false }).then((emoji) => {
		if (emoji) {
			muteEmoji(emoji);
		}
	});
}

function onEmojiClick(ev: PointerEvent, emoji: string) {
	const menuItems : MenuItem[] = [{
		type: 'label',
		text: emoji,
	}, {
		text: $locale.value.sfc.emojiUnmute,
		icon: 'ti ti-mood-off',
		action: () => unmute(emoji),
	}];
	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function unmute(emoji: string) {
	os.confirm({
		type: 'question',
		title: $l.value.sfc.unmuteX({ x: emoji }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		unmuteEmoji(emoji);
	});
}

const syncEnabled = ref(prefer.isSyncEnabled('mutingEmojis'));

function changeSyncEnabled(value: boolean) {
	if (value) {
		prefer.enableSync('mutingEmojis').then((res) => {
			if (res == null) return;
			if (res.enabled) syncEnabled.value = true;
		});
	} else {
		prefer.disableSync('mutingEmojis');
		syncEnabled.value = false;
	}
}

</script>

<style module>
.emojis {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;

	&:empty {
		display: none;
	}
}

.emoji {
	display: inline-flex;
	height: 42px;
	padding: 0 6px;
	font-size: 1.5em;
	border-radius: 6px;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-buttonBg);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"add": "إضافة",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"add": "Afegir",
	"syncBetweenDevices": "Sincronització entre dispositius",
	"emojiUnmute": "Deixar de silenciar emojis",
	"unmuteX": "Deixar de silenciar {x}"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"add": "Přidat",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"add": "Add",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"add": "Hinzufügen",
	"syncBetweenDevices": "Zwischen Geräten synchronisieren",
	"emojiUnmute": "Emoji-Stummschaltung aufheben",
	"unmuteX": "Stummschaltung von {x} aufheben"
}
</locale>

<locale locale="en-US" lang="json">
{
	"add": "Add",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"add": "Agregar",
	"syncBetweenDevices": "Sincronizar entre dispositivos",
	"emojiUnmute": "No silenciar emoji",
	"unmuteX": "Dejar de silenciar {x}"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"add": "Ajouter",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"add": "Tambahkan",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"add": "Aggiungi",
	"syncBetweenDevices": "Sincronizzazione tra i dispositivi",
	"emojiUnmute": "De silenzia emoji",
	"unmuteX": "De silenzia {x}"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"add": "追加",
	"syncBetweenDevices": "デバイス間で同期",
	"emojiUnmute": "絵文字ミュート解除",
	"unmuteX": "{x}のミュートを解除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"add": "増やす",
	"syncBetweenDevices": "デバイス間で同期",
	"emojiUnmute": "絵文字ミュートやめたる",
	"unmuteX": "{x}のミュートやめたる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"add": "Add",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"add": "Add",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"add": "추가",
	"syncBetweenDevices": "장치간 동기화",
	"emojiUnmute": "이모티콘 뮤트 해제",
	"unmuteX": "{x}의 뮤트를 해제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"add": "Toevoegen",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"add": "Legg til",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"add": "Dodaj",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"add": "Adicionar",
	"syncBetweenDevices": "Sincronizar entre dispositivos",
	"emojiUnmute": "Reativar emoji",
	"unmuteX": "Reativar {x}"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"add": "Добавить",
	"syncBetweenDevices": "Синхронизировать между устройствами",
	"emojiUnmute": "Показать эмодзи",
	"unmuteX": "Показать {x}"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"add": "Pridať",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"add": "เพิ่ม",
	"syncBetweenDevices": "ซิงค์ระหว่างอุปกรณ์",
	"emojiUnmute": "เลิกปิดเสียงเอโมจิ",
	"unmuteX": "เลิกปิดเสียง {x}"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"add": "Ekle",
	"syncBetweenDevices": "Cihazlar arasında senkronizasyon",
	"emojiUnmute": "Emoji ses aç",
	"unmuteX": "Sesi aç {x}"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"add": "Add",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"add": "Додати",
	"syncBetweenDevices": "Синхронізувати між пристроями",
	"emojiUnmute": "Показувати емодзі",
	"unmuteX": "Показувати {x}"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"add": "Thêm",
	"syncBetweenDevices": "Sync between devices",
	"emojiUnmute": "Unmute emoji",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"add": "添加",
	"syncBetweenDevices": "设备间同步",
	"emojiUnmute": "取消屏蔽表情符号",
	"unmuteX": "取消对{x}的隐藏"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"add": "新增",
	"syncBetweenDevices": "裝置之間的同步化",
	"emojiUnmute": "表情符號解除靜音",
	"unmuteX": "將 {x} 解除靜音"
}
</locale>
