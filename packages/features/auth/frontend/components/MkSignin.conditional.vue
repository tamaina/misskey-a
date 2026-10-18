<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :inert="verifying" @click.capture="onClick" @submit.capture="onManualAction">
	<MkSignin ref="manualSignin" :autoSet="autoSet" :message="message" :openOnRemote="openOnRemote" :initialUsername="initialUsername" @login="onManualLogin" @manual="cancelForManual"/>
	<MkLoading v-if="verifying"/>
</div>
</template>

<script setup lang="ts">
import { $i } from '../i.js';
import { onActivated, onBeforeUnmount, onDeactivated, ref, useTemplateRef, watch } from 'vue';
import { browserSupportsWebAuthnAutofill } from '@simplewebauthn/browser';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { login } from '@features/auth/frontend/accounts.js';
import MkSignin from '@features/auth/frontend/components/MkSignin.vue';
import { createConditionalPasskeyLogin, getConditionalCredential } from '@features/auth/frontend/utility/conditional-passkey.js';
import type { OpenOnRemoteOptions } from '@features/auth/frontend/utility/please-login.js';
import type * as Misskey from 'misskey-js';

// The login dialog and named authorization entry explicitly opt into this surface.
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
const manualSignin = useTemplateRef<InstanceType<typeof MkSignin>>('manualSignin');
const verifying = ref(false);
let manual = false;
let suspended = false;
let generation = 0;
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
		const run = generation;
		const result = await misskeyApi('signin-with-passkey', { context, credential });
		if (run !== generation || suspended || manual || !props.enabled) throw new Error('Stale passkey result');
		if (result.passwordFlowRequired) {
			manual = true;
			cancelAutofill();
			await manualSignin.value?.requirePasswordFlow?.();
			throw new Error('Named password flow required');
		}
		if (!result.signinResponse) throw new Error('Missing signin response');
		return result.signinResponse;
	},
	verifying: value => { verifying.value = value; },
	login: result => {
		emit('login', result);
		if (props.autoSet) void login(result.i);
	},
});

function cancelAutofill() { generation++; autofill.cancel(); }
function cancelForManual() { manual = true; cancelAutofill(); }
const actor = () => JSON.stringify([$i?.id ?? null, $i?.token ?? null]);
watch(actor, cancelForManual, { flush: 'sync' });
defineExpose({ cancel: cancelForManual });

function onManualAction(event: Event) {
	if (verifying.value) {
		event.preventDefault();
		event.stopImmediatePropagation();
		return;
	}
	cancelForManual();
}

function onClick(event: MouseEvent) {
	if (event.target instanceof Element && event.target.closest('button, a')) onManualAction(event);
}

function onManualLogin(result: Misskey.entities.SigninFlowResponse & { finished: true }) {
	manual = true;
	cancelAutofill();
	emit('login', result);
}

watch(() => props.enabled, enabled => {
	if (enabled && !manual && !suspended) void autofill.start();
	else cancelAutofill();
}, { immediate: true, flush: 'post' });
onBeforeUnmount(() => { suspended = true; cancelAutofill(); });
onDeactivated(() => { suspended = true; cancelAutofill(); });
onActivated(() => {
	if (!suspended) return;
	suspended = false;
	if (props.enabled && !manual) void autofill.start();
});
</script>
