<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<FormSection>
	<template #label>{{ $locale.sfc.title }}</template>
	<div class="_gaps_m">
		<MkInfo>{{ $locale.sfc.explanation }}</MkInfo>
		<MkInfo warn>{{ $locale.sfc.otherSessionsWarning }}</MkInfo>
		<p v-if="!state">{{ $locale.sfc.loading }}</p>
		<template v-else>
			<p>{{ state.passkeyMfaEnabled ? $locale.sfc.mfaActive : $locale.sfc.mfaInactive }}</p>
			<MkInfo v-if="(state.totpEnabled || state.passkeyMfaEnabled) && state.recoveryCodesRemaining < 5" warn>{{ $locale.sfc.codesWarning }}</MkInfo>
			<MkFolder @opened="loadKeys">
				<template #icon><i class="ti ti-key"></i></template>
				<template #label>{{ $locale.sfc.securityKeyAndPasskey }}</template>
				<div class="_gaps_m">
					<MkInfo v-if="!supportsPasskey" warn>{{ $locale.sfc.unsupported }}</MkInfo>
					<MkFolder v-for="key in keys" :key="key.id">
						<template #label>{{ key.name }}</template>
						<template #suffix><MkTime :time="key.lastUsedAt"/></template>
						<div class="_buttons">
							<MkButton :disabled="busy" @click="renameKey(key)">{{ $locale.sfc.rename }}</MkButton>
							<MkButton danger :disabled="busy" @click="removeKey(key)">{{ $locale.sfc.remove }}</MkButton>
						</div>
					</MkFolder>
					<MkButton :disabled="busy || !supportsPasskey" @click="registerKey">{{ $locale.sfc.registerKey }}</MkButton>
				</div>
			</MkFolder>
			<MkButton v-if="!state.passkeyMfaEnabled && state.passkeyCount > 0" :disabled="busy" @click="enableMfa">{{ $locale.sfc.enableMfa }}</MkButton>
			<MkButton v-if="state.passkeyMfaEnabled" danger :disabled="busy" @click="disableMfa">{{ $locale.sfc.disableMfa }}</MkButton>
			<MkButton v-if="state.totpEnabled || state.passkeyMfaEnabled" :disabled="busy" @click="regenerateCodes">{{ $locale.sfc.regenerateCodes }}</MkButton>
			<MkSwitch :modelValue="state.passwordlessEnabled" :disabled="busy || state.passkeyCount === 0 || state.passwordLoginDisabled" @update:modelValue="setPasswordless">
				{{ $locale.sfc.passwordless }}
				<template #caption>{{ $locale.sfc.passwordlessDescription }}</template>
			</MkSwitch>
			<MkInfo>{{ $locale.sfc.disablePasswordDescription }}</MkInfo>
			<MkButton v-if="!state.passwordLoginDisabled" danger :disabled="busy || !supportsPasskey || !state.passwordlessEnabled || !state.hasVerifiedRecoveryEmail" @click="disablePassword">{{ $locale.sfc.disablePassword }}</MkButton>
			<MkInfo v-else warn>{{ $locale.sfc.passwordDisabled }}</MkInfo>
			<hr>
			<p>{{ state.totpEnabled ? $locale.sfc.totpActive : $locale.sfc.totpInactive }}</p>
			<div class="_buttons">
				<MkButton :disabled="busy" @click="prepareTotp">{{ state.totpEnabled ? $locale.sfc.replaceTotp : $locale.sfc.registerTotp }}</MkButton>
				<MkButton v-if="state.totpEnabled" danger :disabled="busy" @click="removeTotp">{{ $locale.sfc.removeTotp }}</MkButton>
			</div>
			<form v-if="totp" class="_gaps_s" @submit.prevent="completeTotp">
				<p>{{ $locale.sfc.totpInstructions }}</p>
				<code :class="$style.secret">{{ totp.secret }}</code>
				<a :href="totp.url">{{ $locale.sfc.openAuthenticator }}</a>
				<MkInput v-model="totpCode" autocomplete="one-time-code" :disabled="busy" required><template #label>{{ $locale.sfc.totpCode }}</template></MkInput>
				<div class="_buttons">
					<MkButton type="submit" primary :disabled="busy || !totpCode">{{ $locale.sfc.confirmTotp }}</MkButton>
					<MkButton :disabled="busy" @click="clearPending">{{ $locale.sfc.cancel }}</MkButton>
				</div>
			</form>
		</template>
		<p v-if="error" role="alert">{{ $locale.sfc.failed }}</p>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnAbortService } from '@simplewebauthn/browser';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkRecoveryCodesDialog from './MkRecoveryCodesDialog.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '../i.js';
