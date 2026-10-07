<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.collapsed]: collapsed }]">
	<div>
		<span v-if="note.isHidden" style="opacity: 0.5">({{ $locale.sfc.private }})</span>
		<span v-if="note.deletedAt" style="opacity: 0.5">({{ $locale.sfc.deletedNote }})</span>
		<MkA v-if="note.replyId" :class="$style.reply" :to="`/notes/${note.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
		<Mfm v-if="note.text" :text="note.text" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
		<MkA v-if="note.renoteId" :class="$style.rp" :to="`/notes/${note.renoteId}`">RN: ...</MkA>
	</div>
	<details v-if="note.files && note.files.length > 0">
		<summary>({{ interpolateLocaleParameters($locale.sfc.withNFiles, { n: note.files.length }) }})</summary>
		<MkMediaList :mediaList="note.files" :user="note.user"/>
	</details>
	<details v-if="note.poll">
		<summary>{{ $locale.sfc.poll }}</summary>
		<MkPoll
			:noteId="note.id"
			:multiple="note.poll.multiple"
			:expiresAt="note.poll.expiresAt"
			:choices="note.poll.choices"
			:author="note.user"
			:emojiUrls="note.emojis"
		/>
	</details>
	<MkA v-if="note.hasPoll && note.poll == null" :to="`/notes/${note.id}`">({{ $locale.sfc.poll }})</MkA>
	<button v-if="isLong && collapsed" :class="$style.fade" class="_button" @click="collapsed = false">
		<span :class="$style.fadeLabel">{{ $locale.sfc.showMore }}</span>
	</button>
	<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
		<span :class="$style.showLessLabel">{{ $locale.sfc.showLess }}</span>
	</button>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { shouldCollapsed } from '@@/js/collapsed.js';
import MkMediaList from '@features/media/frontend/components/MkMediaList.vue';
import MkPoll from '@features/notes/frontend/components/MkPoll.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const isLong = shouldCollapsed(props.note, []);

const collapsed = ref(isLong);
</script>

<style lang="scss" module>
.root {
	overflow-wrap: break-word;

	&.collapsed {
		position: relative;
		max-height: 9em;
		overflow: clip;

		> .fade {
			display: block;
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));

			> .fadeLabel {
				display: inline-block;
				background: var(--MI_THEME-panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
			}

			&:hover {
				> .fadeLabel {
					background: var(--MI_THEME-panelHighlight);
				}
			}
		}
	}
}

.reply {
	margin-right: 6px;
	color: var(--MI_THEME-accent);
}

