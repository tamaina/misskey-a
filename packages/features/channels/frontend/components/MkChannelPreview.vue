<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="position: relative;">
	<MkA :to="`/channels/${channel.id}`" class="eftoefju _panel" @click="updateLastReadedAt">
		<div class="banner" :style="bannerStyle">
			<div class="fade"></div>
			<div class="name"><i class="ti ti-device-tv"></i> {{ channel.name }}</div>
			<div v-if="channel.isSensitive" class="sensitiveIndicator">{{ globalLocale.env.sensitive }}</div>
			<div class="status">
				<div>
					<i class="ti ti-users ti-fw"></i>
					<I18n :src="$locale.sfc.usersCount" tag="span" style="margin-left: 4px;">
						<template #n>
							<b>{{ channel.usersCount }}</b>
						</template>
					</I18n>
				</div>
				<div>
					<i class="ti ti-pencil ti-fw"></i>
					<I18n :src="$locale.sfc.notesCount" tag="span" style="margin-left: 4px;">
						<template #n>
							<b>{{ channel.notesCount }}</b>
						</template>
					</I18n>
				</div>
				<div v-if="$i != null && $i.id === channel.userId" style="color: var(--MI_THEME-warn)">
					<i class="ti ti-user-star ti-fw"></i>
					<span style="margin-left: 4px;">{{ $locale.sfc.youAreAdmin }}</span>
				</div>
			</div>
		</div>
		<article v-if="channel.description">
			<p :title="channel.description">{{ channel.description.length > 85 ? channel.description.slice(0, 85) + '…' : channel.description }}</p>
		</article>
		<footer>
			<span v-if="channel.lastNotedAt">
				{{ globalLocale.env.updatedAt }}: <MkTime :time="channel.lastNotedAt"/>
			</span>
		</footer>
	</MkA>
	<div
		v-if="channel.lastNotedAt && (channel.isFavorited || channel.isFollowing) && (!lastReadedAt || Date.parse(channel.lastNotedAt) > lastReadedAt)"
		class="indicator"
	></div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { $i } from '@features/auth/frontend/i.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	channel: Misskey.entities.Channel;
}>();

const getLastReadedAt = (): number | null => {
	return miLocalStorage.getItemAsJson(`channelLastReadedAt:${props.channel.id}`) ?? null;
};

const lastReadedAt = ref(getLastReadedAt());

watch(() => props.channel.id, () => {
	lastReadedAt.value = getLastReadedAt();
});

const updateLastReadedAt = () => {
	lastReadedAt.value = props.channel.lastNotedAt ? Date.parse(props.channel.lastNotedAt) : Date.now();
};

const bannerStyle = computed(() => {
	if (props.channel.bannerUrl) {
		return { backgroundImage: `url(${props.channel.bannerUrl})` };
	} else {
		return { backgroundColor: '#4c5e6d' };
	}
});
</script>

<style lang="scss" scoped>
.eftoefju {
	display: block;
	position: relative;
	overflow: hidden;
	width: 100%;

	&:hover {
		text-decoration: none;
	}

	&:focus-within {
		outline: none;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border-radius: inherit;
			pointer-events: none;
			box-shadow: inset 0 0 0 2px var(--MI_THEME-focus);
		}
	}

	> .banner {
		position: relative;
		width: 100%;
		height: 200px;
		background-position: center;
		background-size: cover;

		> .fade {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));
		}

		> .name {
			position: absolute;
			top: 16px;
			left: 16px;
			max-width: calc(100% - 32px);
			padding: 12px 16px;
			box-sizing: border-box;
			background: rgba(0, 0, 0, 0.7);
			color: #fff;
			font-size: 1.2em;
		}

		> .status {
			position: absolute;
			z-index: 1;
			bottom: 16px;
			right: 16px;
			padding: 8px 12px;
			font-size: 80%;
			background: rgba(0, 0, 0, 0.7);
			border-radius: 6px;
			color: #fff;
		}

		> .sensitiveIndicator {
			position: absolute;
			z-index: 1;
			bottom: 16px;
			left: 16px;
			background: rgba(0, 0, 0, 0.7);
			color: var(--MI_THEME-warn);
			border-radius: 6px;
			font-weight: bold;
			font-size: 1em;
			padding: 4px 7px;
		}
	}

	> article {
		padding: 16px;

		> p {
			margin: 0;
			font-size: 1em;
		}
	}

	> footer {
		padding: 12px 16px;
		border-top: solid 0.5px var(--MI_THEME-divider);

		> span {
			opacity: 0.7;
			font-size: 0.9em;
		}
	}

	@media (max-width: 550px) {
		font-size: 0.9em;

		> .banner {
			height: 80px;

			> .status {
				display: none;
			}
		}

		> article {
			padding: 12px;
		}

		> footer {
			display: none;
		}
	}

	@media (max-width: 500px) {
		font-size: 0.8em;

		> .banner {
			height: 70px;
		}

		> article {
			padding: 8px;
		}
	}
}

