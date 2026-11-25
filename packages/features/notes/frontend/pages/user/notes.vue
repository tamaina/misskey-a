<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<div>
		<MkStickyContainer>
			<template #header>
				<MkTab
					v-model="tab"
					:tabs="[
						{ key: 'featured', label: $locale.sfc.featured },
						{ key: 'notes', label: globalLocale.env.notes },
						{ key: 'all', label: globalLocale.env.all },
						{ key: 'files', label: $locale.sfc.withFiles },
					]"
					:class="$style.tab"
				>
				</MkTab>
			</template>
			<MkNotesTimeline v-if="tab === 'featured'" :noGap="true" :paginator="featuredPaginator" :class="$style.tl"/>
			<MkNotesTimeline v-else :noGap="true" :paginator="notesPaginator" :class="$style.tl"/>
		</MkStickyContainer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import MkTab from '@features/ui/frontend/components/MkTab.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const tab = ref<'featured' | 'notes' | 'all' | 'files'>('all');

const featuredPaginator = markRaw(new Paginator('users/featured-notes', {
	limit: 10,
	params: {
		userId: props.user.id,
	},
}));

const notesPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	computedParams: computed(() => ({
		userId: props.user.id,
		withRenotes: tab.value === 'all',
		withReplies: tab.value === 'all',
		withChannelNotes: tab.value === 'all',
		withFiles: tab.value === 'files',
	})),
}));
</script>

<style lang="scss" module>
.tab {
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "featured": "المتداولة",
  "withFiles": "ذات مرفقات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "featured": "Destacat",
  "withFiles": "Incloure arxius"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "featured": "Oblíbené poznámky",
  "withFiles": "Včetně souborů"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "featured": "Featured",
  "withFiles": "Including files"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "featured": "Beliebt",
  "withFiles": "Notizen mit Dateien"
}
</locale>

<locale locale="en-US" lang="json">
{
  "featured": "Featured",
  "withFiles": "Including files"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "featured": "Destacados",
  "withFiles": "Adjuntos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "featured": "Tendances",
  "withFiles": "Avec fichiers joints"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "featured": "Sorotan",
  "withFiles": "Media"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "featured": "In evidenza",
  "withFiles": "Con allegati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "featured": "ハイライト",
  "withFiles": "ファイル付き"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "featured": "ハイライト",
  "withFiles": "ファイル付いとる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "featured": "Featured",
  "withFiles": "Including files"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "featured": "Featured",
  "withFiles": "Including files"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "featured": "유행",
  "withFiles": "미디어"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "featured": "Uitgelicht",
  "withFiles": "Bestanden toevoegen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "featured": "Featured",
  "withFiles": "Including files"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "featured": "Wyróżnione",
  "withFiles": "Media"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "featured": "Destaques",
  "withFiles": "Com arquivo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "featured": "Горячее",
  "withFiles": "Заметки с файлами"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "featured": "Obľúbené poznámky",
  "withFiles": "Vrátane súborov"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "featured": "ไฮไลท์",
  "withFiles": "มีไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "featured": "Öne çıkan",
  "withFiles": "Dosyalar dahil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "featured": "Featured",
  "withFiles": "Including files"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "featured": "Популярні",
  "withFiles": "Файли"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "featured": "Nổi bật",
  "withFiles": "Media"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "featured": "热门",
  "withFiles": "附件"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "featured": "精選",
  "withFiles": "附件"
}
</locale>
