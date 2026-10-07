<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkAchievements :user="$i"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import MkAchievements from '@features/users/frontend/components/MkAchievements.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';

const $i = ensureSignin();

let timer: number | null;

function viewAchievements3min() {
	claimAchievement('viewAchievements3min');
}

onMounted(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onUnmounted(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
});

onActivated(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onDeactivated(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
});

definePage(() => ({
	title: $locale.value.sfc.achievements,
	icon: 'ti ti-medal',
}));
</script>

<style lang="scss" module>

</style>

<locale locale="ar-SA" lang="json">
{
	"achievements": "الإنجازات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"achievements": "Assoliments"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"achievements": "Úspěchy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"achievements": "Errungenschaften"
}
</locale>

<locale locale="en-US" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"achievements": "Logros"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"achievements": "Accomplissements"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"achievements": "Pencapaian"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"achievements": "Conquiste"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"achievements": "実績"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"achievements": "実績"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"achievements": "도전 과제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"achievements": "Prestasjoner"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"achievements": "Osiągnięcia"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"achievements": "Conquistas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"achievements": "Достижения"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"achievements": "ความสำเร็จ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"achievements": "Başarılar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"achievements": "Achievements"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"achievements": "Досягнення"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"achievements": "Thành tích"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"achievements": "成就"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"achievements": "成就"
}
</locale>
