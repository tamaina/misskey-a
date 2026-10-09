<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- このコンポーネントの要素のclassは親から利用されるのでむやみに弄らないこと -->
<!-- フォルダの中にはカスタム絵文字だけ（Unicode絵文字もこっち） -->
<section v-if="!hasChildSection" v-panel style="border-radius: 6px; border-bottom: 0.5px solid var(--MI_THEME-divider);">
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> (<i class="ti ti-icons"></i>:{{ emojis.length }})
	</header>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			:data-emoji="emoji"
			class="_button item"
			:disabled="disabledEmojis?.value.includes(emoji)"
			@pointerenter="computeButtonTitle"
			@click="emit('chosen', emoji, $event)"
		>
			<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true" :fallbackToImage="true"/>
			<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
<!-- フォルダの中にはカスタム絵文字やフォルダがある -->
<section v-else v-panel style="border-radius: 6px; border-bottom: 0.5px solid var(--MI_THEME-divider);">
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> (<i class="ti ti-folder ti-fw"></i>:{{ customEmojiTree?.length }} <i class="ti ti-icons ti-fw"></i>:{{ emojis.length }})
	</header>
	<div v-if="shown" style="padding-left: 9px;">
		<MkEmojiPickerSection
			v-for="child in customEmojiTree"
			:key="`custom:${child.value}`"
			:initialShown="initialShown"
			:emojis="computed(() => customEmojis.filter(e => e.category === child.category).map(e => `:${e.name}:`))"
			:hasChildSection="child.children.length !== 0"
			:customEmojiTree="child.children"
			@chosen="nestedChosen"
		>
			{{ child.value || $locale.sfc.other }}
		</MkEmojiPickerSection>
	</div>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			:data-emoji="emoji"
			class="_button item"
			:disabled="disabledEmojis?.value.includes(emoji)"
			@pointerenter="computeButtonTitle"
			@click="emit('chosen', emoji, $event)"
		>
			<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
			<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { getEmojiName } from '@features/emojis/frontend/shared/emojilist.js';
import type { Ref } from 'vue';
import type { CustomEmojiFolderTree } from '@features/emojis/frontend/shared/emojilist.js';
import { customEmojis } from '@features/emojis/frontend/custom-emojis.js';
import MkEmojiPickerSection from '@features/emojis/frontend/components/MkEmojiPicker.section.vue';

const props = defineProps<{
	emojis: string[] | Ref<string[]>;
	disabledEmojis?: Ref<string[]>;
	initialShown?: boolean;
	hasChildSection?: boolean;
	customEmojiTree?: CustomEmojiFolderTree[];
}>();

const emit = defineEmits<{
	(ev: 'chosen', v: string, event: PointerEvent): void;
}>();

const emojis = computed(() => Array.isArray(props.emojis) ? props.emojis : props.emojis.value);

const shown = ref(!!props.initialShown);

/** @see MkEmojiPicker.vue */
function computeButtonTitle(ev: PointerEvent): void {
	const elm = ev.target as HTMLElement;
	const emoji = elm.dataset.emoji as string;
	elm.title = getEmojiName(emoji);
}

function nestedChosen(emoji: string, ev: PointerEvent) {
	emit('chosen', emoji, ev);
}
</script>

<locale locale="ar-SA" lang="json">
{
  "other": "منوعات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "other": "Altres"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "other": "Ostatní"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "other": "Other"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "other": "Anderes"
}
</locale>

<locale locale="en-US" lang="json">
{
  "other": "Other"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "other": "Otro"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "other": "Autre"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "other": "Lainnya"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "other": "Eccetera"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "other": "その他"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "other": "その他"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "other": "Wiyyaḍ"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "other": "Other"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "other": "기타"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "other": "Ander"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "other": "Andre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "other": "Inne"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "other": "Outros"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "other": "Другие"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "other": "Ostatní"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "other": "อื่น ๆ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "other": "Diğer"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "other": "Other"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "other": "Інше"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "other": "Khác"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "other": "其他"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "other": "其他"
}
</locale>