.rp {
	margin-left: 4px;
	font-style: oblique;
	color: var(--MI_THEME-renote);
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--MI-stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--MI_THEME-popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"private": "خاص",
	"deletedNote": "ملاحظة محذوفة",
	"withNFiles": "{n} ملف (ملفات)",
	"poll": "استطلاع رأي",
	"showMore": "عرض المزيد",
	"showLess": "اغلق"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"private": "Privat",
	"deletedNote": "Publicacions eliminades",
	"withNFiles": "{n} fitxer(s)",
	"poll": "Enquesta",
	"showMore": "Veure més",
	"showLess": "Mostrar menys"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"private": "Soukromý",
	"deletedNote": "Odstraněné příspěvky",
	"withNFiles": "{n} soubor(ů)",
	"poll": "Anketa",
	"showMore": "Zobrazit více",
	"showLess": "Zavřít"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"private": "Private",
	"deletedNote": "Deleted note",
	"withNFiles": "{n} file(s)",
	"poll": "Poll",
	"showMore": "Show more",
	"showLess": "Close"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"private": "Privat",
	"deletedNote": "Gelöschte Notiz",
	"withNFiles": "{n} Datei(en)",
	"poll": "Umfrage",
	"showMore": "Mehr anzeigen",
	"showLess": "Schließen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"private": "Private",
	"deletedNote": "Deleted note",
	"withNFiles": "{n} file(s)",
	"poll": "Poll",
	"showMore": "Show more",
	"showLess": "Close"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"private": "Privado",
	"deletedNote": "Nota eliminada",
	"withNFiles": "{n} archivos",
	"poll": "Encuesta",
	"showMore": "Ver más",
	"showLess": "Cerrar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"private": "Privé",
	"deletedNote": "Note supprimée",
	"withNFiles": "{n} fichier(s)",
	"poll": "Sondage",
	"showMore": "Voir plus",
	"showLess": "Fermer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"private": "Tersembunyi",
	"deletedNote": "Catatan yang dihapus",
	"withNFiles": "{n} berkas",
	"poll": "Angket",
	"showMore": "Selebihnya",
	"showLess": "Tutup"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"private": "Privato",
	"deletedNote": "Nota eliminata",
	"withNFiles": "{n} file in allegato",
	"poll": "Sondaggio",
	"showMore": "Espandi",
	"showLess": "Comprimi"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"private": "非公開",
	"deletedNote": "削除されたノート",
	"withNFiles": "{n}つのファイル",
	"poll": "アンケート",
	"showMore": "もっと見る",
	"showLess": "閉じる"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"private": "非公開",
	"deletedNote": "消された投稿",
	"withNFiles": "{n}個のファイル",
	"poll": "アンケート",
	"showMore": "まだまだあるで！",
	"showLess": "さいなら"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"private": "Private",
	"deletedNote": "Deleted note",
	"withNFiles": "{n} file(s)",
	"poll": "Poll",
	"showMore": "Wali ugar",
	"showLess": "Close"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"private": "Private",
	"deletedNote": "Deleted note",
	"withNFiles": "{n} file(s)",
	"poll": "Poll",
	"showMore": "ಇನ್ನಷ್ಟು ನೋಡು",
	"showLess": "Close"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"private": "비공개",
	"deletedNote": "삭제된 노트",
	"withNFiles": "{n}개의 파일",
	"poll": "투표",
	"showMore": "더 보기",
	"showLess": "닫기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"private": "Privé",
	"deletedNote": "Verwijderde notitie",
	"withNFiles": "{n} bestand(en)",
	"poll": "Peiling",
	"showMore": "Toon meer",
	"showLess": "Sluiten"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"private": "Private",
	"deletedNote": "Deleted note",
	"withNFiles": "{n} fil(er)",
	"poll": "Avstemning",
	"showMore": "Vis mer",
	"showLess": "Lukk"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"private": "Prywatne",
	"deletedNote": "Usunięty wpis",
	"withNFiles": "{n} plik(i)",
	"poll": "Ankieta",
	"showMore": "Załaduj więcej",
	"showLess": "Zamknij"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"private": "Privado",
	"deletedNote": "Postagem excluída",
	"withNFiles": "{n} arquivo(s)",
	"poll": "Enquetes",
	"showMore": "Ver mais",
	"showLess": "Fechar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"private": "Личное",
	"deletedNote": "Удалённая заметка",
	"withNFiles": "Файлы, {n} шт.",
	"poll": "Опрос",
	"showMore": "Показать ещё",
	"showLess": "Закрыть"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"private": "Súkromné",
	"deletedNote": "Odstránené príspevky",
	"withNFiles": "{n} súbor(ov)",
	"poll": "Hlasovanie",
	"showMore": "Zobraziť viac",
	"showLess": "Zavrieť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"private": "ส่วนตัว",
	"deletedNote": "โน้ตที่ถูกลบ",
	"withNFiles": "{n} ไฟล์",
	"poll": "โพล",
	"showMore": "แสดงเพิ่มเติม",
	"showLess": "ปิด"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"private": "Özel",
	"deletedNote": "Silinen not",
	"withNFiles": "{n} dosya",
	"poll": "Anket",
	"showMore": "Daha fazlasını göster",
	"showLess": "Kapat"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"private": "Private",
	"deletedNote": "Deleted note",
	"withNFiles": "{n} file(s)",
	"poll": "Poll",
	"showMore": "Show more",
	"showLess": "Close"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"private": "Приватне",
	"deletedNote": "Видалена нотатка",
	"withNFiles": "файли: {n}",
	"poll": "Опитування",
	"showMore": "Показати більше",
	"showLess": "Закрити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"private": "Riêng tư",
	"deletedNote": "Tút đã bị xóa",
	"withNFiles": "{n} tập tin",
	"poll": "Bình chọn",
	"showMore": "Xem thêm",
	"showLess": "Đóng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"private": "私密",
	"deletedNote": "已删除的帖子",
	"withNFiles": "{n} 个文件",
	"poll": "投票",
	"showMore": "查看更多",
	"showLess": "关闭"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"private": "私密",
	"deletedNote": "已刪除的貼文",
	"withNFiles": "{n} 個檔案",
	"poll": "票選活動",
	"showMore": "載入更多",
	"showLess": "關閉"
}
</locale>