import { registrationWire } from '../utility/registration-wire.js';
import { ensureSudo } from '../utility/ensure-sudo.js';

const owner = ensureSignin();
const ownerId = owner.id;
const ownerToken = owner.token;
const supportsPasskey = browserSupportsWebAuthn();
const state = ref<Awaited<ReturnType<typeof readState>> | null>(null);
const keys = ref<{ id: string; name: string; lastUsedAt: string }[]>([]);
const totp = ref<{ secret: string; url: string } | null>(null);
const totpCode = ref('');
let codesDialog: { dispose: () => void } | null = null;
const busy = ref(false);
const error = ref(false);
let generation = 0;
let active = true;
let nativePending = false;
let sudoAbort: AbortController | null = null;
const currentActor = () => active && ensureSignin().id === ownerId && ensureSignin().token === ownerToken;
const readState = () => misskeyApi('i/security/state', {});

function clearPending() {
	totp.value = null; totpCode.value = ''; codesDialog?.dispose(); codesDialog = null;
}

function leave() {
	active = false; generation++; sudoAbort?.abort(); sudoAbort = null; clearPending(); keys.value = [];
	if (nativePending) { WebAuthnAbortService.cancelCeremony(); nativePending = false; }
}

async function refresh(isCurrent: () => boolean) {
	const value = await readState();
	if (isCurrent()) state.value = value;
}

async function run(action: (isCurrent: () => boolean) => Promise<void>, elevate = true) {
	if (!currentActor() || busy.value) return;
	busy.value = true; error.value = false;
	const turn = ++generation;
	const controller = new AbortController(); sudoAbort = controller;
	const isCurrent = () => currentActor() && generation === turn;
	try {
		if (elevate && !await ensureSudo(isCurrent, controller.signal)) return;
		if (isCurrent()) await action(isCurrent);
	} catch { if (isCurrent()) error.value = true; } finally { controller.abort(); if (sudoAbort === controller) sudoAbort = null; busy.value = false; nativePending = false; }
}

function loadKeys() {
	return run(async isCurrent => { const value = await misskeyApi('i/security/keys/list', {}); if (isCurrent()) keys.value = value; });
}

function registerKey() {
	return run(async isCurrent => {
		const name = await os.inputText({ title: $locale.value.sfc.keyName, minLength: 1, maxLength: 30 });
		if (!isCurrent() || name.canceled || !name.result) return;
		const started = await misskeyApi('i/security/passkey/register/start', { name: name.result });
		if (!isCurrent()) return;
		nativePending = true;
		const credential = await startRegistration({ optionsJSON: started.options });
		nativePending = false;
		if (!isCurrent()) return;
		const value = await misskeyApi('i/security/passkey/register/complete', { ticket: started.ticket, credential: registrationWire(credential) });
		if (isCurrent()) { clearPending(); showCodes(value.backupCodes); await refresh(isCurrent); if (isCurrent()) { const value = await misskeyApi('i/security/keys/list', {}); if (isCurrent()) keys.value = value; } }
	});
}

function renameKey(key: { id: string; name: string }) {
	return run(async isCurrent => {
		const name = await os.inputText({ title: $locale.value.sfc.keyName, default: key.name, minLength: 1, maxLength: 30 });
		if (!isCurrent() || name.canceled || !name.result) return;
		await misskeyApi('i/security/passkey/rename', { credentialId: key.id, name: name.result });
		if (isCurrent()) keys.value = keys.value.map(value => value.id === key.id ? { ...value, name: name.result! } : value);
	});
}

function removeKey(key: { id: string; name: string }) {
	return run(async isCurrent => {
		const confirmation = await os.confirm({ type: 'warning', title: key.name, text: $locale.value.sfc.removeKeyWarning + '\n' + $locale.value.sfc.otherSessionsWarning });
		if (!isCurrent() || confirmation.canceled) return;
		await misskeyApi('i/security/passkey/remove', { credentialId: key.id });
		if (!isCurrent()) return;
		// Inform a supporting authenticator only after committed removal of this owned key.
		const signal = (globalThis.PublicKeyCredential as unknown as { signalUnknownCredential?: (options: { rpId: string; credentialId: string }) => Promise<void> })?.signalUnknownCredential;
		if (signal) await signal.call(globalThis.PublicKeyCredential, { rpId: window.location.hostname, credentialId: key.id }).catch(() => {});
		if (isCurrent()) { keys.value = keys.value.filter(value => value.id !== key.id); clearPending(); await refresh(isCurrent); }
	});
}

