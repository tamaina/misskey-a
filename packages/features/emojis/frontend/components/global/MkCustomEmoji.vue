<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<img
	v-if="shouldMute"
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	src="/client-assets/unknown.png"
	:title="alt"
	draggable="false"
	style="-webkit-user-drag: none;"
	@click="onClick"
/>
<img
	v-else-if="errored && fallbackToImage"
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	src="/client-assets/dummy.png"
	:title="alt"
	draggable="false"
	style="-webkit-user-drag: none;"
/>
<span v-else-if="errored">:{{ customEmojiName }}:</span>
<img
	v-else
	:class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]"
	:src="url"
	:alt="alt"
	:title="alt"
	decoding="async"
	draggable="false"
	@error="errored = true"
	@load="errored = false"
	@click="onClick"
/>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, defineAsyncComponent, inject, ref, watch } from 'vue';
import { normalizeCustomEmojiName, isLocalCustomEmojiName, getCustomEmojiImagePath } from '@features/emojis/frontend/shared/emoji-name.js';
import { getProxiedImageUrl, getStaticImageUrl } from '@features/drive/frontend/utility/media-proxy.js';
import { customEmojisMap } from '@features/emojis/frontend/custom-emojis.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi, misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkCustomEmojiDetailedDialog from '@features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue';
import { $i } from '@features/auth/frontend/i.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { DI } from '@features/ui/frontend/di.js';
import { makeEmojiMuteKey, mute as muteEmoji, unmute as unmuteEmoji, checkMuted as checkEmojiMuted } from '@features/emojis/frontend/utility/emoji-mute.js';
import { addToEmojiPalette } from '@features/emojis/frontend/utility/emoji-palette.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	name: string;
	normal?: boolean;
	noStyle?: boolean;
	host?: string | null;
	url?: string;
	useOriginalSize?: boolean;
	menu?: boolean;
	menuReaction?: boolean;
	fallbackToImage?: boolean;
	ignoreMuted?: boolean;
}>();

const react = inject(DI.mfmEmojiReactCallback, null);

const customEmojiName = computed(() => normalizeCustomEmojiName(props.name));
const isLocal = computed(() => isLocalCustomEmojiName(customEmojiName.value, props.host));
const emojiCodeToMute = computed(() => makeEmojiMuteKey(props));
const isMuted = checkEmojiMuted(emojiCodeToMute);
const shouldMute = computed(() => !props.ignoreMuted && isMuted.value);

const rawUrl = computed(() => {
	if (props.url) {
		return props.url;
	}
	if (isLocal.value) {
		return customEmojisMap.get(customEmojiName.value)?.url ?? null;
	}
	return getCustomEmojiImagePath(customEmojiName.value, props.host);
});

const url = computed(() => {
	if (rawUrl.value == null) return undefined;

	const proxied =
		(rawUrl.value.startsWith('/emoji/') || (props.useOriginalSize && isLocal.value))
			? rawUrl.value
			: getProxiedImageUrl(
				rawUrl.value,
				props.useOriginalSize ? undefined : 'emoji',
				false,
				true,
			);
	return prefer.s.disableShowingAnimatedImages
		? getStaticImageUrl(proxied)
		: proxied;
});

const alt = computed(() => `:${customEmojiName.value}:`);
const errored = ref(url.value == null);

// url が差し替わったときに前の絵文字の読み込み失敗状態を引きずらないようにする
// (errored が立っている間は <img> 自体が描画されないので load イベントでは復帰できない)
watch(url, (v) => {
	errored.value = v == null;
});

function onClick(ev: PointerEvent) {
	if (props.menu) {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			type: 'label',
			text: `:${props.name}:`,
		});

		if (isLocal.value) {
			menuItems.push({
				text: globalLocale.value.env.copy,
				icon: 'ti ti-copy',
				action: () => {
					copyToClipboard(`:${props.name}:`);
				},
			});
		}

		if (props.menuReaction && react) {
			menuItems.push({
				text: $locale.value.sfc.doReaction,
				icon: 'ti ti-plus',
				action: () => {
					react(`:${props.name}:`);
				},
			});
		}

		if (isLocal.value) {
			menuItems.push({
				type: 'divider',
			}, {
				text: globalLocale.value.env.info,
				icon: 'ti ti-info-circle',
				action: async () => {
					const { dispose } = os.popup(MkCustomEmojiDetailedDialog, {
						emoji: await misskeyApiGet('emoji', {
							name: customEmojiName.value,
						}),
					}, {
						closed: () => dispose(),
					});
				},
			});
		}

		if (isMuted.value) {
			menuItems.push({
				text: $locale.value.sfc.emojiUnmute,
				icon: 'ti ti-mood-smile',
				action: async () => {
					await unmute();
				},
			});
		} else {
			menuItems.push({
				text: $locale.value.sfc.emojiMute,
				icon: 'ti ti-mood-off',
				action: async () => {
					await mute();
				},
			});
		}

		if (isLocal.value) {
			menuItems.push({
				text: $locale.value.sfc.addToEmojiPalette,
				icon: 'ti ti-palette',
				action: () => {
					addToEmojiPalette(`:${props.name}:`);
				},
			});
		}

		if (($i?.isModerator ?? $i?.isAdmin) && isLocal.value) {
			menuItems.push({
				type: 'divider',
			}, {
				text: globalLocale.value.env.edit,
				icon: 'ti ti-pencil',
				action: async () => {
					await edit(props.name);
				},
			});
		}

		os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
	}
}

