<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :inert="verifying" @click.capture="onClick" @submit.capture="onManualAction">
	<MkSignin :autoSet="autoSet" :message="message" :openOnRemote="openOnRemote" :initialUsername="initialUsername" @login="onManualLogin"/>
	<MkLoading v-if="verifying"/>
</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { browserSupportsWebAuthnAutofill } from '@simplewebauthn/browser';
import type * as Misskey from 'misskey-js';
import type { OpenOnRemoteOptions } from '@features/auth/frontend/utility/please-login.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { login } from '@features/auth/frontend/accounts.js';
import MkSignin from '@features/auth/frontend/components/MkSignin.vue';
import { createConditionalPasskeyLogin, getConditionalCredential } from '@features/auth/frontend/utility/conditional-passkey.js';

// Separate opt-in surface: existing callers continue using the ordinary MkSignin.
const props = withDefaults(defineProps<{
	enabled?: boolean;
	autoSet?: boolean;
	message?: string;
	openOnRemote?: OpenOnRemoteOptions;
	initialUsername?: string;
}>(), { enabled: false, autoSet: false, message: '', openOnRemote: undefined, initialUsername: undefined });
const emit = defineEmits<{
	(ev: 'login', result: Misskey.entities.SigninFlowResponse & { finished: true }): void;
}>();
const root = useTemplateRef('root');
const verifying = ref(false);
let manual = false;
const autofill = createConditionalPasskeyLogin({
	supported: browserSupportsWebAuthnAutofill,
	inputReady: () => root.value?.querySelector('input[autocomplete="username webauthn"]') != null,
	challenge: async signal => {
		const result = await misskeyApi('signin-with-passkey', {}, undefined, signal);
		if (!result.context || !result.option) throw new Error('Missing passkey challenge');
		return { context: result.context, option: result.option };
	},
	credential: getConditionalCredential,
	verify: async (context, credential) => {
		const result = await misskeyApi('signin-with-passkey', { context, credential });
		if (!result.signinResponse) throw new Error('Missing signin response');
		return result.signinResponse;
	},
	verifying: value => { verifying.value = value; },
	login: result => {
		emit('login', result);
		if (props.autoSet) void login(result.i);
	},
});

function onManualAction(event: Event) {
	if (verifying.value) {
		event.preventDefault();
		event.stopImmediatePropagation();
		return;
	}
	manual = true;
	autofill.cancel();
}

function onClick(event: MouseEvent) {
	if (event.target instanceof Element && event.target.closest('button, a')) onManualAction(event);
}

function onManualLogin(result: Misskey.entities.SigninFlowResponse & { finished: true }) {
	manual = true;
	autofill.cancel();
	emit('login', result);
}

watch(() => props.enabled, enabled => {
	if (enabled && !manual) void autofill.start();
	else autofill.cancel();
}, { immediate: true, flush: 'post' });
onBeforeUnmount(() => autofill.cancel());
</script>
