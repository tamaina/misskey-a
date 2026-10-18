<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_spacer _gaps_m">
	<h1>{{ $locale.sfc.title }}</h1>
	<p>{{ $locale.sfc.network }}</p>
	<form class="_gaps_s" @submit.prevent="create">
		<MkInput v-model="name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
		<MkButton type="submit" :disabled="busy" primary>{{ $locale.sfc.create }}</MkButton>
	</form>
	<form v-for="provider in providers" :key="provider.id" class="_gaps_s" @submit.prevent="save(provider)">
		<h2>{{ provider.name }}</h2>
		<p>{{ $locale.sfc.redirect }}</p><code>{{ provider.redirectUri }}</code>
		<MkInput v-model="provider.name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
		<MkInput v-model="provider.issuer" type="url" required :disabled="busy"><template #label>{{ $locale.sfc.issuer }}</template></MkInput>
		<MkInput v-model="provider.clientId" :disabled="busy"><template #label>{{ $locale.sfc.clientId }}</template></MkInput>
		<MkInput v-model="provider.secret" type="password" autocomplete="new-password" :disabled="busy"><template #label>{{ $locale.sfc.secret }}</template><template #caption>{{ $locale.sfc.secretHelp }}</template></MkInput>
		<MkSwitch v-model="provider.enabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
		<MkButton type="submit" primary :disabled="busy">{{ $locale.sfc.save }}</MkButton>
		<MkButton v-if="!provider.enabled" :disabled="busy" @click="clearSecret(provider)">{{ $locale.sfc.clearSecret }}</MkButton>
	</form>
</div>
</template>
<script lang="ts" setup>
import { onMounted, onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue';
import type * as Misskey from 'misskey-js';
import { $i } from '../../i.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { oidcApi as misskeyApi } from '../../oidc-api.js';
import { ensureOidcSudo } from '../../oidc-local-authorization.js';
type Provider = Misskey.Endpoints['admin/oidc/providers']['res'][number] & { secret: string };
const providers = ref<Provider[]>([]); const name = ref(''); const busy = ref(false);
let active = true; let generation = 0; let pendingOperation: AbortController | undefined;
onActivated(() => { active = true; });
const invalidate = () => { active = false; generation++; pendingOperation?.abort(); pendingOperation = undefined; busy.value = false; for (const provider of providers.value) provider.secret = ''; };
onDeactivated(invalidate); onUnmounted(invalidate);
const actor = () => JSON.stringify([$i?.id ?? null, $i?.token ?? null]);
watch(actor, () => { const wasActive = active; invalidate(); active = wasActive; providers.value = []; name.value = ''; }, { flush: 'sync' });
async function load(current: () => boolean) { const result = await misskeyApi('admin/oidc/providers', {}); if (current()) providers.value = result.map(provider => ({ ...provider, secret: '' })); }
async function operation(run: (current: () => boolean, signal: AbortSignal) => Promise<void>) {
	if (busy.value || !active) return; busy.value = true; const owner = ++generation; const ownerActor = actor(); const current = () => active && owner === generation && actor() === ownerActor;
	const controller = new AbortController(); pendingOperation = controller;
	try { await run(current, controller.signal); } catch { if (current()) await os.alert({ type: 'error', text: $locale.value.sfc.failed }); }
	finally { if (pendingOperation === controller) pendingOperation = undefined; if (owner === generation) busy.value = false; }
}
onMounted(() => operation(load));
function create() { const value = name.value; return operation(async (current, signal) => {
	if (!await ensureOidcSudo(current, signal) || !current()) return;
	await misskeyApi('admin/oidc/create', { name: value }); if (current()) { name.value = ''; await load(current); }
}); }
function save(provider: Provider) {
	const input = { id: provider.id, version: provider.version, name: provider.name, issuer: provider.issuer, clientId: provider.clientId, enabled: provider.enabled, ...(provider.secret ? { clientSecret: provider.secret } : {}) };
	return operation(async (current, signal) => {
		if (!await ensureOidcSudo(current, signal) || !current()) return;
		await misskeyApi('admin/oidc/update', input); if (current()) { provider.secret = ''; await load(current); }
	});
}
function clearSecret(provider: Provider) {
	const input = { id: provider.id, version: provider.version, name: provider.name, issuer: provider.issuer, clientId: provider.clientId, enabled: false, clearClientSecret: true as const };
	return operation(async (current, signal) => {
		const confirmation = await os.confirm({ type: 'warning', text: $locale.value.sfc.clearSecretConfirm });
		if (!current() || confirmation.canceled || !await ensureOidcSudo(current, signal) || !current()) return;
		await misskeyApi('admin/oidc/update', input); if (current()) { provider.secret = ''; await load(current); }
	});
}
</script>
<locale locale="ja-JP" lang="json">
{ "title": "外部ログインのプロバイダー", "network": "HTTPS の OIDC に対応します。内部ネットワークはサーバー設定の allowedPrivateNetworks で明示許可した範囲だけ接続できます。DNS/TLS の検査は省略しません。", "name": "表示名", "create": "下書きを作成", "redirect": "最初にこのリダイレクト URL を認証サービスへ登録してください。", "issuer": "Issuer URL", "clientId": "Client ID", "secret": "Client secret", "secretHelp": "保存済みの secret は表示しません。空欄の場合は変更しません。", "enabled": "必要な情報を保存して有効にする", "save": "再認証して保存", "clearSecret": "保存済み secret を明示消去", "clearSecretConfirm": "先にこのプロバイダーを無効化してすべての連携を解除してください。保存済み secret を消去しますか？再び有効化するには secret の再登録が必要です。", "failed": "設定を保存できませんでした。再認証・現在の版・認証サービスの設定を確認してください。" }
</locale>
