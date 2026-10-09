<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkNotesTimeline :paginator="paginator"/>
	</div>
	<template v-if="$i" #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<MkButton rounded primary :class="$style.button" @click="post()"><i class="ti ti-pencil"></i>{{ $locale.sfc.postToHashtag }}</MkButton>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { store } from '@features/preferences/frontend/store.js';
import * as os from '@features/ui/frontend/os.js';
import { genEmbedCode } from '@features/web/frontend/utility/get-embed-code.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const props = defineProps<{
	tag: string;
}>();

const paginator = markRaw(new Paginator('notes/search-by-tag', {
	limit: 10,
	computedParams: computed(() => ({
		tag: props.tag,
	})),
}));

async function post() {
	store.set('postFormHashtags', props.tag);
	store.set('postFormWithHashtags', true);
	await os.post();
	store.set('postFormHashtags', '');
	store.set('postFormWithHashtags', false);
	paginator.reload();
}

const headerActions = computed<PageHeaderItem[]>(() => [{
	icon: 'ti ti-dots',
	text: $locale.value.sfc.more,
	handler: (ev) => {
		os.popupMenu([{
			text: $locale.value.sfc.embed,
			icon: 'ti ti-code',
			action: () => {
				genEmbedCode('tags', props.tag);
			},
		}], ev.currentTarget ?? ev.target);
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: props.tag,
	icon: 'ti ti-hash',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-top: solid 0.5px var(--MI_THEME-divider);
	display: flex;
}

.button {
	margin: 0 auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"postToHashtag": "انشر بهذا الوسم",
	"more": "المزيد!",
	"embed": "Embed"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"postToHashtag": "Pública a aquesta etiqueta",
	"more": "Més",
	"embed": "Incrustar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"postToHashtag": "Přidat příspěvek k tomuhle hastagu",
	"more": "Více!",
	"embed": "Embed"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "More!",
	"embed": "Embed"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"postToHashtag": "Mit diesem Hashtag senden",
	"more": "Mehr!",
	"embed": "Einbetten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "More!",
	"embed": "Embed"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"postToHashtag": "Publicar a este hashtag",
	"more": "¡Más!",
	"embed": "Insertar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"postToHashtag": "Publier avec ce hashtag",
	"more": "Plus !",
	"embed": "Embed"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"postToHashtag": "Catat ke tagar ini",
	"more": "Lainnya",
	"embed": "Embed"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"postToHashtag": "Pubblica a questo hashtag",
	"more": "Di più!",
	"embed": "Incorporare"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"postToHashtag": "このハッシュタグで投稿",
	"more": "もっと！",
	"embed": "埋め込み"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"postToHashtag": "このハッシュタグで投稿",
	"more": "他のん",
	"embed": "埋め込み"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "More!",
	"embed": "Embed"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "More!",
	"embed": "Embed"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"postToHashtag": "이 해시태그에 게시",
	"more": "더 보기!",
	"embed": "임베드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"postToHashtag": "Post naar deze hashtag",
	"more": "Meer!",
	"embed": "Embed"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "Mer!",
	"embed": "Embed"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"postToHashtag": "Postuj do tego hashtagu",
	"more": "Więcej!",
	"embed": "Embed"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"postToHashtag": "Publicar nesta Hashtag",
	"more": "Mais!",
	"embed": "Embed"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"postToHashtag": "Написать заметку с этим хештегом",
	"more": "Ещё!",
	"embed": "Вложение"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "Viac!",
	"embed": "Embed"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"postToHashtag": "โพสต์ไปที่แฮชแท็กนี้",
	"more": "เพิ่มเติม!",
	"embed": "ฝัง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"postToHashtag": "Bu hashtag'e gönder",
	"more": "Daha fazlası!",
	"embed": "Göm"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"postToHashtag": "Post to this hashtag",
	"more": "More!",
	"embed": "Embed"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"postToHashtag": "Опублікувати з цим хештегом",
	"more": "Бiльше!",
	"embed": "Вбудувати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"postToHashtag": "Đăng bài với hashtag này",
	"more": "Thêm nữa!",
	"embed": "Embed"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"postToHashtag": "发布至该话题",
	"more": "更多！",
	"embed": "嵌入"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"postToHashtag": "以此主題標籤發佈",
	"more": "更多！",
	"embed": "嵌入"
}
</locale>