async function edit(name: string) {
	const emoji = await misskeyApi('emoji', {
		name: name,
	});
	const { dispose } = await os.popupAsyncWithDialog(import('@features/emojis/frontend/pages/emoji-edit-dialog.vue').then(x => x.default), {
		emoji: emoji,
	}, {
		closed: () => dispose(),
	});
}

function mute() {
	// 確認ダイアログを開いている間に props が変わっても、ダイアログに出したものと同じ絵文字を対象にする
	const targetEmojiCode = emojiCodeToMute.value;
	const titleEmojiName = isLocal.value
		? `:${customEmojiName.value}:`
		: targetEmojiCode;
	os.confirm({
		type: 'question',
		title: interpolateLocaleParameters($locale.value.sfc.muteX, { x: titleEmojiName }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		muteEmoji(targetEmojiCode);
	});
}

function unmute() {
	const targetEmojiCode = emojiCodeToMute.value;
	const titleEmojiName = isLocal.value
		? `:${customEmojiName.value}:`
		: targetEmojiCode;
	os.confirm({
		type: 'question',
		title: interpolateLocaleParameters($locale.value.sfc.unmuteX, { x: titleEmojiName }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		unmuteEmoji(targetEmojiCode);
	});
}

</script>

<style lang="scss" module>
.root {
	height: 2em;
	vertical-align: middle;
	-webkit-user-drag: none;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.2);
	}
}

.normal {
	height: 1.25em;
	vertical-align: -0.25em;

	&:hover {
		transform: none;
	}
}

.noStyle {
	height: auto !important;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"doReaction": "Afegeix una reacció ",
	"emojiUnmute": "Deixar de silenciar emojis",
	"emojiMute": "Silenciar emojis",
	"addToEmojiPalette": "Afegeix al calaix d'emojis",
	"muteX": "Silenciar {x}",
	"unmuteX": "Deixar de silenciar {x}"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"doReaction": "Reagieren",
	"emojiUnmute": "Emoji-Stummschaltung aufheben",
	"emojiMute": "Emoji stummschalten",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "{x} stummschalten",
	"unmuteX": "Stummschaltung von {x} aufheben"
}
</locale>

<locale lang="json" locale="en-US">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"doReaction": "Añadir reacción",
	"emojiUnmute": "No silenciar emoji",
	"emojiMute": "Silenciar emoji",
	"addToEmojiPalette": "Añadir a la paleta de emojis",
	"muteX": "Silenciar {x}",
	"unmuteX": "Dejar de silenciar {x}"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"doReaction": "Réagir",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"doReaction": "Tambahkan reaksi",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"doReaction": "Reagisci",
	"emojiUnmute": "De silenzia emoji",
	"emojiMute": "Silenzia emoji",
	"addToEmojiPalette": "Aggiungi alla tavolozza emoji",
	"muteX": "Silenzia {x}",
	"unmuteX": "De silenzia {x}"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"doReaction": "リアクションする",
	"emojiUnmute": "絵文字ミュート解除",
	"emojiMute": "絵文字ミュート",
	"addToEmojiPalette": "絵文字パレットに追加",
	"muteX": "{x}をミュート",
	"unmuteX": "{x}のミュートを解除"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"doReaction": "ツッコむで",
	"emojiUnmute": "絵文字ミュートやめたる",
	"emojiMute": "絵文字ミュート",
	"addToEmojiPalette": "絵文字パレットに追加",
	"muteX": "{x}をミュート",
	"unmuteX": "{x}のミュートやめたる"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"doReaction": "리액션 추가",
	"emojiUnmute": "이모티콘 뮤트 해제",
	"emojiMute": "이모티콘 뮤트",
	"addToEmojiPalette": "이모지 팔레트에 추가",
	"muteX": "{x}를 뮤트",
	"unmuteX": "{x}의 뮤트를 해제"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"doReaction": "Adicionar reação",
	"emojiUnmute": "Reativar emoji",
	"emojiMute": "Silenciar emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Silenciar {x}",
	"unmuteX": "Reativar {x}"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"doReaction": "Добавить реакцию",
	"emojiUnmute": "Показать эмодзи",
	"emojiMute": "Скрыть эмодзи",
	"addToEmojiPalette": "Добавить к палитре эмодзи",
	"muteX": "Скрыть {x}",
	"unmuteX": "Показать {x}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"doReaction": "เพิ่มรีแอคชั่น",
	"emojiUnmute": "เลิกปิดเสียงเอโมจิ",
	"emojiMute": "ปิดเสียงเอโมจิ",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "ปิดเสียง {x}",
	"unmuteX": "เลิกปิดเสียง {x}"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"doReaction": "Tepki ekle",
	"emojiUnmute": "Emoji ses aç",
	"emojiMute": "Emoji ses kapat",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Sessiz {x}",
	"unmuteX": "Sesi aç {x}"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"doReaction": "Додати реакцію",
	"emojiUnmute": "Показувати емодзі",
	"emojiMute": "Приховати емодзі",
	"addToEmojiPalette": "Додати до палітри емодзі",
	"muteX": "Приховати {x}",
	"unmuteX": "Показувати {x}"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"doReaction": "Add reaction",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"doReaction": "回应",
	"emojiUnmute": "取消屏蔽表情符号",
	"emojiMute": "屏蔽表情符号",
	"addToEmojiPalette": "添加至表情符号选择器",
	"muteX": "隐藏{x}",
	"unmuteX": "取消对{x}的隐藏"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"doReaction": "做出反應",
	"emojiUnmute": "表情符號解除靜音",
	"emojiMute": "表情符號靜音",
	"addToEmojiPalette": "增加表情符號調色盤",
	"muteX": "將 {x} 靜音",
	"unmuteX": "將 {x} 解除靜音"
}
</locale>
