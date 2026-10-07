<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 動的ページのブロックの代替。利用できないということを表示する -->
<template>
<div :class="$style.root">
	<div :class="$style.heading"><i class="ti ti-dice-5"></i> {{ $locale.sfc.pagesBlocksDynamic }}</div>
	<I18n :src="$locale.sfc.pagesBlocksDynamicDescription" tag="div" :class="$style.text">
		<template #play>
			<MkA to="/play" class="_link">Play</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();
</script>

<style lang="scss" module>
.root {
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: var(--MI-margin);
	text-align: center;
}

.heading {
	font-weight: 700;
}

.text {
	font-size: 90%;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pagesBlocksDynamic": "Blocs dinàmics",
	"pagesBlocksDynamicDescription": "Aquest bloc és antic. Ara en endavant fes servir {play}"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pagesBlocksDynamic": "Dynamische Bausteine",
	"pagesBlocksDynamicDescription": "Dieser Baustein wurde abgeschafft. Bitte verwende von nun an {play}."
}
</locale>

<locale lang="json" locale="en-US">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pagesBlocksDynamic": "Bloques Dinámicos",
	"pagesBlocksDynamicDescription": "Los bloques dinámicos están obsoletos. A partir de ahora, utiliza {play} por favor."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pagesBlocksDynamic": "Blok Dinamis",
	"pagesBlocksDynamicDescription": "Blok ini telah dihapus. Mohon gunakan {play} dari sekarang."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pagesBlocksDynamic": "Riquadri dinamici",
	"pagesBlocksDynamicDescription": "Questo riquadro è obsoleto. Utilizza {play} da ora in poi."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pagesBlocksDynamic": "動的ブロック",
	"pagesBlocksDynamicDescription": "このブロックは廃止されています。今後は{play}を利用してください。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pagesBlocksDynamic": "動的ブロック",
	"pagesBlocksDynamicDescription": "このブロックは廃止されとるで。今後は{play}を利用してや。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pagesBlocksDynamic": "동적 블록",
	"pagesBlocksDynamicDescription": "이 블록은 폐지되었습니다. 이제부터 {play}에서 이용해 주세요."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pagesBlocksDynamic": "Blocos Dinâmicos",
	"pagesBlocksDynamicDescription": "Esse bloco foi abolido. Por favor, use {play} de agora em diante."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pagesBlocksDynamic": "บล็อกแบบไดนามิก",
	"pagesBlocksDynamicDescription": "บล็อกนี้ล้าสมัยแล้ว โปรดใช้ {play} แทน นับจากนี้เป็นต้นไป"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pagesBlocksDynamic": "Dinamik Bloklar",
	"pagesBlocksDynamicDescription": "Bu blok kaldırılmıştır. Bundan sonra lütfen {play} kullanın."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pagesBlocksDynamic": "Dynamic Blocks",
	"pagesBlocksDynamicDescription": "This block has been abolished. Please use {play} from now on."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pagesBlocksDynamic": "动态内容块",
	"pagesBlocksDynamicDescription": "这个内容块已经废弃。以后请使用{play}。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pagesBlocksDynamic": "動態方塊",
	"pagesBlocksDynamicDescription": "這個方塊已經廢止，現在開始請使用 {play}。"
}
</locale>
