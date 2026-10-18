<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_spacer _gaps_m">
	<h1>{{ $locale.sfc.title }}</h1>
	<p v-if="failed" role="alert">{{ $locale.sfc.failed }}</p>
	<template v-if="flow?.next === 'login'">
		<p>{{ $locale.sfc.localFactor }}</p>
		<p v-if="flow.factors.includes('passkey') && !supportsPasskey">{{ $locale.sfc.unsupported }}</p>
		<MkInput v-if="flow.factors.includes('totp') || flow.factors.includes('recovery')" v-model="token" :disabled="busy" autocomplete="one-time-code"><template #label>{{ $locale.sfc.code }}</template></MkInput>
		<MkButton v-if="!flow.factors.length || flow.factors.includes('totp') || flow.factors.includes('recovery')" :disabled="busy" primary @click="finishLogin(false)">{{ $locale.sfc.continue }}</MkButton>
		<MkButton v-if="flow.factors.includes('passkey') && supportsPasskey" :disabled="busy" @click="finishLogin(true)">{{ $locale.sfc.passkey }}</MkButton>
	</template>
	<template v-if="flow?.next === 'onboarding'">
		<p>{{ $locale.sfc.noAutomaticLink }}</p>
		<form class="_gaps_m" @submit.prevent="register">
			<MkInput v-model="username" required :disabled="busy" autocomplete="username" pattern="[a-zA-Z0-9_]{1,20}"><template #label>{{ $locale.sfc.username }}</template></MkInput>
			<MkInput v-model="password" required :disabled="busy" type="password" autocomplete="new-password"><template #label>{{ $locale.sfc.password }}</template></MkInput>
			<MkInput v-model="email" required :disabled="busy" type="email"><template #label>{{ $locale.sfc.email }}</template></MkInput>
			<MkInput v-if="instance.disableRegistration" v-model="invitationCode" :disabled="busy"><template #label>{{ $locale.sfc.invitation }}</template></MkInput>
			<MkA v-if="flow.termsUrl" :to="flow.termsUrl" target="_blank" class="_link">{{ $locale.sfc.terms }}</MkA>
			<MkA v-if="instance.privacyPolicyUrl" :to="instance.privacyPolicyUrl" target="_blank" class="_link">{{ $locale.sfc.privacy }}</MkA>
			<ul><li v-for="(rule, index) in instance.serverRules" :key="index">{{ rule }}</li></ul>
			<MkSwitch v-model="agree" :disabled="busy">{{ $locale.sfc.agree }}</MkSwitch>
			<MkCaptcha v-if="instance.enableHcaptcha" v-model="captcha.hcaptcha" provider="hcaptcha" :sitekey="instance.hcaptchaSiteKey"/>
			<MkCaptcha v-if="instance.enableRecaptcha" v-model="captcha.recaptcha" provider="recaptcha" :sitekey="instance.recaptchaSiteKey"/>
			<MkCaptcha v-if="instance.enableTurnstile" v-model="captcha.turnstile" provider="turnstile" :sitekey="instance.turnstileSiteKey"/>
			<MkCaptcha v-if="instance.enableMcaptcha" v-model="captcha.mcaptcha" provider="mcaptcha" :sitekey="instance.mcaptchaSiteKey" :instanceUrl="instance.mcaptchaInstanceUrl"/>
			<MkCaptcha v-if="instance.enableTestcaptcha" v-model="captcha.testcaptcha" provider="testcaptcha" :sitekey="null"/>
			<MkButton primary type="submit" :disabled="busy || !agree">{{ $locale.sfc.sendEmail }}</MkButton>
		</form>
		<form v-if="emailSent" class="_gaps_s" @submit.prevent="verifyEmail">
			<MkInput v-model="emailCode" required :disabled="busy" autocomplete="one-time-code"><template #label>{{ $locale.sfc.emailCode }}</template></MkInput>
			<MkButton primary type="submit" :disabled="busy">{{ $locale.sfc.createAccount }}</MkButton>
		</form>
	</template>
	<template v-if="flow?.next === 'link'">
		<p>{{ $locale.sfc.linkConsent }}</p>
		<code>{{ flow.issuer }} / {{ flow.subject }}</code>
		<MkSwitch v-model="agree" :disabled="busy">{{ $locale.sfc.linkAgree }}</MkSwitch>
		<MkButton primary :disabled="busy || !agree" @click="link">{{ $locale.sfc.link }}</MkButton>
	</template>
	<MkButton :disabled="busy" @click="cancel">{{ $locale.sfc.cancel }}</MkButton>
	<MkA v-if="failed" class="_link" to="/">{{ $locale.sfc.restart }}</MkA>
