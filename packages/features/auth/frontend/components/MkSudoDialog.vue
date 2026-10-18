<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkModalWindow ref="dialog" :width="420" :height="540" @close="cancel" @esc="cancel" @closed="emit('closed')">
	<template #header>{{ $locale.sfc.title }}</template>
	<div class="_spacer _gaps_m">
		<p>{{ $locale.sfc.description }}</p>
		<MkInfo v-if="!individual" warn>{{ $locale.sfc.individualRequired }}</MkInfo>
		<p v-else-if="!state && error" role="alert">{{ $locale.sfc.failed }}</p>
		<p v-else-if="!state">{{ $locale.sfc.loading }}</p>
		<form v-else class="_gaps_m" @submit.prevent="confirm">
			<MkInput v-if="!state.passwordLoginDisabled" v-model="password" type="password" autocomplete="current-password" :disabled="busy" required>
				<template #label>{{ $locale.sfc.password }}</template>
			</MkInput>
			<label v-if="!state.passwordLoginDisabled && (state.totpEnabled || state.passkeyMfaEnabled)">
				{{ $locale.sfc.factor }}
				<select v-model="factor" :disabled="busy">
					<option v-if="state.totpEnabled" value="totp">{{ $locale.sfc.totp }}</option>
					<option v-if="state.passkeyCount > 0 && supportsPasskey" value="passkey">{{ $locale.sfc.passkey }}</option>
					<option value="recovery">{{ $locale.sfc.recovery }}</option>
				</select>
			</label>
			<MkInput v-if="!state.passwordLoginDisabled && (state.totpEnabled || state.passkeyMfaEnabled) && factor !== 'passkey'" v-model="token" type="text" autocomplete="one-time-code" :disabled="busy" required>
				<template #label>{{ factor === 'recovery' ? $locale.sfc.recovery : $locale.sfc.totp }}</template>
			</MkInput>
			<MkInfo v-if="state.passwordLoginDisabled">{{ $locale.sfc.strictPasskey }}</MkInfo>
			<MkInfo v-if="state.passkeyCount === 0">{{ $locale.sfc.passkeyHint }}</MkInfo>
			<p v-if="error" role="alert">{{ $locale.sfc.failed }}</p>
			<MkButton type="submit" primary :disabled="busy || (state.passwordLoginDisabled ? !supportsPasskey : !password)">{{ busy ? $locale.sfc.waiting : $locale.sfc.confirm }}</MkButton>
		</form>
		<MkButton :disabled="false" @click="cancel">{{ $locale.sfc.cancel }}</MkButton>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { browserSupportsWebAuthn, startAuthentication, WebAuthnAbortService } from '@simplewebauthn/browser';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '../i.js';

const props = defineProps<{ isCurrent: () => boolean }>();
const emit = defineEmits<{ (event: 'done', confirmed: boolean): void; (event: 'closed'): void }>();
const dialog = useTemplateRef('dialog');
const ownerToken = ensureSignin().token;
const individual = ownerToken.startsWith('bs_');
const supportsPasskey = browserSupportsWebAuthn();
const state = ref<{ totpEnabled: boolean; passkeyMfaEnabled: boolean; passkeyCount: number; passwordLoginDisabled: boolean } | null>(null);
const password = ref('');
const token = ref('');
const factor = ref<'totp' | 'passkey' | 'recovery'>('totp');
const busy = ref(false);
const error = ref(false);
let settled = false;
let disposed = false;
let nativePending = false;
const current = () => !disposed && !settled && props.isCurrent();

function cancel() {
	if (settled) return;
	settled = true;
	password.value = ''; token.value = '';
	if (nativePending) { WebAuthnAbortService.cancelCeremony(); nativePending = false; }
	emit('done', false);
	dialog.value?.close();
}

async function discardElevation(expiresAt: string, grantId: string) {
	// Bind cleanup to the original session, even after an account switch. The exact
	// deadline comparison prevents an old dialog from clearing a newer elevation.
	await misskeyApi('i/sudo/exit', { expiresAt, grantId }, ownerToken).catch(() => {});
}

async function confirm() {
	if (!current() || busy.value || !state.value) return;
	busy.value = true; error.value = false;
	try {
		const mfa = state.value.totpEnabled || state.value.passkeyMfaEnabled;
		const started = await misskeyApi('i/sudo/start', { ...(!state.value.passwordLoginDisabled ? { password: password.value } : {}),
			usePasskey: state.value.passwordLoginDisabled || (mfa && factor.value === 'passkey'),
			...(!state.value.passwordLoginDisabled && mfa && factor.value !== 'passkey' ? { token: token.value } : {}),
		});
		if (!current()) { if (started.status === 'elevated') await discardElevation(started.expiresAt, started.grantId); return; }
		let expiresAt = started.status === 'elevated' ? started.expiresAt : null;
		let grantId = started.status === 'elevated' ? started.grantId : null;
		if (started.status === 'passkey-required') {
			nativePending = true;
			const credential = await startAuthentication({ optionsJSON: started.options });
			nativePending = false;
			if (!current()) return;
			const completed = await misskeyApi('i/sudo/complete', { ticket: started.ticket, credential });
			expiresAt = completed.expiresAt; grantId = completed.grantId;
		}
		if (!current()) { if (expiresAt !== null && grantId !== null) await discardElevation(expiresAt, grantId); return; }
		settled = true;
		emit('done', true);
		dialog.value?.close();
	} catch { if (current()) error.value = true; }
	finally { password.value = ''; token.value = ''; busy.value = false; nativePending = false; }
}

watch(() => props.isCurrent(), value => { if (!value) cancel(); }, { flush: 'sync' });
onMounted(async () => {
	if (!individual) return;
	try {
		const result = await misskeyApi('i/security/state', {});
		if (!current()) return;
		state.value = result;
		factor.value = result.totpEnabled ? 'totp' : supportsPasskey && result.passkeyCount > 0 ? 'passkey' : 'recovery';
	} catch { if (current()) error.value = true; }
});
onUnmounted(() => { cancel(); disposed = true; });
</script>

<locale locale="ja-JP" lang="json">
{
	"title": "重要な操作の本人確認",
	"description": "本人確認が完了すると、このログインで5分間、重要な操作を続けられます。他の端末のログインは昇格しません。",
	"individualRequired": "この古いログインでは本人確認を開始できません。サインアウトしてログインし直してください。",
	"loading": "認証方法を確認しています…",
	"password": "現在のパスワード",
	"factor": "確認方法",
	"totp": "認証アプリのコード",
	"passkey": "パスキー・セキュリティキー",
	"recovery": "復旧コード",
	"strictPasskey": "パスワードログインが無効なため、端末のロック解除を伴うパスキーで本人確認します。",
	"passkeyHint": "設定のセキュリティからパスキーを登録すると、認証アプリのコードの代わりに端末で本人確認できます。登録は後からでも構いません。",
	"failed": "本人確認できませんでした。設定やコードを確認して、もう一度お試しください。",
	"waiting": "確認中…",
	"confirm": "確認して続ける",
	"cancel": "キャンセル"
}
</locale>
