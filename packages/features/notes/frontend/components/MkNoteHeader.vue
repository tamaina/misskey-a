<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<header :class="$style.root">
	<div v-if="mock" :class="$style.name">
		<MkUserName :user="note.user"/>
	</div>
	<MkA v-else v-user-preview="note.user.id" :class="$style.name" :to="userPage(note.user)">
		<MkUserName :user="note.user"/>
	</MkA>
	<div v-if="note.user.isBot" :class="$style.isBot">bot</div>
	<div :class="$style.username"><MkAcct :user="note.user"/></div>
	<div v-if="note.user.badgeRoles" :class="$style.badgeRoles">
		<img v-for="(role, i) in note.user.badgeRoles" :key="i" v-tooltip="role.name" :class="$style.badgeRole" :src="role.iconUrl!"/>
	</div>
	<div :class="$style.info">
		<div v-if="mock">
			<MkTime :time="note.createdAt" colored/>
		</div>
		<MkA v-else :to="notePage(note)">
			<MkTime :time="note.createdAt" colored/>
		</MkA>
		<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="copyLocaleDictionary(globalLocale.env._visibility)[note.visibility]">
			<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
			<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
			<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
		</span>
		<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="copyLocaleDictionary(globalLocale.env._visibility)['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
	</div>
</header>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { inject } from 'vue';
import * as Misskey from 'misskey-js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { notePage } from '@features/notes/frontend/shared/note.js';
import { userPage } from '@features/users/frontend/shared/user.js';
import { DI } from '@features/ui/frontend/di.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

defineProps<{
	note: Misskey.entities.Note;
}>();

const mock = inject(DI.mock, false);
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
}

.name {
	flex-shrink: 1;
	display: block;
	margin: 0 .5em 0 0;
	padding: 0;
	overflow: hidden;
	font-size: 1em;
	font-weight: bold;
	text-decoration: none;
	text-overflow: ellipsis;

	&:hover {
		text-decoration: underline;
	}
}

.isBot {
	flex-shrink: 0;
	align-self: center;
	margin: 0 .5em 0 0;
	padding: 1px 6px;
	font-size: 80%;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 3px;
}

.username {
	flex-shrink: 9999999;
	margin: 0 .5em 0 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.info {
	flex-shrink: 0;
	margin-left: auto;
	font-size: 0.9em;
}

.badgeRoles {
	margin: 0 .5em 0 0;
}

.badgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .badgeRole {
		margin-left: 0.2em;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{}
</locale>

<locale lang="json" locale="ca-ES">
{}
</locale>

<locale lang="json" locale="cs-CZ">
{}
</locale>

<locale lang="json" locale="da-DK">
{}
</locale>

<locale lang="json" locale="de-DE">
{}
</locale>

<locale lang="json" locale="en-US">
{}
</locale>

<locale lang="json" locale="es-ES">
{}
</locale>

<locale lang="json" locale="fr-FR">
{}
</locale>

<locale lang="json" locale="id-ID">
{}
</locale>

<locale lang="json" locale="it-IT">
{}
</locale>

<locale lang="json" locale="ja-JP">
{}
</locale>

<locale lang="json" locale="ja-KS">
{}
</locale>

<locale lang="json" locale="kab-KAB">
{}
</locale>

<locale lang="json" locale="kn-IN">
{}
</locale>

<locale lang="json" locale="ko-KR">
{}
</locale>

<locale lang="json" locale="nl-NL">
{}
</locale>

<locale lang="json" locale="no-NO">
{}
</locale>

<locale lang="json" locale="pl-PL">
{}
</locale>

<locale lang="json" locale="pt-PT">
{}
</locale>

<locale lang="json" locale="ru-RU">
{}
</locale>

<locale lang="json" locale="sk-SK">
{}
</locale>

<locale lang="json" locale="th-TH">
{}
</locale>

<locale lang="json" locale="tr-TR">
{}
</locale>

<locale lang="json" locale="ug-CN">
{}
</locale>

<locale lang="json" locale="uk-UA">
{}
</locale>

<locale lang="json" locale="vi-VN">
{}
</locale>

<locale lang="json" locale="zh-CN">
{}
</locale>

<locale lang="json" locale="zh-TW">
{}
</locale>
