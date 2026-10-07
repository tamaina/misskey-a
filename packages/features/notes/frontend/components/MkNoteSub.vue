<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="note == null" :class="$style.deleted">
	{{ $locale.sfc.deletedNote }}
</div>
<div v-else-if="!muted" :class="[$style.root, { [$style.children]: depth > 1 }]">
	<div :class="$style.main">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<MkAvatar :class="$style.avatar" :user="note.user" link preview/>
		<div :class="$style.body">
			<MkNoteHeader :class="$style.header" :note="note" :mini="true"/>
			<div>
				<p v-if="note.cw != null" :class="$style.cw">
					<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :nyaize="'respect'"/>
					<MkCwButton v-model="showContent" :text="note.text" :files="note.files" :poll="note.poll"/>
				</p>
				<div v-show="note.cw == null || showContent">
					<MkSubNoteContent :class="$style.text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<template v-if="depth < 5">
		<MkNoteSub v-for="reply in replies" :key="reply.id" :note="reply" :class="$style.reply" :detail="true" :depth="depth + 1"/>
	</template>
	<div v-else :class="$style.more">
		<MkA class="_link" :to="notePage(note)">{{ $locale.sfc.continueThread }} <i class="ti ti-chevron-double-right"></i></MkA>
	</div>
</div>
<div v-else :class="$style.muted" @click="muted = false">
	<I18n :src="$locale.sfc.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="note.userId" :to="userPage(note.user)">
				<MkUserName :user="note.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNoteHeader from '@features/notes/frontend/components/MkNoteHeader.vue';
import MkSubNoteContent from '@features/notes/frontend/components/MkSubNoteContent.vue';
import MkCwButton from '@features/notes/frontend/components/MkCwButton.vue';
import { notePage } from '@features/notes/frontend/filters/note.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { $i } from '@features/auth/frontend/i.js';
import { userPage } from '@features/users/frontend/filters/user.js';
import { checkWordMute } from '@features/relationships/frontend/utility/check-word-mute.js';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note | null;
	detail?: boolean;

	// how many notes are in between this one and the note being viewed in detail
	depth?: number;
}>(), {
	depth: 1,
});

const muted = ref(props.note && $i ? checkWordMute(props.note, $i, $i.mutedWords) : false);

const showContent = ref(false);
const replies = ref<Misskey.entities.Note[]>([]);

if (props.detail && props.note) {
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

.deleted {
	text-align: center;
	padding: 8px !important;
	margin: 8px 8px 0 8px;
	--color: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.15));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color) 4px, var(--color) 14px);
	border-radius: 8px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"deletedNote": "ملاحظة محذوفة",
	"continueThread": "اعرض بقية النقاش",
	"userSaysSomething": "كتب {name} شيءً"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"deletedNote": "Publicacions eliminades",
	"continueThread": "Veure la continuació del fil",
	"userSaysSomething": "{name} n'ha dit alguna cosa"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"deletedNote": "Odstraněné příspěvky",
	"continueThread": "Zobrazit pokračování vlákna",
	"userSaysSomething": "{name} řekl/a něco"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"deletedNote": "Deleted note",
	"continueThread": "View thread continuation",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"deletedNote": "Gelöschte Notiz",
	"continueThread": "Weiteren Threadverlauf anzeigen",
	"userSaysSomething": "{name} hat etwas gesagt"
}
</locale>

<locale lang="json" locale="en-US">
{
	"deletedNote": "Deleted note",
	"continueThread": "View thread continuation",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"deletedNote": "Nota eliminada",
	"continueThread": "Ver la continuación del hilo",
	"userSaysSomething": "{name} dijo algo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"deletedNote": "Note supprimée",
	"continueThread": "Afficher la suite du fil",
	"userSaysSomething": "{name} a dit quelque chose"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"deletedNote": "Catatan yang dihapus",
	"continueThread": "Lihat lanjutan thread",
	"userSaysSomething": "{name} mengatakan sesuatu"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"deletedNote": "Nota eliminata",
	"continueThread": "Altre conversazioni",
	"userSaysSomething": "{name} ha scritto qualcosa"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"deletedNote": "削除されたノート",
	"continueThread": "さらにスレッドを見る",
	"userSaysSomething": "{name}が何かを言いました"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"deletedNote": "消された投稿",
	"continueThread": "さらにスレッドを見るで",
	"userSaysSomething": "{name}が何か言うとるわ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"deletedNote": "Deleted note",
	"continueThread": "View thread continuation",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"deletedNote": "Deleted note",
	"continueThread": "View thread continuation",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"deletedNote": "삭제된 노트",
	"continueThread": "글타래 더 보기",
	"userSaysSomething": "{name}님이 무언가를 말했습니다"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"deletedNote": "Verwijderde notitie",
	"continueThread": "Bekijk draad voortzetting",
	"userSaysSomething": "{name} zei iets"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"deletedNote": "Deleted note",
	"continueThread": "Vis fortsettelse av tråden",
	"userSaysSomething": "{name} sa noe"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"deletedNote": "Usunięty wpis",
	"continueThread": "Pokaż kontynuację wątku",
	"userSaysSomething": "{name} powiedział(-a) coś"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"deletedNote": "Postagem excluída",
	"continueThread": "Ver mais desta conversa",
	"userSaysSomething": "{name} disse algo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"deletedNote": "Удалённая заметка",
	"continueThread": "Показать следующие ответы",
	"userSaysSomething": "{name} что-то сообщает"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"deletedNote": "Odstránené príspevky",
	"continueThread": "Zobraziť pokračovanie vlákna",
	"userSaysSomething": "{name} niečo povedal/a"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"deletedNote": "โน้ตที่ถูกลบ",
	"continueThread": "ดูความต่อเนื่องเธรด",
	"userSaysSomething": "{name} พูดอะไรบางอย่าง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"deletedNote": "Silinen not",
	"continueThread": "Konunun devamını görüntüle",
	"userSaysSomething": "{name} bir şey söyledi."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"deletedNote": "Deleted note",
	"continueThread": "View thread continuation",
	"userSaysSomething": "{name} said something"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"deletedNote": "Видалена нотатка",
	"continueThread": "Показати продовження треду",
	"userSaysSomething": "{name} щось сказав(ла)"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"deletedNote": "Tút đã bị xóa",
	"continueThread": "Tiếp tục xem chuỗi tút",
	"userSaysSomething": "{name} nói gì đó"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"deletedNote": "已删除的帖子",
	"continueThread": "查看更多帖子",
	"userSaysSomething": "{name} 说了些什么，但被屏蔽词过滤了"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"deletedNote": "已刪除的貼文",
	"continueThread": "查看更多貼文",
	"userSaysSomething": "{name}說了什麼"
}
</locale>
