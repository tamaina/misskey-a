<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.children]: depth > 1 }]">
	<div :class="$style.main">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<EmAvatar :class="$style.avatar" :user="note.user" link preview/>
		<div :class="$style.body">
			<EmNoteHeader :class="$style.header" :note="note" :mini="true"/>
			<div>
				<p v-if="note.cw != null" :class="$style.cw">
					<EmMfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'"/>
					<button style="display: block; width: 100%;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? globalLocale.env._cw.hide : globalLocale.env._cw.show }}</button>
				</p>
				<div v-show="note.cw == null || showContent">
					<EmSubNoteContent :class="$style.text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<template v-if="depth < 5">
		<EmNoteSub v-for="reply in replies" :key="reply.id" :note="reply" :class="$style.reply" :detail="true" :depth="depth + 1"/>
	</template>
	<div v-else :class="$style.more">
		<EmA class="_link" :to="notePage(note)">{{ $locale.sfc.continueThread }} <i class="ti ti-chevron-double-right"></i></EmA>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import EmA from '@features/navigation/frontend/embed/components/EmA.vue';
import EmAvatar from '@features/users/frontend/embed/components/EmAvatar.vue';
import EmNoteHeader from '@features/notes/frontend/embed/components/EmNoteHeader.vue';
import EmSubNoteContent from '@features/notes/frontend/embed/components/EmSubNoteContent.vue';
import { notePage } from '@features/notes/frontend/shared/note.js';
import { misskeyApi } from '@features/api/frontend/embed/misskey-api.js';
import EmMfm from '@features/markup/frontend/embed/components/EmMfm.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	detail?: boolean;

	// how many notes are in between this one and the note being viewed in detail
	depth?: number;
}>(), {
	depth: 1,
});

const showContent = ref(false);
const replies = ref<Misskey.entities.Note[]>([]);

if (props.detail) {
	misskeyApi('notes/children', {
		noteId: props.note.id,
		limit: 5,
	}).then(res => {
		replies.value = res;
	});
}
</script>

<style lang="scss" module>
.root {
	padding: 16px 32px;
	font-size: 0.9em;
	position: relative;

	&.children {
		padding: 10px 0 0 16px;
		font-size: 1em;
	}
}

.main {
	display: flex;
}

.colorBar {
	position: absolute;
	top: 8px;
	left: 8px;
	width: 5px;
	height: calc(100% - 8px);
	border-radius: 999px;
	pointer-events: none;
}

.avatar {
	flex-shrink: 0;
	display: block;
	margin: 0 8px 0 0;
	width: 38px;
	height: 38px;
	border-radius: 8px;
}

.body {
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
	margin: 0;
	padding: 0;
}

.reply, .more {
	border-left: solid 0.5px var(--MI_THEME-divider);
	margin-top: 10px;
}

.more {
	padding: 10px 0 0 16px;
}

@container (max-width: 450px) {
	.root {
		padding: 14px 16px;

		&.children {
			padding: 10px 0 0 8px;
		}
	}
}

.muted {
	text-align: center;
	padding: 8px !important;
	border: 1px solid var(--MI_THEME-divider);
	margin: 8px 8px 0 8px;
	border-radius: 8px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"continueThread": "اعرض بقية النقاش"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"continueThread": "Veure la continuació del fil"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"continueThread": "Zobrazit pokračování vlákna"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"continueThread": "View thread continuation"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"continueThread": "Weiteren Threadverlauf anzeigen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"continueThread": "View thread continuation"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"continueThread": "Ver la continuación del hilo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"continueThread": "Afficher la suite du fil"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"continueThread": "Lihat lanjutan thread"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"continueThread": "Altre conversazioni"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"continueThread": "さらにスレッドを見る"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"continueThread": "さらにスレッドを見るで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"continueThread": "View thread continuation"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"continueThread": "View thread continuation"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"continueThread": "글타래 더 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"continueThread": "Bekijk draad voortzetting"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"continueThread": "Vis fortsettelse av tråden"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"continueThread": "Pokaż kontynuację wątku"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"continueThread": "Ver mais desta conversa"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"continueThread": "Показать следующие ответы"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"continueThread": "Zobraziť pokračovanie vlákna"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"continueThread": "ดูความต่อเนื่องเธรด"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"continueThread": "Konunun devamını görüntüle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"continueThread": "View thread continuation"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"continueThread": "Показати продовження треду"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"continueThread": "Tiếp tục xem chuỗi tút"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"continueThread": "查看更多帖子"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"continueThread": "查看更多貼文"
}
</locale>
