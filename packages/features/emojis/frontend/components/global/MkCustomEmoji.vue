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
import { computed, defineAsyncComponent, inject, ref } from 'vue';
import { normalizeCustomEmojiName, isLocalCustomEmojiName, getCustomEmojiImagePath } from '@features/emojis/frontend/shared/emoji-name.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { getProxiedImageUrl, getStaticImageUrl } from '@features/media/frontend/utility/media-proxy.js';
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
const emojiCodeToMute = makeEmojiMuteKey(props);
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

function onClick(ev: PointerEvent) {
	if (props.menu) {
		const menuItems: MenuItem[] = [];

		menuItems.push({
			type: 'label',
			text: `:${props.name}:`,
		});

		if (isLocal.value) {
			menuItems.push({
				text: $locale.value.sfc.copy,
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
				text: $locale.value.sfc.info,
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
				text: $locale.value.sfc.edit,
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
	const titleEmojiName = isLocal.value
		? `:${customEmojiName.value}:`
		: emojiCodeToMute;
	os.confirm({
		type: 'question',
		title: interpolateLocaleParameters($locale.value.sfc.muteX, { x: titleEmojiName }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		muteEmoji(emojiCodeToMute);
	});
}

function unmute() {
	const titleEmojiName = isLocal.value
		? `:${customEmojiName.value}:`
		: emojiCodeToMute;
	os.confirm({
		type: 'question',
		title: interpolateLocaleParameters($locale.value.sfc.unmuteX, { x: titleEmojiName }),
	}).then(({ canceled }) => {
		if (canceled) {
			return;
		}
		unmuteEmoji(emojiCodeToMute);
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
	"copy": "نسخ",
	"doReaction": "Add reaction",
	"info": "عن",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "التعديل",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"copy": "Copiar",
	"doReaction": "Afegeix una reacció ",
	"info": "Informació",
	"emojiUnmute": "Deixar de silenciar emojis",
	"emojiMute": "Silenciar emojis",
	"addToEmojiPalette": "Afegeix al calaix d'emojis",
	"edit": "Editar",
	"muteX": "Silenciar {x}",
	"unmuteX": "Deixar de silenciar {x}"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"copy": "Kopírovat",
	"doReaction": "Add reaction",
	"info": "Informace",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Upravit",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"copy": "Copy",
	"doReaction": "Add reaction",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Edit",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"copy": "Kopieren",
	"doReaction": "Reagieren",
	"info": "Über",
	"emojiUnmute": "Emoji-Stummschaltung aufheben",
	"emojiMute": "Emoji stummschalten",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Bearbeiten",
	"muteX": "{x} stummschalten",
	"unmuteX": "Stummschaltung von {x} aufheben"
}
</locale>

<locale lang="json" locale="en-US">
{
	"copy": "Copy",
	"doReaction": "Add reaction",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Edit",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"copy": "Copiar",
	"doReaction": "Añadir reacción",
	"info": "Información",
	"emojiUnmute": "No silenciar emoji",
	"emojiMute": "Silenciar emoji",
	"addToEmojiPalette": "Añadir a la paleta de emojis",
	"edit": "Editar",
	"muteX": "Silenciar {x}",
	"unmuteX": "Dejar de silenciar {x}"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"copy": "Copier",
	"doReaction": "Réagir",
	"info": "Informations",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Editer",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"copy": "Salin",
	"doReaction": "Tambahkan reaksi",
	"info": "Informasi",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Sunting",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"copy": "Copia",
	"doReaction": "Reagisci",
	"info": "Informazioni",
	"emojiUnmute": "De silenzia emoji",
	"emojiMute": "Silenzia emoji",
	"addToEmojiPalette": "Aggiungi alla tavolozza emoji",
	"edit": "Modifica",
	"muteX": "Silenzia {x}",
	"unmuteX": "De silenzia {x}"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"copy": "コピー",
	"doReaction": "リアクションする",
	"info": "情報",
	"emojiUnmute": "絵文字ミュート解除",
	"emojiMute": "絵文字ミュート",
	"addToEmojiPalette": "絵文字パレットに追加",
	"edit": "編集",
	"muteX": "{x}をミュート",
	"unmuteX": "{x}のミュートを解除"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"copy": "コピー",
	"doReaction": "ツッコむで",
	"info": "情報",
	"emojiUnmute": "絵文字ミュートやめたる",
	"emojiMute": "絵文字ミュート",
	"addToEmojiPalette": "絵文字パレットに追加",
	"edit": "編集",
	"muteX": "{x}をミュート",
	"unmuteX": "{x}のミュートやめたる"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"copy": "Copy",
	"doReaction": "Add reaction",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Edit",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"copy": "Copy",
	"doReaction": "Add reaction",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Edit",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"copy": "복사",
	"doReaction": "리액션 추가",
	"info": "정보",
	"emojiUnmute": "이모티콘 뮤트 해제",
	"emojiMute": "이모티콘 뮤트",
	"addToEmojiPalette": "이모지 팔레트에 추가",
	"edit": "편집",
	"muteX": "{x}를 뮤트",
	"unmuteX": "{x}의 뮤트를 해제"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"copy": "Kopiëren",
	"doReaction": "Add reaction",
	"info": "Over",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Bewerken",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"copy": "Kopier",
	"doReaction": "Add reaction",
	"info": "Infomasjon",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Rediger",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"copy": "Kopiuj",
	"doReaction": "Add reaction",
	"info": "Informacje",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Edytuj",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"copy": "Copiar",
	"doReaction": "Adicionar reação",
	"info": "Informações",
	"emojiUnmute": "Reativar emoji",
	"emojiMute": "Silenciar emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Editar",
	"muteX": "Silenciar {x}",
	"unmuteX": "Reativar {x}"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"copy": "Копировать",
	"doReaction": "Добавить реакцию",
	"info": "Описание",
	"emojiUnmute": "Показать эмодзи",
	"emojiMute": "Скрыть эмодзи",
	"addToEmojiPalette": "Добавить к палитре эмодзи",
	"edit": "Изменить",
	"muteX": "Скрыть {x}",
	"unmuteX": "Показать {x}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"copy": "Kopírovať",
	"doReaction": "Add reaction",
	"info": "Informácie",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Upraviť",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"copy": "คัดลอก",
	"doReaction": "เพิ่มรีแอคชั่น",
	"info": "เกี่ยวกับ",
	"emojiUnmute": "เลิกปิดเสียงเอโมจิ",
	"emojiMute": "ปิดเสียงเอโมจิ",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "แก้ไข",
	"muteX": "ปิดเสียง {x}",
	"unmuteX": "เลิกปิดเสียง {x}"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"copy": "Kopyala",
	"doReaction": "Tepki ekle",
	"info": "Hakkında",
	"emojiUnmute": "Emoji ses aç",
	"emojiMute": "Emoji ses kapat",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Düzenle",
	"muteX": "Sessiz {x}",
	"unmuteX": "Sesi aç {x}"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"copy": "Copy",
	"doReaction": "Add reaction",
	"info": "About",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Edit",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"copy": "Скопіювати",
	"doReaction": "Додати реакцію",
	"info": "Інформація",
	"emojiUnmute": "Показувати емодзі",
	"emojiMute": "Приховати емодзі",
	"addToEmojiPalette": "Додати до палітри емодзі",
	"edit": "Редагувати",
	"muteX": "Приховати {x}",
	"unmuteX": "Показувати {x}"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"copy": "Sao chép",
	"doReaction": "Add reaction",
	"info": "Giới thiệu",
	"emojiUnmute": "Unmute emoji",
	"emojiMute": "Mute emoji",
	"addToEmojiPalette": "Add to emoji palette",
	"edit": "Sửa",
	"muteX": "Mute {x}",
	"unmuteX": "Unmute {x}"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"copy": "复制",
	"doReaction": "回应",
	"info": "关于",
	"emojiUnmute": "取消屏蔽表情符号",
	"emojiMute": "屏蔽表情符号",
	"addToEmojiPalette": "添加至表情符号选择器",
	"edit": "编辑",
	"muteX": "隐藏{x}",
	"unmuteX": "取消对{x}的隐藏"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"copy": "複製",
	"doReaction": "做出反應",
	"info": "資訊",
	"emojiUnmute": "表情符號解除靜音",
	"emojiMute": "表情符號靜音",
	"addToEmojiPalette": "增加表情符號調色盤",
	"edit": "編輯",
	"muteX": "將 {x} 靜音",
	"unmuteX": "將 {x} 解除靜音"
}
</locale>