</div>
</template>
<script lang="ts" setup>
import { onMounted, onActivated, onDeactivated, onUnmounted, reactive, ref, watch } from 'vue';
import { browserSupportsWebAuthn, startAuthentication, WebAuthnAbortService } from '@simplewebauthn/browser';
import type * as Misskey from 'misskey-js';
import { $i } from '../i.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkCaptcha from '../components/MkCaptcha.vue';
import { oidcApi as misskeyApi } from '../oidc-api.js';
import { instance } from '@features/instance/frontend/instance.js';
import { login } from '../accounts.js';
import { ensureOidcSudo } from '../oidc-local-authorization.js';
const supportsPasskey = browserSupportsWebAuthn();
const props = defineProps<{ providerId?: string }>();
type Flow = Misskey.Endpoints['oidc/status']['res'];
const flow = ref<Flow | null>(null); const ticket = ref('');
const busy = ref(false); const failed = ref(false); const emailSent = ref(false);
const username = ref(''); const password = ref(''); const email = ref(''); const invitationCode = ref(''); const emailCode = ref(''); const token = ref(''); const agree = ref(false);
const captcha = reactive<Record<string, string | null>>({});
let nativeAttempt: symbol | undefined;
let active = true; let generation = 0; let pendingOperation: AbortController | undefined;
const invalidate = () => { active = false; generation++; if (nativeAttempt) { nativeAttempt = undefined; WebAuthnAbortService.cancelCeremony(); } pendingOperation?.abort(); pendingOperation = undefined; busy.value = false; password.value = ''; token.value = ''; };
onActivated(() => { active = true; }); onDeactivated(invalidate); onUnmounted(invalidate);
const actor = () => JSON.stringify([$i?.id ?? null, $i?.token ?? null]);
watch(actor, () => { const wasActive = active; invalidate(); active = wasActive; flow.value = null; emailCode.value = ''; agree.value = false; }, { flush: 'sync' });

async function operation(run: (current: () => boolean, signal: AbortSignal) => Promise<void>) {
	if (busy.value || !active) return;
	busy.value = true; failed.value = false; const owner = ++generation; const ownerActor = actor(); const current = () => active && owner === generation && actor() === ownerActor;
	const controller = new AbortController(); pendingOperation = controller;
	try { await run(current, controller.signal); } catch { if (current()) failed.value = true; } finally { if (pendingOperation === controller) pendingOperation = undefined; if (owner === generation) busy.value = false; }
}

onMounted(() => operation(async current => {
	const query = new URLSearchParams(window.location.search);
	if (['state', 'code', 'error', 'ticket'].some(key => query.getAll(key).length > 1)) throw new Error('Duplicate OIDC callback parameter');
	if (props.providerId) {
		const state = query.get('state'); const code = query.get('code');
		if (!state || (query.has('error') && code)) throw new Error('Invalid OIDC callback');
		window.history.replaceState(null, '', window.location.pathname);
		const result = await misskeyApi('oidc/callback', { providerId: props.providerId, state, ...(code ? { code } : {}) });
		if (!current()) return;
		if ('canceled' in result) { failed.value = true; return; }
		ticket.value = result.ticket; flow.value = result.flow;
		window.history.replaceState(null, '', `/auth/oidc/resume?ticket=${encodeURIComponent(result.ticket)}`);
	} else {
		const value = query.get('ticket'); if (!value) throw new Error('No continuation'); ticket.value = value;
		const result = await misskeyApi('oidc/status', { ticket: value }); if (!current()) return; flow.value = result;
	}
	emailSent.value = flow.value?.next === 'onboarding' && flow.value.emailSent;
}));

