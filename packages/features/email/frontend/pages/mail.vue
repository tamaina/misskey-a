<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_pageScrollable"><MkMailbox :verificationCode="verificationCode"/></div>
</template>

<script lang="ts" setup>
import { nextTick, onActivated, onMounted } from 'vue';
import { useLocale } from 'virtual:vite-vue-internationalization';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { keepForwardingCode, takeForwardingCode } from '../confirmation.js';
import MkMailbox from '../components/MkMailbox.vue';
import type { Locale } from 'i18n';

const props = defineProps<{ verify?: string }>();
const router = useRouter();
const verificationCode = props.verify ?? takeForwardingCode(router);

// Capture the value before replacing the route; never confirm from a GET/link.
function clearVerificationQuery() {
	if (props.verify === undefined || !new URL(router.getCurrentFullPath(), window.location.origin).searchParams.has('verify')) return;
	keepForwardingCode(router, verificationCode);
	router.replaceByPath('/my/mail');
	void nextTick(() => { takeForwardingCode(router); });
}

onMounted(clearVerificationQuery);
// Stacking views can reactivate the old query-bearing tab from their own cache.
onActivated(clearVerificationQuery);

const globalLocale = useLocale<Locale>(import.meta.url);
definePage(() => ({ title: globalLocale.value.env._mail.title, icon: 'ti ti-mail' }));
</script>
