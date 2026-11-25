<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<div v-if="user">
				<XFollowList :user="user" type="following"/>
			</div>
			<MkError v-else-if="error" @retry="fetchUser()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XFollowList from '@features/relationships/frontend/pages/user/follow-list.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	acct: string;
}>(), {
});

const user = ref<null | Misskey.entities.UserDetailed>(null);
const error = ref<any>(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user.value = null;
	misskeyApi('users/show', Misskey.acct.parse(props.acct)).then(u => {
		user.value = u;
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: globalLocale.value.env.user,
	icon: 'ti ti-user',
	...user.value ? {
		title: user.value.name ? `${user.value.name} (@${user.value.username})` : `@${user.value.username}`,
		subtitle: globalLocale.value.env.following,
		userName: user.value,
		avatar: user.value,
	} : {},
}));
</script>

<locale locale="ar-SA" lang="json">
{}
</locale>

<locale locale="ca-ES" lang="json">
{}
</locale>

<locale locale="cs-CZ" lang="json">
{}
</locale>

<locale locale="da-DK" lang="json">
{}
</locale>

<locale locale="de-DE" lang="json">
{}
</locale>

<locale locale="en-US" lang="json">
{}
</locale>

<locale locale="es-ES" lang="json">
{}
</locale>

<locale locale="fr-FR" lang="json">
{}
</locale>

<locale locale="id-ID" lang="json">
{}
</locale>

<locale locale="it-IT" lang="json">
{}
</locale>

<locale locale="ja-JP" lang="json">
{}
</locale>

<locale locale="ja-KS" lang="json">
{}
</locale>

<locale locale="kab-KAB" lang="json">
{}
</locale>

<locale locale="kn-IN" lang="json">
{}
</locale>

<locale locale="ko-KR" lang="json">
{}
</locale>

<locale locale="nl-NL" lang="json">
{}
</locale>

<locale locale="no-NO" lang="json">
{}
</locale>

<locale locale="pl-PL" lang="json">
{}
</locale>

<locale locale="pt-PT" lang="json">
{}
</locale>

<locale locale="ru-RU" lang="json">
{}
</locale>

<locale locale="sk-SK" lang="json">
{}
</locale>

<locale locale="th-TH" lang="json">
{}
</locale>

<locale locale="tr-TR" lang="json">
{}
</locale>

<locale locale="ug-CN" lang="json">
{}
</locale>

<locale locale="uk-UA" lang="json">
{}
</locale>

<locale locale="vi-VN" lang="json">
{}
</locale>

<locale locale="zh-CN" lang="json">
{}
</locale>

<locale locale="zh-TW" lang="json">
{}
</locale>
