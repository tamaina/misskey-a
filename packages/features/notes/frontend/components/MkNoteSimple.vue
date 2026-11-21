<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="note" :class="$style.root">
	<MkAvatar :class="[$style.avatar, prefer.s.useStickyIcons ? $style.useSticky : null]" :user="note.user" link preview/>
	<div :class="$style.main">
		<MkNoteHeader :class="$style.header" :note="note" :mini="true"/>
		<div>
			<p v-if="note.cw != null" :class="$style.cw">
				<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
				<MkCwButton v-model="showContent" :text="note.text" :files="note.files" :poll="note.poll"/>
			</p>
			<div v-show="note.cw == null || showContent">
				<MkSubNoteContent :class="$style.text" :note="note"/>
			</div>
		</div>
	</div>
</div>
<div v-else :class="$style.deleted">
	{{ globalLocale.env.deletedNote }}
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNoteHeader from '@features/notes/frontend/components/MkNoteHeader.vue';
import MkSubNoteContent from '@features/notes/frontend/components/MkSubNoteContent.vue';
import MkCwButton from '@features/notes/frontend/components/MkCwButton.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	note: Misskey.entities.Note | null;
}>();

const showContent = ref(false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 0;
	padding: 0;
	font-size: 0.95em;
}

.avatar {
	flex-shrink: 0;
	display: block;
	margin: 0 10px 0 0;
	width: 34px;
	height: 34px;
	border-radius: 8px;

	&.useSticky {
		position: sticky !important;
		top: calc(16px + var(--MI-stickyTop, 0px));
	}
}

.main {
	flex: 1;
	min-width: 0;
}

.header {
	margin-bottom: 2px;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.text {
	cursor: default;
	margin: 0;
	padding: 0;
}

@container (min-width: 250px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 40px;
		height: 40px;
	}
}

@container (min-width: 350px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 44px;
		height: 44px;
	}
}

@container (min-width: 500px) {
	.avatar {
		margin: 0 12px 0 0;
		width: 48px;
		height: 48px;
	}
}

.deleted {
	text-align: center;
	padding: 8px !important;
	--color: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color) 4px, var(--color) 14px);
	border-radius: 8px;
}
</style>

<locale locale="ar-SA" lang="json">
{}
</locale>

<locale locale="ca-ES" lang="json">
{}
</locale>

<locale locale="cs-CZ" lang="json">
{}
</locale>

<locale locale="da-DK" lang="json">
{}
</locale>

<locale locale="de-DE" lang="json">
{}
</locale>

<locale locale="en-US" lang="json">
{}
</locale>

<locale locale="es-ES" lang="json">
{}
</locale>

<locale locale="fr-FR" lang="json">
{}
</locale>

<locale locale="id-ID" lang="json">
{}
</locale>

<locale locale="it-IT" lang="json">
{}
</locale>

<locale locale="ja-JP" lang="json">
{}
</locale>

<locale locale="ja-KS" lang="json">
{}
</locale>

<locale locale="kab-KAB" lang="json">
{}
</locale>

<locale locale="kn-IN" lang="json">
{}
</locale>

<locale locale="ko-KR" lang="json">
{}
</locale>

<locale locale="nl-NL" lang="json">
{}
</locale>

<locale locale="no-NO" lang="json">
{}
</locale>

<locale locale="pl-PL" lang="json">
{}
</locale>

<locale locale="pt-PT" lang="json">
{}
</locale>

<locale locale="ru-RU" lang="json">
{}
</locale>

<locale locale="sk-SK" lang="json">
{}
</locale>

<locale locale="th-TH" lang="json">
{}
</locale>

<locale locale="tr-TR" lang="json">
{}
</locale>

<locale locale="ug-CN" lang="json">
{}
</locale>

<locale locale="uk-UA" lang="json">
{}
</locale>

<locale locale="vi-VN" lang="json">
{}
</locale>

<locale locale="zh-CN" lang="json">
{}
</locale>

<locale locale="zh-TW" lang="json">
{}
</locale>
