<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.contents">
		<!--
			デッキUIが設定されている場合はデッキUIに戻れるようにする (ただし?zenが明示された場合は表示しない)
			See https://github.com/misskey-dev/misskey/issues/10905
		-->
		<button v-if="showDeckNav" class="_buttonPrimary" :class="$style.deckNav" @click="goToDeck">{{ $locale.sfc.goToDeck }}</button>

		<div style="flex: 1; min-height: 0;">
			<RouterView/>
		</div>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, ref } from 'vue';
import { instanceName, ui } from '@@/js/config.js';
import XCommon from './_common_/common.vue';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { DI } from '@features/ui/frontend/di.js';

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const pageMetadata = ref<null | PageMetadata>(null);

const showDeckNav = !(new URLSearchParams(window.location.search)).has('zen') && ui === 'deck';

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			window.document.title = pageMetadata.value.title;
		} else {
			window.document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

function goToDeck() {
	window.location.href = '/';
}
</script>

<style lang="scss" module>
.contents {
	display: flex;
	flex-direction: column;
	height: 100dvh;
}

.deckNav {
	padding: 4px;
}

.button {
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 60px;
	margin: auto;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	right: var(--MI-margin);
	bottom: calc(var(--MI-margin) + env(safe-area-inset-bottom, 0px));
}
</style>

<locale locale="ar-SA" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "goToDeck": "Tornar al tauler"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "goToDeck": "Zurück zum Deck"
}
</locale>

<locale locale="en-US" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "goToDeck": "Volver al Deck"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "goToDeck": "Torna al Deck"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "goToDeck": "デッキへ戻る"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "goToDeck": "デッキへ戻る"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "goToDeck": "덱으로 돌아가기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "goToDeck": "Voltar ao Deck"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "goToDeck": "กลับไปยังเด็ค"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "goToDeck": "Güverteye Dön"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "goToDeck": "Повернутися до Деки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "goToDeck": "Return to Deck"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "goToDeck": "返回至 Deck"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "goToDeck": "回到多欄模式"
}
</locale>