function enableMfa() {
	return run(async isCurrent => {
		const confirmation = await os.confirm({ type: 'warning', text: $locale.value.sfc.enableWarning });
		if (!isCurrent() || confirmation.canceled) return;
		const value = await misskeyApi('i/security/passkey/mfa/enable', { acknowledged: true });
		if (isCurrent()) { clearPending(); showCodes(value.backupCodes); await refresh(isCurrent); }
	});
}

function disableMfa() {
	return run(async isCurrent => {
		const confirmation = await os.confirm({ type: 'warning', text: $locale.value.sfc.disableWarning + '\n' + $locale.value.sfc.otherSessionsWarning });
		if (!isCurrent() || confirmation.canceled) return;
		await misskeyApi('i/security/passkey/mfa/disable', { acknowledged: true });
		if (isCurrent()) { clearPending(); await refresh(isCurrent); }
	});
}

function setPasswordless(enabled: boolean) {
	return run(async isCurrent => {
		if (enabled) {
			const pending = await misskeyApi('i/security/passkey/passwordless/start', {});
			if (!isCurrent()) return;
			nativePending = true;
			const credential = await startAuthentication({ optionsJSON: pending.options });
			nativePending = false;
			if (!isCurrent()) return;
			await misskeyApi('i/security/passkey/passwordless/complete', { ticket: pending.ticket, credential });
		} else await misskeyApi('i/security/passkey/passwordless', { enabled: false });
		if (isCurrent()) { clearPending(); await refresh(isCurrent); }
	}, !enabled);
}

function disablePassword() {
	return run(async isCurrent => {
		const confirmation = await os.confirm({ type: 'warning', text: $locale.value.sfc.disablePasswordWarning + '\n' + $locale.value.sfc.otherSessionsWarning });
		if (!isCurrent() || confirmation.canceled) return;
		const pending = await misskeyApi('i/security/password-login/disable/start', {});
		if (!isCurrent()) return;
		nativePending = true;
		const credential = await startAuthentication({ optionsJSON: pending.options });
		nativePending = false;
		if (!isCurrent()) return;
		await misskeyApi('i/security/password-login/disable/complete', { ticket: pending.ticket, credential });
		if (isCurrent()) { clearPending(); await refresh(isCurrent); }
	});
}

function prepareTotp() {
	return run(async isCurrent => { clearPending(); const value = await misskeyApi('i/security/totp/start', {}); if (isCurrent()) totp.value = value; });
}

function completeTotp() {
	return run(async isCurrent => {
		if (!totp.value || !totpCode.value) return;
		const value = await misskeyApi('i/security/totp/complete', { token: totpCode.value });
		if (isCurrent()) { clearPending(); showCodes(value.backupCodes); await refresh(isCurrent); }
	});
}

function removeTotp() {
	return run(async isCurrent => {
		const confirmation = await os.confirm({ type: 'warning', text: (state.value?.passkeyMfaEnabled ? $locale.value.sfc.removeTotpWarning : $locale.value.sfc.disableWarning) + '\n' + $locale.value.sfc.otherSessionsWarning });
		if (!isCurrent() || confirmation.canceled) return;
		await misskeyApi('i/security/totp/remove', { confirmDisableMfa: true });
		if (isCurrent()) { clearPending(); await refresh(isCurrent); }
	});
}

function showCodes(codes: string[]) {
	if (!codes.length) return;
	codesDialog?.dispose();
	const dialog = os.popup(MkRecoveryCodesDialog, { codes }, { closed: () => { dialog.dispose(); if (codesDialog === dialog) codesDialog = null; } });
	codesDialog = dialog;
}

function regenerateCodes() {
	return run(async isCurrent => {
		clearPending();
		const confirmation = await os.confirm({ type: 'warning', text: $locale.value.sfc.regenerateWarning });
		if (!isCurrent() || confirmation.canceled) return;
		const value = await misskeyApi('i/security/recovery-codes', { regenerate: true });
		if (isCurrent()) { showCodes(value.backupCodes); await refresh(isCurrent); }
	});
}

