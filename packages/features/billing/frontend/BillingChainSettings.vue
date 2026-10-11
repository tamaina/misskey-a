<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ $locale.sfc.title }}</template>
		<MkInfo>{{ $locale.sfc.disabled }}</MkInfo>
	</FormSection>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="saved" role="status">{{ $locale.sfc.saved }}</MkInfo>
	<div class="_buttons"><MkButton rounded :disabled="busy" @click="load"><i class="ti ti-refresh"></i> {{ $locale.sfc.load }}</MkButton></div>
	<div v-if="chains.length" class="_buttons">
		<MkButton v-for="chain in chains" :key="chain.chainId" rounded :disabled="busy" @click="edit(chain)">{{ chain.name }} ({{ chain.chainId }})</MkButton>
	</div>
	<FormSection>
		<template #label>{{ $locale.sfc.edit }}</template>
		<form class="_gaps_m" @submit.prevent="save">
			<FormSplit>
				<MkInput v-model="chainId" type="number" :min="1" :max="Number.MAX_SAFE_INTEGER" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.chainId }}</template></MkInput>
				<MkInput v-model="confirmationsRequired" type="number" :min="1" :max="Number.MAX_SAFE_INTEGER" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.confirmations }}</template></MkInput>
			</FormSplit>
			<MkInput v-model="name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
			<div class="_buttons"><MkButton type="submit" primary rounded :disabled="busy" :wait="busy"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton></div>
		</form>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import { ref } from 'vue';
import type { DisabledPaymentChain } from '../backend/api.definition.js';
import type { BillingAdminClient } from './admin-client.js';

const props = defineProps<{ client: BillingAdminClient }>();
const chains = ref<DisabledPaymentChain[]>([]);
const chainId = ref<number | null>(null);
const name = ref('');
const confirmationsRequired = ref<number | null>(null);
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
	"edit": "チェーン情報",
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
