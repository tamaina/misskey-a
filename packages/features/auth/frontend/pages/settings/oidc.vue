<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<h1>{{ $locale.sfc.title }}</h1>
	<p v-if="!individual">{{ $locale.sfc.individual }}</p>
	<div v-for="link in links" :key="link.id" class="_gaps_s">
		<strong>{{ link.providerName }}</strong><code>{{ link.issuer }}</code>
		<MkButton :disabled="busy || !individual" @click="unlink(link.id)">{{ $locale.sfc.unlink }}</MkButton>
	</div>
	<MkButton v-for="provider in providers" :key="provider.id" :disabled="busy || !individual || links.some(link => link.providerId === provider.id)" @click="link(provider.id)">{{ $locale.sfc.link }}: {{ provider.name }}</MkButton>
</div>
</template>
<script lang="ts" setup>
import { computed, onMounted, onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue';
import type * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { oidcApi as misskeyApi } from '../../oidc-api.js';
import { $i, ensureSignin } from '../../i.js';
import { ensureOidcSudo } from '../../oidc-local-authorization.js';
const account = ensureSignin();
const individual = computed(() => account.token?.startsWith('bs_'));
const links = ref<Misskey.Endpoints['i/oidc/links']['res']>([]);
const providers = ref<Misskey.Endpoints['oidc/providers']['res']>([]);
const busy = ref(false); let active = true; let generation = 0; let pendingOperation: AbortController | undefined;
onActivated(() => { active = true; });
const invalidate = () => { active = false; generation++; pendingOperation?.abort(); pendingOperation = undefined; busy.value = false; };
onDeactivated(invalidate); onUnmounted(invalidate);
const actor = () => JSON.stringify([$i?.id ?? null, $i?.token ?? null]);
watch(actor, () => { const wasActive = active; invalidate(); active = wasActive; links.value = []; providers.value = []; }, { flush: 'sync' });
async function load(current: () => boolean) {
	if (!individual.value) return;
	const [accounts, choices] = await Promise.all([misskeyApi('i/oidc/links', {}), misskeyApi('oidc/providers', {})]);
	if (current()) { links.value = accounts; providers.value = choices; }
}
async function operation(run: (current: () => boolean, signal: AbortSignal) => Promise<void>) {
	if (busy.value || !active) return; busy.value = true; const owner = ++generation; const ownerActor = actor(); const current = () => active && generation === owner && actor() === ownerActor;
	const controller = new AbortController(); pendingOperation = controller;
	try { await run(current, controller.signal); } catch { if (current()) await os.alert({ type: 'error', text: $locale.value.sfc.failed }); }
	finally { if (pendingOperation === controller) pendingOperation = undefined; if (generation === owner) busy.value = false; }
}
onMounted(() => operation(load));
function link(providerId: string) { return operation(async current => {
	const result = await misskeyApi('i/oidc/link/start', { providerId }); if (current()) window.location.assign(result.url);
}); }
function unlink(id: string) { return operation(async (current, signal) => {
	const confirmation = await os.confirm({ type: 'warning', text: $locale.value.sfc.confirm });
	if (!current() || confirmation.canceled || !await ensureOidcSudo(current, signal) || !current()) return;
	await misskeyApi('i/oidc/unlink', { id }); if (current()) await load(current);
}); }
</script>
<locale locale="ja-JP" lang="json">
{ "title": "外部ログインの連携", "individual": "通常のログインから個別セッションを作成してから操作してください。", "link": "外部サービスと連携する", "unlink": "連携を解除", "confirm": "この外部サービスとの連携を解除しますか？ローカルのログイン手段は引き続き必要です。", "failed": "変更できませんでした。再認証と現在の連携状態を確認して再試行してください。" }
</locale>