.indicator {
	position: absolute;
	top: 0;
	right: 0;
	transform: translate(25%, -25%);
	background-color: var(--MI_THEME-accent);
	border: solid var(--MI_THEME-bg) 4px;
	border-radius: 100%;
	width: 1.5rem;
	height: 1.5rem;
	aspect-ratio: 1 / 1;
}

</style>

<locale locale="ar-SA" lang="json">
{
	"usersCount": "{n} منتسب",
	"notesCount": "{n} ملاحظة",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "Ets l'administrador "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"usersCount": "{n} Účastníků",
	"notesCount": "{n} Poznámek",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"usersCount": "{n} Teilnehmer",
	"notesCount": "{n} Notizen",
	"youAreAdmin": "Sie sind ein Administrator"
}
</locale>

<locale locale="en-US" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"usersCount": "{n} participantes",
	"notesCount": "{n} notas",
	"youAreAdmin": "Eres administrador."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"usersCount": "{n} Participant·e·s",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"usersCount": "{n} Partisipan",
	"notesCount": "terdapat {n} catatan",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"usersCount": "{n} partecipanti",
	"notesCount": "{n} note",
	"youAreAdmin": "Sei un amministratore"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"usersCount": "{n}人が参加中",
	"notesCount": "{n}投稿があります",
	"youAreAdmin": "あなたは管理者です"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"usersCount": "{n}人が参加しとる",
	"notesCount": "{n}こ投稿があるで",
	"youAreAdmin": "あんた、管理者やで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"usersCount": "{n}명 참여 중",
	"notesCount": "{n}노트",
	"youAreAdmin": "당신은 관리자입니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"usersCount": "{n} uczestnicy",
	"notesCount": "{n} wpisy",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"usersCount": "{n} usuários ativos",
	"notesCount": "{n} notas",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"usersCount": "Участников: {n}",
	"notesCount": "Заметок: {n}",
	"youAreAdmin": "Вы администратор"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"usersCount": "{n} účastníkov",
	"notesCount": "{n} poznámok",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"usersCount": "{n} ผู้เข้าร่วม",
	"notesCount": "มี {n} โน้ต",
	"youAreAdmin": "คุณคือผู้ดูแลระบบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"usersCount": "{n} Katılımcılar",
	"notesCount": "{n} Notlar",
	"youAreAdmin": "Siz yöneticisiniz."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"usersCount": "{n} Participants",
	"notesCount": "{n} Notes",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"usersCount": "{n} учасників",
	"notesCount": "{n} дописів",
	"youAreAdmin": "Ви адмін"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"usersCount": "{n} Thành viên",
	"notesCount": "{n} Tút",
	"youAreAdmin": "You are admin"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"usersCount": "{n} 人参与",
	"notesCount": "{n} 篇帖子",
	"youAreAdmin": "你是管理员"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"usersCount": "有 {n} 人參與",
	"notesCount": "有 {n} 篇貼文",
	"youAreAdmin": "您是管理員"
}
</locale>