watch(() => [ensureSignin().id, ensureSignin().token], () => { if (!currentActor()) leave(); }, { flush: 'sync' });
onMounted(() => run(refresh, false));
onActivated(() => { if (!active) { active = true; void run(refresh, false); } });
onDeactivated(leave);
onUnmounted(leave);
</script>

<style lang="scss" module>
.secret { overflow-wrap: anywhere; user-select: all; }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "ログインと多要素認証",
	"otherSessionsWarning": "パスキーの削除、認証アプリの設定・削除、パスキーによる多要素認証の無効化、パスキー単独ログインやパスワードログインの設定変更では、この端末以外のログインはすべて無効になります。パスキーによる多要素認証の有効化、パスキーの登録・名前の変更、復旧コードの再生成では無効になりません。",
	"explanation": "パスキーは端末やセキュリティキーで使う認証方法です。認証アプリを先に設定しなくても登録できます。登録するとすぐにパスキーによる多要素認証が有効になり、認証アプリの設定時と同じように復旧コードの初回発行時のみ表示されます。キーが残っていれば、ボタンでこの多要素認証を無効・有効に切り替えられます。再有効化時に復旧コードが残っていなければ、新しく発行して一度だけ表示します。重要な設定には、このログインで5分間有効な本人確認が必要です。",
	"loading": "設定を読み込んでいます…",
	"mfaActive": "パスキーによる多要素認証は有効です。",
	"mfaInactive": "パスキーによる多要素認証は無効です。",
	"registerKey": "パスキーを登録",
	"securityKeyAndPasskey": "セキュリティキー・パスキー",
	"unsupported": "このブラウザではパスキーを利用できません。認証アプリまたは復旧コードを使用してください。",
	"keyName": "パスキーの名前",
	"rename": "名前を変更",
	"remove": "削除",
	"removeKeyWarning": "このパスキーを削除しますか。パスキーによる多要素認証が有効で、他に使える認証アプリがない場合は、最後のパスキーを削除する前に「パスキーによる多要素認証を無効にする」ボタンで無効にしてください。パスワードログインが無効な場合は最後のパスキーを削除できません。",
	"enableMfa": "パスキーによる多要素認証を有効にする",
	"enableWarning": "パスキーによる多要素認証を有効にしますか。パスワードでのログインに追加の認証が必要になります。復旧コードが残っていない場合は、新しいコードを発行して一度だけ表示します。",
	"disableMfa": "パスキーによる多要素認証を無効にする",
	"disableWarning": "この認証方法を無効にしますか。他に多要素認証が有効でなければ、パスワードだけでログインできるようになります。",
	"passwordless": "パスキーだけでログインできるようにする",
	"passwordlessDescription": "端末のロック解除を伴うパスキーでログインします。パスワードを使ったログイン方法も引き続き利用できます。",
	"disablePassword": "パスワードによるログインを無効にする",
	"disablePasswordDescription": "パスキー単独ログインと確認済みメールアドレスがある場合、端末ロック解除付きのパスキーで再確認してパスワードログインを無効にできます。重要な操作もそのパスキーで確認します。",
	"disablePasswordWarning": "パスワードによるログインを無効にしますか。他の端末はサインアウトします。パスキーを失った場合は確認済みメールへのパスワード再設定が必要です。",
	"passwordDisabled": "パスワードログインは無効です。有効に戻す場合は、上のパスワード変更から新しいパスワードを設定してください。最後のパスキーは削除できません。",
	"totpActive": "認証アプリは設定済みです。",
	"totpInactive": "認証アプリは未設定です。",
	"registerTotp": "認証アプリを設定",
	"replaceTotp": "認証アプリを再設定",
	"removeTotp": "認証アプリを削除",
	"removeTotpWarning": "認証アプリを削除しますか。パスキーによる多要素認証は引き続き有効です。",
	"totpInstructions": "認証アプリに次のシークレットを登録し、表示されたコードを入力してください。確認が終わるまで、現在の認証アプリは変更されません。",
	"openAuthenticator": "認証アプリで開く",
	"totpCode": "認証アプリのコード",
	"confirmTotp": "コードを確認して設定",
	"regenerateCodes": "復旧コードを再生成",
	"regenerateWarning": "復旧コードを再生成すると、以前の復旧コードは使えなくなります。続けますか。",
	"codesWarning": "使用済みの復旧コードがあります。必要なら再生成して安全な場所に保存してください。",
	"cancel": "キャンセル",
	"failed": "操作を完了できませんでした。本人確認の有効期限や設定を確認し、もう一度開始してください。"
}
</locale>
