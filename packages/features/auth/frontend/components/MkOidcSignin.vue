<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div v-if="providers.length" class="_gaps_s">
	<MkButton v-for="provider in providers" :key="provider.id" :disabled="busy" @click="begin(provider.id)">{{ $locale.sfc.signIn }}: {{ provider.name }}</MkButton>
</div>
</template>
<script lang="ts" setup>
import { onMounted, onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { $i } from '../i.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { oidcApi as misskeyApi } from '../oidc-api.js';
import * as os from '@features/ui/frontend/os.js';
const providers = ref<{ id: string; name: string }[]>([]);
const busy = ref(false);
let active = true;
let generation = 0;
let pendingOperation: AbortController | undefined;
const actor = () => JSON.stringify([$i?.id ?? null, $i?.token ?? null]);
onActivated(() => { active = true; });
const invalidate = () => { active = false; generation++; pendingOperation?.abort(); pendingOperation = undefined; busy.value = false; };
onDeactivated(invalidate); onUnmounted(invalidate);
watch(actor, () => { const wasActive = active; invalidate(); active = wasActive; }, { flush: 'sync' });
onMounted(async () => {
	const run = generation; const ownerActor = actor(); const current = () => active && run === generation && actor() === ownerActor;
	const controller = new AbortController(); pendingOperation = controller;
	try { const result = await misskeyApi('oidc/providers', {}, controller.signal); if (current()) providers.value = result; } catch { /* Local login remains usable when external providers cannot be loaded. */ }
	finally { if (pendingOperation === controller) pendingOperation = undefined; }
});
async function begin(providerId: string) {
	if (busy.value || !active) return;
	busy.value = true; const run = ++generation; const ownerActor = actor(); const current = () => active && run === generation && actor() === ownerActor;
	const controller = new AbortController(); pendingOperation = controller;
	try {
		const result = await misskeyApi('oidc/start', { providerId }, controller.signal);
		if (current()) window.location.assign(result.url);
	} catch { if (current()) await os.alert({ type: 'error', text: $locale.value.sfc.failed }); }
	finally { if (pendingOperation === controller) pendingOperation = undefined; if (run === generation) busy.value = false; }
}
</script>
<locale locale="ja-JP" lang="json">
{ "signIn": "外部サービスでログイン", "failed": "外部ログインを開始できませんでした。もう一度お試しください。" }
</locale>
