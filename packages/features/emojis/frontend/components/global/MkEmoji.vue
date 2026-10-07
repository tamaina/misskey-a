<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<img v-if="shouldMute" :class="$style.root" src="/client-assets/unknown.png" :alt="props.emoji" decoding="async" @pointerenter="computeTitle" @click="onClick"/>
<img v-else-if="!useOsNativeEmojis" :class="$style.root" :src="url" :alt="props.emoji" decoding="async" @pointerenter="computeTitle" @click="onClick"/>
<span v-else :alt="props.emoji" @pointerenter="computeTitle" @click="onClick">{{ colorizedNativeEmoji }}</span>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { colorizeEmoji, getEmojiName } from '@features/emojis/frontend/shared/emojilist.js';
import { char2fluentEmojiFilePath, char2twemojiFilePath } from '@features/emojis/frontend/shared/emoji-base.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import * as os from '@features/ui/frontend/os.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';
import { mute as muteEmoji, unmute as unmuteEmoji, checkMuted as checkMutedEmoji } from '@features/emojis/frontend/utility/emoji-mute.js';
import { addToEmojiPalette } from '@features/emojis/frontend/utility/emoji-palette.js';

const props = defineProps<{
	emoji: string;
	menu?: boolean;
	menuReaction?: boolean;
	ignoreMuted?: boolean;
}>();

const react = inject(DI.mfmEmojiReactCallback, null);

const char2path = prefer.s.emojiStyle === 'twemoji' ? char2twemojiFilePath : char2fluentEmojiFilePath;

const useOsNativeEmojis = computed(() => prefer.s.emojiStyle === 'native');
const url = computed(() => char2path(props.emoji));
const colorizedNativeEmoji = computed(() => colorizeEmoji(props.emoji));
const isMuted = checkMutedEmoji(props.emoji);
const shouldMute = computed(() => isMuted.value && !props.ignoreMuted);

// Searching from an array with 2000 items for every emoji felt like too energy-consuming, so I decided to do it lazily on pointerenter
function computeTitle(event: PointerEvent): void {
	(event.target as HTMLElement).title = getEmojiName(props.emoji);
}

function mute() {
	os.confirm({
		type: 'question',
		title: $l.value.sfc.muteX({ x: props.emoji }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		muteEmoji(props.emoji);
	});
}

function unmute() {
	os.confirm({
		type: 'question',
		title: $l.value.sfc.unmuteX({ x: props.emoji }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		unmuteEmoji(props.emoji);
	});
}

function onClick(ev: PointerEvent) {
	if (props.menu) {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			type: 'label',
			text: props.emoji,
		}, {
			text: $locale.value.sfc.copy,
			icon: 'ti ti-copy',
			action: () => {
				copyToClipboard(props.emoji);
			},
		});

		if (props.menuReaction && react) {
			menuItems.push({
				text: $locale.value.sfc.doReaction,
				icon: 'ti ti-plus',
				action: () => {
					react(props.emoji);
				},
			});
		}

		menuItems.push({
			type: 'divider',
		});

		if (isMuted.value) {
			menuItems.push({
				text: $locale.value.sfc.emojiUnmute,
				icon: 'ti ti-mood-smile',
				action: () => {
					unmute();
				},
			});
		} else {
			menuItems.push({
				text: $locale.value.sfc.emojiMute,
				icon: 'ti ti-mood-off',
				action: () => {
					mute();
				},
			});
		}

		menuItems.push({
			text: $locale.value.sfc.addToEmojiPalette,
			icon: 'ti ti-palette',
			action: () => {
				addToEmojiPalette(props.emoji);
			},
		});

		os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
	}
}
</script>

