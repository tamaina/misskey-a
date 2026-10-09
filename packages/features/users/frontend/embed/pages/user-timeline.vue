<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<EmTimelineContainer v-if="user && !prohibited" :showHeader="embedParams.header">
		<template #header>
			<div :class="$style.userHeader">
				<a :href="`/@${user.username}`" target="_blank" rel="noopener noreferrer" :class="$style.avatarLink">
					<EmAvatar :class="$style.avatar" :user="user"/>
				</a>
				<div :class="$style.headerTitle" @click="top">
					<I18n :src="$locale.sfc.noteOf" tag="div" class="_nowrap">
						<template #user>
							<a v-if="user != null" :href="`/@${user.username}`" target="_blank" rel="noopener noreferrer">
								<EmUserName :user="user"/>
							</a>
							<span v-else>{{ $locale.sfc.user }}</span>
						</template>
					</I18n>
					<div :class="$style.sub">{{ interpolateLocaleParameters($locale.sfc.fromX, { x: instanceName }) }}</div>
				</div>
				<a :href="url" :class="$style.instanceIconLink" target="_blank" rel="noopener noreferrer">
					<img
						:class="$style.instanceIcon"
						:src="serverMetadata.iconUrl || '/favicon.ico'"
					/>
				</a>
			</div>
		</template>
		<template #body>
			<EmNotes
				ref="notesEl"
				:pagination="pagination"
				:disableAutoLoad="!embedParams.autoload"
				:noGap="true"
				:ad="false"
			/>
		</template>
	</EmTimelineContainer>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { ref, computed, inject, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { url, instanceName } from '@features/boot/frontend/shared/config.js';
import { defaultEmbedParams } from '@features/web/frontend/shared/embed-page.js';
import { scrollToTop } from '@features/ui/frontend/shared/scroll.js';
import { isLink } from '@features/ui/frontend/shared/is-link.js';
import type { Paging } from '@features/ui/frontend/embed/components/EmPagination.vue';
import EmNotes from '@features/notes/frontend/embed/components/EmNotes.vue';
import EmAvatar from '@features/users/frontend/embed/components/EmAvatar.vue';
import EmUserName from '@features/users/frontend/embed/components/EmUserName.vue';
import I18n from '@features/runtime/frontend/embed/components/I18n.vue';
import XNotFound from '@features/web/frontend/embed/pages/not-found.vue';
import EmTimelineContainer from '@features/timelines/frontend/embed/components/EmTimelineContainer.vue';
import { misskeyApi } from '@features/api/frontend/embed/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { assertServerContext } from '@features/boot/frontend/embed/server-context.js';
import { DI } from '@features/boot/frontend/embed/di.js';

const props = defineProps<{
	userId: string;
}>();

const embedParams = inject(DI.embedParams, defaultEmbedParams);

const serverMetadata = inject(DI.serverMetadata)!;

const serverContext = inject(DI.serverContext)!;

const user = ref<Misskey.entities.UserLite | null>();

const prohibited = ref(false);

if (assertServerContext(serverContext, 'user')) {
	user.value = serverContext.user;
} else {
	user.value = await misskeyApi('users/show', {
		userId: props.userId,
	}).catch(() => {
		return null;
	});
}

if (user.value?.host != null) {
	// リモートサーバーのユーザーは弾く
	prohibited.value = true;
}

const pagination = computed(() => ({
	endpoint: 'users/notes',
	params: {
		userId: user.value?.id,
	},
} as Paging));

const notesEl = useTemplateRef('notesEl');

function top(ev: PointerEvent) {
	const target = ev.target as HTMLElement | null;
	if (target && isLink(target)) return;

	if (notesEl.value) {
		scrollToTop(notesEl.value.$el as HTMLElement, { behavior: 'smooth' });
	}
}
</script>

<style lang="scss" module>
.userHeader {
	padding: 8px 16px;
	display: flex;
	min-width: 0;
	align-items: center;
	gap: var(--MI-margin);
	overflow: hidden;

	.avatarLink {
		display: block;
	}

	.avatar {
		display: inline-block;
		width: 32px;
		height: 32px;
	}

	.headerTitle {
		flex-grow: 1;
		font-weight: 700;
		line-height: 1.1;
		min-width: 0;

		.sub {
			font-size: 0.8em;
			font-weight: 400;
			opacity: 0.7;
		}
	}

	.instanceIconLink {
		flex-shrink: 0;
		display: block;
		margin-left: auto;
		height: 24px;
	}

	.instanceIcon {
		height: 24px;
		border-radius: 3px;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"noteOf": "ملاحظات {user}",
	"user": "المستخدمون",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"noteOf": "Publicació de: {user}",
	"user": "Usuaris",
	"fromX": "De {x}"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"noteOf": "{user} poznámky",
	"user": "Uživatelé",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"noteOf": "Note by {user}",
	"user": "User",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"noteOf": "Notiz von {user}",
	"user": "Benutzer",
	"fromX": "Von {x}"
}
</locale>

<locale lang="json" locale="en-US">
{
	"noteOf": "Note by {user}",
	"user": "User",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"noteOf": "Notas de {user}",
	"user": "Usuarios",
	"fromX": "De {x}"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"noteOf": "Notes de {user}",
	"user": "Utilisateur·rice·s",
	"fromX": "De {x}"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"noteOf": "Catatan milik {user}",
	"user": "Pengguna",
	"fromX": "Dari {x}"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"noteOf": "Note di {user}",
	"user": "Profilo",
	"fromX": "Da {x}"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"noteOf": "{user}のノート",
	"user": "ユーザー",
	"fromX": "{x}から"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"noteOf": "{user}はんのノート",
	"user": "ユーザー",
	"fromX": "{x}から"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"noteOf": "Note by {user}",
	"user": "User",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"noteOf": "Note by {user}",
	"user": "ಬಳಕೆದಾರ",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"noteOf": "{user}의 노트",
	"user": "유저",
	"fromX": "{x}에서"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"noteOf": "Notitie van {user}",
	"user": "Gebruikers",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"noteOf": "Note by {user}",
	"user": "Brukere",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"noteOf": "Wpisy {user}",
	"user": "Użytkownicy",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"noteOf": "Publicação de {user}",
	"user": "Usuário",
	"fromX": "De {x}"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"noteOf": "Что пишет {user}",
	"user": "Пользователи",
	"fromX": "Из {x}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"noteOf": "Poznámky používateľa {user}",
	"user": "Používatelia",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"noteOf": "โน้ตของ {user}",
	"user": "ผู้ใช้",
	"fromX": "จาก {x}"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"noteOf": "{user} not'u",
	"user": "Kullanıcı",
	"fromX": "{x}'den"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"noteOf": "Note by {user}",
	"user": "User",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"noteOf": "Нотатка {user}",
	"user": "Користувачі",
	"fromX": "З {x}"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"noteOf": "Tút của {user}",
	"user": "Người dùng",
	"fromX": "From {x}"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"noteOf": "{user} 的帖子",
	"user": "用户",
	"fromX": "从 {x}"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"noteOf": "{user}的貼文",
	"user": "使用者",
	"fromX": "自 {x}"
}
</locale>
