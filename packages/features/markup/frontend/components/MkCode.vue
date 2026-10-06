<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.codeBlockRoot">
	<button v-if="copyButton" :class="[$style.codeBlockCopyButton, { [$style.withOuterStyle]: withOuterStyle }]" class="_button" @click="copy">
		<i class="ti ti-copy"></i>
	</button>
	<Suspense>
		<template #fallback>
			<pre
				class="_selectable"
				:class="[$style.codeBlockFallbackRoot, {
					[$style.outerStyle]: withOuterStyle,
				}]"
			><code :class="$style.codeBlockFallbackCode">Loading...</code></pre>
		</template>
		<XCode
			v-if="show && lang"
			class="_selectable"
			:code="code"
			:lang="lang"
			:withOuterStyle="withOuterStyle"
		/>
		<pre
			v-else-if="show"
			class="_selectable"
			:class="[$style.codeBlockFallbackRoot, {
				[$style.outerStyle]: withOuterStyle,
			}]"
		><code :class="$style.codeBlockFallbackCode">{{ code }}</code></pre>
		<button v-else :class="$style.codePlaceholderRoot" @click="show = true">
			<div :class="$style.codePlaceholderContainer">
				<div><i class="ti ti-code"></i> {{ $locale.sfc.code }}</div>
				<div>{{ $locale.sfc.clickToShow }}</div>
			</div>
		</button>
	</Suspense>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	code: string;
	forceShow?: boolean;
	copyButton?: boolean;
	withOuterStyle?: boolean;
	lang?: string;
}>(), {
	copyButton: true,
	forceShow: false,
	withOuterStyle: true,
});

const show = ref(props.forceShow === true ? true : !prefer.s.dataSaver.code);

const XCode = defineAsyncComponent(() => import('@features/markup/frontend/components/MkCode.core.vue'));

function copy() {
	copyToClipboard(props.code);
}
</script>

<style module lang="scss">
.codeBlockRoot {
	position: relative;
}

.codeBlockCopyButton {
	position: absolute;
	opacity: 0.5;

	top: 0;
	right: 0;

	&.withOuterStyle {
		top: 8px;
		right: 8px;
	}

	&:hover {
		opacity: 0.8;
	}
}

.codeBlockFallbackRoot {
	display: block;
	overflow-wrap: anywhere;
	overflow: auto;
}

.outerStyle.codeBlockFallbackRoot {
	background: var(--MI_THEME-bg);
	padding: 1em;
	margin: .5em 0;
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-divider);
}

.codeBlockFallbackCode {
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
}

.codePlaceholderRoot {
	display: block;
	width: 100%;
	border: none;
	outline: none;
  font: inherit;
	cursor: pointer;

	box-sizing: border-box;
	border-radius: 8px;
	padding: 24px;
	margin-top: 4px;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-bg);
}

.codePlaceholderContainer {
	text-align: center;
	font-size: 0.8em;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "code": "Code",
  "clickToShow": "اضغط للعرض"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "code": "Codi",
  "clickToShow": "Fes clic per mostrar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "code": "Code",
  "clickToShow": "Klikněte pro zobrazení"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "code": "Code",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "code": "Code",
  "clickToShow": "Zum Anzeigen anklicken"
}
</locale>

<locale locale="en-US" lang="json">
{
  "code": "Code",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "code": "Código",
  "clickToShow": "Haz clic para verlo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "code": "Code",
  "clickToShow": "Cliquer pour afficher"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "code": "Kode",
  "clickToShow": "Klik untuk melihat"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "code": "Codice",
  "clickToShow": "Media nascosto, cliccare solo se si intende vedere"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "code": "コード",
  "clickToShow": "クリックして表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "code": "コード",
  "clickToShow": "押したら見えるで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "code": "Code",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "code": "Code",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "code": "문자열",
  "clickToShow": "클릭하여 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "code": "Code",
  "clickToShow": "Klik om te bekijken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "code": "Code",
  "clickToShow": "Klikk for å vise"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "code": "Code",
  "clickToShow": "Kliknij, aby wyświetlić"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "code": "Código",
  "clickToShow": "Clique para ver"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "code": "Код",
  "clickToShow": "Нажмите для просмотра"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "code": "Code",
  "clickToShow": "Kliknutím zobrazíte"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "code": "โค้ด",
  "clickToShow": "คลิกเพื่อแสดง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "code": "Kod",
  "clickToShow": "Göstermek için tıklayın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "code": "Code",
  "clickToShow": "Click to show"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "code": "Код",
  "clickToShow": "Натисніть для перегляду"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "code": "Code",
  "clickToShow": "Nhấn để xem"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "code": "代码",
  "clickToShow": "点击以显示"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "code": "程式碼",
  "clickToShow": "點擊查看"
}
</locale>
