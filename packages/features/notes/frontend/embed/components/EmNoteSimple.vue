<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<EmAvatar :class="$style.avatar" :user="note.user" link preview/>
	<div :class="$style.main">
		<EmNoteHeader :class="$style.header" :note="note" :mini="true"/>
		<div>
			<p v-if="note.cw != null" :class="$style.cw">
				<EmMfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
				<button style="display: block; width: 100%;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? globalLocale.env._cw.hide : globalLocale.env._cw.show }}</button>
			</p>
			<div v-show="note.cw == null || showContent">
				<EmSubNoteContent :class="$style.text" :note="note"/>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import EmAvatar from '@features/users/frontend/embed/components/EmAvatar.vue';
import EmNoteHeader from '@features/notes/frontend/embed/components/EmNoteHeader.vue';
import EmSubNoteContent from '@features/notes/frontend/embed/components/EmSubNoteContent.vue';
import EmMfm from '@features/markup/frontend/embed/components/EmMfm.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	note: Misskey.entities.Note;
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
	position: sticky !important;
	top: calc(16px + var(--MI-stickyTop, 0px));
	left: 0;
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
</style>

<locale lang="json" locale="ar-SA">
{}
</locale>

<locale lang="json" locale="ca-ES">
{}
</locale>

<locale lang="json" locale="cs-CZ">
{}
</locale>

<locale lang="json" locale="da-DK">
{}
</locale>

<locale lang="json" locale="de-DE">
{}
</locale>

<locale lang="json" locale="en-US">
{}
</locale>

<locale lang="json" locale="es-ES">
{}
</locale>

<locale lang="json" locale="fr-FR">
{}
</locale>

<locale lang="json" locale="id-ID">
{}
</locale>

<locale lang="json" locale="it-IT">
{}
</locale>

<locale lang="json" locale="ja-JP">
{}
</locale>

<locale lang="json" locale="ja-KS">
{}
</locale>

<locale lang="json" locale="kab-KAB">
{}
</locale>

<locale lang="json" locale="kn-IN">
{}
</locale>

<locale lang="json" locale="ko-KR">
{}
</locale>

<locale lang="json" locale="nl-NL">
{}
</locale>

<locale lang="json" locale="no-NO">
{}
</locale>

<locale lang="json" locale="pl-PL">
{}
</locale>

<locale lang="json" locale="pt-PT">
{}
</locale>

<locale lang="json" locale="ru-RU">
{}
</locale>

<locale lang="json" locale="sk-SK">
{}
</locale>

<locale lang="json" locale="th-TH">
{}
</locale>

<locale lang="json" locale="tr-TR">
{}
</locale>

<locale lang="json" locale="ug-CN">
{}
</locale>

<locale lang="json" locale="uk-UA">
{}
</locale>

<locale lang="json" locale="vi-VN">
{}
</locale>

<locale lang="json" locale="zh-CN">
{}
</locale>

<locale lang="json" locale="zh-TW">
{}
</locale>
