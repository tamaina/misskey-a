<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<input v-model="query" :class="$style.input" type="search" :placeholder="q" :aria-label="engineName">
	<button :class="$style.button" @click="search"><i class="ti ti-search"></i> <MkMfmSearchLabel :engine="engineName"/></button>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { buildSearchUrl, searchEngineName } from '@features/integrations/frontend/utility/mfm-search-engines.js';
import MkMfmSearchLabel from './MkMfmSearchLabel.vue';

const props = defineProps<{
	q: string;
}>();

const query = ref(props.q);
const engineName = computed(() => searchEngineName(prefer.r.mfmSearchEngine.value, prefer.r.mfmSearchEngineCustomUrl.value));

watch(() => props.q, (v) => {
	query.value = v;
});

const search = () => {
	window.open(buildSearchUrl(prefer.s.mfmSearchEngine, prefer.s.mfmSearchEngineCustomUrl, query.value), '_blank', 'noopener');
};
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: 8px 0;
}

.input {
	flex-shrink: 1;
	padding: 10px;
	width: 100%;
	height: 40px;
	font-size: 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 4px 0 0 4px;
	-webkit-appearance: textfield;
}

.button {
	flex-shrink: 0;
	margin: 0;
	padding: 0 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-left: none;
	border-radius: 0 4px 4px 0;

	&:active {
		box-shadow: 0 2px 4px rgba(#000, 0.15) inset;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
  "searchByGoogle": "غوغل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "searchByGoogle": "Cercar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "searchByGoogle": "Vyhledávání"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "searchByGoogle": "Search"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "searchByGoogle": "Suchen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "searchByGoogle": "Search"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "searchByGoogle": "Buscar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "searchByGoogle": "Google"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "searchByGoogle": "Penelusuran"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "searchByGoogle": "Cerca"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "searchByGoogle": "検索"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "searchByGoogle": "探す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "searchByGoogle": "Nadi"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "searchByGoogle": "ಹುಡುಕು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "searchByGoogle": "검색"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "searchByGoogle": "Zoeken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "searchByGoogle": "Søk"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "searchByGoogle": "Szukaj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "searchByGoogle": "Pesquisar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "searchByGoogle": "Поиск"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "searchByGoogle": "Hľadať cez Google"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "searchByGoogle": "ค้นหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "searchByGoogle": "Arama"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "searchByGoogle": "ئىزدەش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "searchByGoogle": "Пошук"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "searchByGoogle": "Google"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "searchByGoogle": "Google"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "searchByGoogle": "搜尋"
}
</locale>
