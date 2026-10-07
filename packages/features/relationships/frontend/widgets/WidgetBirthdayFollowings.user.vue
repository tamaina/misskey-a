<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkA :to="userPage(item.user)" style="overflow: clip;">
		<MkUserCardMini :user="item.user" :withChart="false" style="text-overflow: ellipsis; background: inherit; border-radius: unset;">
			<template #sub>
				<span>{{ countdownDate }}</span>
				<span> / </span>
				<span class="_monospace">@{{ acct(item.user) }}</span>
			</template>
		</MkUserCardMini>
	</MkA>
	<button v-tooltip.noDelay="$locale.sfc.note" class="_button" :class="$style.post" @click="os.post({initialText: `@${item.user.username}${item.user.host ? `@${item.user.host}` : ''} `, instant: true})">
		<i class="ti-fw ti ti-confetti" :class="$style.postIcon"></i>
	</button>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import * as os from '@features/ui/frontend/os.js';
import { useLowresTime } from '@@/js/use-lowres-time.js';
import { userPage, acct } from '@features/users/frontend/filters/user.js';

const props = defineProps<{
	item: Misskey.entities.UsersGetFollowingUsersByBirthdayResponse[number];
}>();

const now = useLowresTime();
const nowDate = computed(() => {
	const date = new Date(now.value);
	date.setHours(0, 0, 0, 0);
	return date;
});
const birthdayDate = computed(() => {
	const [year, month, day] = props.item.birthday.split('-').map((v) => parseInt(v, 10));
	return new Date(year, month - 1, day, 0, 0, 0, 0);
});

const countdownDate = computed(() => {
	const days = Math.floor((birthdayDate.value.getTime() - nowDate.value.getTime()) / (1000 * 60 * 60 * 24));
	if (days === 0) {
		return $locale.value.sfc.today;
	} else if (days > 0) {
		return $l.value.sfc.days({ n: days });
	} else {
		return $l.value.sfc.daysAgo({ n: Math.abs(days) });
	}
});
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	display: grid;
	align-items: center;
	grid-template-columns: auto 56px;
}

.post {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 40px;
	width: 40px;
	margin-right: 16px;
	aspect-ratio: 1/1;
	border-radius: 100%;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));

	&:hover {
		background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
	}
}

.postIcon {
	color: var(--MI_THEME-fgOnAccent);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"note": "ملاحظة",
	"today": "اليوم",
	"days": "In {n}d",
	"daysAgo": "منذ {n} أيام"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"note": "Nota",
	"today": "Avui",
	"days": "En {n} dies",
	"daysAgo": "Fa {n} dies"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"note": "Poznámka",
	"today": "Dnes",
	"days": "In {n}d",
	"daysAgo": "Před {n}d"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"note": "Note",
	"today": "Today",
	"days": "In {n}d",
	"daysAgo": "{n}d ago"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"note": "Notiz",
	"today": "Heute",
	"days": "In {n} Tagen",
	"daysAgo": "vor {n} Tag(en)"
}
</locale>

<locale locale="en-US" lang="json">
{
	"note": "Note",
	"today": "Today",
	"days": "In {n}d",
	"daysAgo": "{n}d ago"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"note": "Nota",
	"today": "Hoy",
	"days": "En {n}d",
	"daysAgo": "Hace {n} días"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"note": "Note",
	"today": "Aujourd’hui",
	"days": "Dans {n}j",
	"daysAgo": "Il y a {n} jours"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"note": "Catatan",
	"today": "Hari ini",
	"days": "dalam {n} hari",
	"daysAgo": "{n} hari lalu"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"note": "Nota",
	"today": "Oggi",
	"days": "Tra {n} giorni",
	"daysAgo": "{n} gg fa"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"note": "ノート",
	"today": "今日",
	"days": "{n}日後",
	"daysAgo": "{n}日前"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"note": "ノート",
	"today": "今日",
	"days": "{n}日後",
	"daysAgo": "{n}日前"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"note": "Note",
	"today": "Today",
	"days": "In {n}d",
	"daysAgo": "{n}d ago"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"note": "Note",
	"today": "Today",
	"days": "In {n}d",
	"daysAgo": "{n}d ago"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"note": "노트",
	"today": "오늘",
	"days": "{n}일 후",
	"daysAgo": "{n}일 전"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"note": "Notitie",
	"today": "Vandaag",
	"days": "In {n}d",
	"daysAgo": "{n}d ago"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"note": "Note",
	"today": "I dag",
	"days": "In {n}d",
	"daysAgo": "{n}d siden"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"note": "Utwórz wpis",
	"today": "Dziś",
	"days": "In {n}d",
	"daysAgo": "{n} dni temu"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"note": "Publicar",
	"today": "Hoje",
	"days": "Em {n}d",
	"daysAgo": "{n}d atrás"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"note": "Заметка",
	"today": "Этот день",
	"days": "Через {n} сут",
	"daysAgo": "{n} сут назад"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"note": "Poznámka",
	"today": "Dnes",
	"days": "In {n}d",
	"daysAgo": "pred {n} dňami"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"note": " โน้ต",
	"today": "วันนี้",
	"days": "ใน {n} วัน",
	"daysAgo": "{n} วันที่ผ่านมา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"note": "Not",
	"today": "Bugün",
	"days": "{n} gün içinde",
	"daysAgo": "{n} gün"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"note": "Note",
	"today": "Today",
	"days": "In {n}d",
	"daysAgo": "{n}d ago"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"note": "Запис",
	"today": "День",
	"days": "In {n}d",
	"daysAgo": "{n}д тому"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"note": "Bài viết",
	"today": "Hôm nay",
	"days": "In {n}d",
	"daysAgo": "{n} ngày trước"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"note": "发帖",
	"today": "今天",
	"days": "{n}天后",
	"daysAgo": "{n}天前"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"note": "貼文",
	"today": "本日",
	"days": "{n}天後",
	"daysAgo": "{n}天前"
}
</locale>
