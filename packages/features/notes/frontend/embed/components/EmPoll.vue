<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<ul :class="$style.choices">
		<li v-for="(choice, i) in poll.choices" :key="i" :class="$style.choice">
			<div :class="$style.bg" :style="{ 'width': `${choice.votes / total * 100}%` }"></div>
			<span :class="$style.fg">
				<template v-if="choice.isVoted"><i class="ti ti-check" style="margin-right: 4px; color: var(--MI_THEME-accent);"></i></template>
				<EmMfm :text="choice.text" :plain="true"/>
				<span style="margin-left: 4px; opacity: 0.7;">({{ interpolateLocaleParameters($locale.sfc.pollVotesCount, { n: choice.votes }) }})</span>
			</span>
		</li>
	</ul>
	<p :class="$style.info">
		<span>{{ interpolateLocaleParameters($locale.sfc.pollTotalVotes, { n: total }) }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import EmMfm from '@features/markup/frontend/embed/components/EmMfm.js';

function sum(xs: number[]): number {
	return xs.reduce((a, b) => a + b, 0);
}

const props = defineProps<{
	noteId: string;
	poll: NonNullable<Misskey.entities.Note['poll']>;
}>();

const total = computed(() => sum(props.poll.choices.map(x => x.votes)));
</script>

<style lang="scss" module>
.choices {
	display: block;
	margin: 0;
	padding: 0;
	list-style: none;
}

.choice {
	display: block;
	position: relative;
	margin: 4px 0;
	padding: 4px;
	//border: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-accentedBg);
	border-radius: 4px;
	overflow: clip;
}

.bg {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: var(--MI_THEME-accent);
	background: linear-gradient(90deg,var(--MI_THEME-buttonGradateA),var(--MI_THEME-buttonGradateB));
	transition: width 1s ease;
}

.fg {
	position: relative;
	display: inline-block;
	padding: 3px 5px;
	background: var(--MI_THEME-panel);
	border-radius: 3px;
}

.info {
	color: var(--MI_THEME-fg);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pollVotesCount": "{n} أصوات",
	"pollTotalVotes": "المجموع {n} أصوات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pollVotesCount": "{n} vots",
	"pollTotalVotes": "{n} vots en total"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pollVotesCount": "{n} hlasů",
	"pollTotalVotes": "{n} hlasů celkově"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pollVotesCount": "{n} Stimmen",
	"pollTotalVotes": "Insgesamt {n} Stimmen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pollVotesCount": "{n} votos",
	"pollTotalVotes": "Total {n} votos"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes au total"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pollVotesCount": "{n} suara",
	"pollTotalVotes": "Total {n} suara"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pollVotesCount": "{n} voti",
	"pollTotalVotes": "Totale di {n} voti"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "計{n}票"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "計{n}票"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pollVotesCount": "{n}표",
	"pollTotalVotes": "총 {n}표"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pollVotesCount": "{n} stemmer",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pollVotesCount": "{n} głosów",
	"pollTotalVotes": "Łącznie {n} głosów"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pollVotesCount": "{n} votos",
	"pollTotalVotes": "{n} votos totais"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pollVotesCount": "Голосов: {n}",
	"pollTotalVotes": "Голосов всего: {n}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pollVotesCount": "{n} hlasov",
	"pollTotalVotes": "{n} hlasov celkom"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pollVotesCount": "{n} คะแนนเสียง",
	"pollTotalVotes": "ทั้งหมด {n} คะแนนเสียง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pollVotesCount": "{n} oy",
	"pollTotalVotes": "Toplam {n} oy"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pollVotesCount": "{n} votes",
	"pollTotalVotes": "{n} votes in total"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pollVotesCount": "{n} голосів",
	"pollTotalVotes": "Всього {n} голосів"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pollVotesCount": "{n} bình chọn",
	"pollTotalVotes": "{n} tổng bình chọn"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "总计{n}票"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pollVotesCount": "{n}票",
	"pollTotalVotes": "合計 {n} 票"
}
</locale>
