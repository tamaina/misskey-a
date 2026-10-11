<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section class="_gaps_m">
	<h2>{{ $locale.sfc.title }}</h2>
	<p>{{ $locale.sfc.disabled }}</p>
	<p v-if="error" role="alert">{{ $locale.sfc.failed }}</p>
	<p v-if="saved" role="status">{{ $locale.sfc.saved }}</p>
	<button type="button" :disabled="busy" @click="load">{{ $locale.sfc.load }}</button>
	<ul>
		<li v-for="chain in chains" :key="chain.chainId">
			<button type="button" :disabled="busy" @click="edit(chain)">{{ chain.name }} ({{ chain.chainId }})</button>
		</li>
	</ul>
	<form class="_gaps_m" @submit.prevent="save">
		<label>{{ $locale.sfc.chainId }} <input v-model.number="chainId" type="number" min="1" :max="Number.MAX_SAFE_INTEGER" step="1" required :disabled="busy"></label>
		<label>{{ $locale.sfc.name }} <input v-model="name" type="text" maxlength="128" required :disabled="busy"></label>
		<label>{{ $locale.sfc.confirmations }} <input v-model.number="confirmationsRequired" type="number" min="1" :max="Number.MAX_SAFE_INTEGER" step="1" required :disabled="busy"></label>
		<button type="submit" :disabled="busy">{{ $locale.sfc.save }}</button>
	</form>
</section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { DisabledPaymentChain } from '../contract/billing.js';
import type { BillingAdminClient } from './admin-client.js';

const props = defineProps<{ client: BillingAdminClient }>();
const chains = ref<DisabledPaymentChain[]>([]);
const chainId = ref<number | string>('');
const name = ref('');
const confirmationsRequired = ref<number | string>('');
const busy = ref(false);
const error = ref(false);
const saved = ref(false);

function edit(chain: DisabledPaymentChain): void {
	chainId.value = chain.chainId;
	name.value = chain.name;
	confirmationsRequired.value = chain.confirmationsRequired;
	saved.value = false;
}

async function load(): Promise<void> {
	if (busy.value) return;
	busy.value = true;
	error.value = false;
	saved.value = false;
	try {
		chains.value = await props.client.listChains({});
	} catch {
		error.value = true;
	} finally {
		busy.value = false;
	}
}

async function save(): Promise<void> {
	if (busy.value) return;
	busy.value = true;
	error.value = false;
	saved.value = false;
	try {
		const chain = await props.client.upsertChain({
			chainId: Number(chainId.value), name: name.value,
			confirmationsRequired: Number(confirmationsRequired.value), isEnabled: false,
		});
		chains.value = [...chains.value.filter(existing => existing.chainId !== chain.chainId), chain];
		edit(chain);
		saved.value = true;
	} catch {
		error.value = true;
	} finally {
		busy.value = false;
	}
}
</script>

<locale lang="json" locale="ja-JP">
{
	"title": "支払いチェーン設定",
	"disabled": "この試作ではチェーンは無効のまま保存されます。支払いは開始されません。",
	"chainId": "チェーンID",
	"name": "チェーン名",
	"confirmations": "必要な承認数",
	"load": "設定を読み込む",
	"save": "保存",
	"saved": "無効なチェーン設定を保存しました。",
	"failed": "設定を読み込み・保存できませんでした。"
}
</locale>