function finishLogin(passkey: boolean) {
 return operation(async current => {
	const snapshot = flow.value;
	if (snapshot?.next !== 'login') return;
	let credential;
	if (passkey) {
		if (!snapshot.options) throw new Error('No local key challenge');
		const attempt = Symbol(); nativeAttempt = attempt;
		try { credential = await startAuthentication({ optionsJSON: snapshot.options }); } catch { return; } finally { if (nativeAttempt === attempt) nativeAttempt = undefined; }
		if (!current()) return;
	}
	const result = await misskeyApi('oidc/login', { ticket: ticket.value, ...(credential ? { credential } : token.value ? { token: token.value } : {}) });
	if (current()) await login(result.i, '/');
});
}

function register() {
 return operation(async current => {
	const proof = Object.fromEntries([['hcaptcha-response', captcha.hcaptcha], ['g-recaptcha-response', captcha.recaptcha], ['turnstile-response', captcha.turnstile], ['m-captcha-response', captcha.mcaptcha], ['testcaptcha-response', captcha.testcaptcha]].filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
	await misskeyApi('oidc/onboarding', { ticket: ticket.value, username: username.value, password: password.value, email: email.value, agree: agree.value, ...(invitationCode.value ? { invitationCode: invitationCode.value } : {}), captcha: proof });
	if (current()) { emailSent.value = true; password.value = ''; }
});
}

function verifyEmail() {
 return operation(async current => {
	const result = await misskeyApi('oidc/onboarding/verify', { ticket: ticket.value, code: emailCode.value }); if (current()) await login(result.i, '/');
});
}

function link() {
 return operation(async (current, signal) => {
	if (!agree.value || !await ensureOidcSudo(current, signal) || !current()) return;
	await misskeyApi('i/oidc/link/complete', { ticket: ticket.value, agree: true });
	if (current()) window.location.assign('/settings/oidc');
});
}

function cancel() {
 return operation(async current => {
	if (ticket.value) await misskeyApi('oidc/cancel', { ticket: ticket.value });
	if (current()) window.location.assign('/');
});
}
</script>
<locale locale="ja-JP" lang="json">
{
 "title": "外部ログイン", "unsupported": "この環境ではパスキーを使えません。別の設定済み要素か対応するブラウザーでやり直してください。", "failed": "手続きを完了できませんでした。外部ログインを最初からやり直してください。", "localFactor": "アカウントに二要素認証が設定されている場合は、このサーバーの確認も必要です。", "code": "確認コードまたは復旧コード", "continue": "ログインを完了", "passkey": "登録したパスキーで確認", "noAutomaticLink": "既存アカウントとはメールアドレスだけでは連携しません。既存の方は通常のログイン後、設定から連携してください。新規登録にはローカルパスワードとメール確認が必要です。", "username": "ユーザー名", "password": "ローカルパスワード", "email": "メールアドレス", "invitation": "招待コード", "terms": "利用規約を読む", "privacy": "プライバシーポリシーを読む", "agree": "利用規約・プライバシーポリシー・サーバールールを確認して同意する", "sendEmail": "確認メールを送る", "emailCode": "メールに届いた確認コード", "createAccount": "確認してアカウントを作成", "linkConsent": "外部サービスの本人確認が完了しました。現在ログイン中のアカウントに連携するには、このサーバーでも再認証してください。", "linkAgree": "この外部ログインを現在のアカウントに連携する", "link": "再認証して連携", "cancel": "取り消す", "restart": "最初からやり直す"
}
</locale>