<style lang="scss" module>
.root {
	height: 1.25em;
	vertical-align: -0.25em;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "نسخ",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"muteX": "Silenciar {x}",
	"unmuteX": "Deixar de silenciar {x}",
	"copy": "Copiar",
	"doReaction": "Afegeix una reacció ",
	"emojiUnmute": "Deixar de silenciar emojis",
	"emojiMute": "Silenciar emojis",
	"addToEmojiPalette": "Afegeix al calaix d'emojis"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Kopírovat",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Copy",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"muteX": "{x} stummschalten",
	"unmuteX": "Stummschaltung von {x} aufheben",
	"copy": "Kopieren",
	"doReaction": "Reagieren",
	"emojiUnmute": "Emoji-Stummschaltung aufheben",
	"emojiMute": "Emoji stummschalten",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="en-US" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Copy",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"muteX": "Silenciar {x}",
	"unmuteX": "Dejar de silenciar {x}",
	"copy": "Copiar",
	"doReaction": "Añadir reacción",
	"emojiUnmute": "No silenciar emoji",
	"emojiMute": "Silenciar emoji",
	"addToEmojiPalette": "Añadir a la paleta de emojis"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Copier",
	"doReaction": "Réagir",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Salin",
	"doReaction": "Tambahkan reaksi",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"muteX": "Silenzia {x}",
	"unmuteX": "De silenzia {x}",
	"copy": "Copia",
	"doReaction": "Reagisci",
	"emojiUnmute": "De silenzia emoji",
	"emojiMute": "Silenzia emoji",
	"addToEmojiPalette": "Aggiungi alla tavolozza emoji"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"muteX": "{x}をミュート",
	"unmuteX": "{x}のミュートを解除",
	"copy": "コピー",
	"doReaction": "リアクションする",
	"emojiUnmute": "絵文字ミュート解除",
	"emojiMute": "絵文字ミュート",
	"addToEmojiPalette": "絵文字パレットに追加"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"muteX": "{x}をミュート",
	"unmuteX": "{x}のミュートやめたる",
	"copy": "コピー",
	"doReaction": "ツッコむで",
	"emojiUnmute": "絵文字ミュートやめたる",
	"emojiMute": "絵文字ミュート",
	"addToEmojiPalette": "絵文字パレットに追加"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Copy",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Copy",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"muteX": "{x}를 뮤트",
	"unmuteX": "{x}의 뮤트를 해제",
	"copy": "복사",
	"doReaction": "리액션 추가",
	"emojiUnmute": "이모티콘 뮤트 해제",
	"emojiMute": "이모티콘 뮤트",
	"addToEmojiPalette": "이모지 팔레트에 추가"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Kopiëren",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Kopier",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Kopiuj",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"muteX": "Silenciar {x}",
	"unmuteX": "Reativar {x}",
	"copy": "Copiar",
	"doReaction": "Adicionar reação",
	"emojiUnmute": "Reativar emoji",
	"emojiMute": "Silenciar emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"muteX": "Скрыть {x}",
	"unmuteX": "Показать {x}",
	"copy": "Копировать",
	"doReaction": "Добавить реакцию",
	"emojiUnmute": "Показать эмодзи",
	"emojiMute": "Скрыть эмодзи",
	"addToEmojiPalette": "Добавить к палитре эмодзи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Kopírovať",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"muteX": "ปิดเสียง {x}",
	"unmuteX": "เลิกปิดเสียง {x}",
	"copy": "คัดลอก",
	"doReaction": "เพิ่มรีแอคชั่น",
	"emojiUnmute": "เลิกปิดเสียงเอโมจิ",
	"emojiMute": "ปิดเสียงเอโมจิ",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"muteX": "Sessiz {x}",
	"unmuteX": "Sesi aç {x}",
	"copy": "Kopyala",
	"doReaction": "Tepki ekle",
	"emojiUnmute": "Emoji ses aç",
	"emojiMute": "Emoji ses kapat",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Copy",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"muteX": "Приховати {x}",
	"unmuteX": "Показувати {x}",
	"copy": "Скопіювати",
	"doReaction": "Додати реакцію",
	"emojiUnmute": "Показувати емодзі",
	"emojiMute": "Приховати емодзі",
	"addToEmojiPalette": "Додати до палітри емодзі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}",
	"copy": "Sao chép",
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"muteX": "隐藏{x}",
	"unmuteX": "取消对{x}的隐藏",
	"copy": "复制",
	"doReaction": "回应",
	"emojiUnmute": "取消屏蔽表情符号",
	"emojiMute": "屏蔽表情符号",
	"addToEmojiPalette": "添加至表情符号选择器"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"muteX": "將 {x} 靜音",
	"unmuteX": "將 {x} 解除靜音",
	"copy": "複製",
	"doReaction": "做出反應",
	"emojiUnmute": "表情符號解除靜音",
	"emojiMute": "表情符號靜音",
	"addToEmojiPalette": "增加表情符號調色盤"
}
</locale>
