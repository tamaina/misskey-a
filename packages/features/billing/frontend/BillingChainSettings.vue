<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ $locale.sfc.title }}</template>
		<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	</FormSection>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="saved" role="status">{{ $locale.sfc.saved }}</MkInfo>
	<MkInfo v-if="checkedChainId === chainId && checkedChainId != null" role="status">{{ $locale.sfc.rpcPassed }}</MkInfo>
	<MkInfo v-if="deleted" role="status">{{ $locale.sfc.deleted }}</MkInfo>
	<div class="_buttons"><MkButton rounded :disabled="busy" @click="load"><i class="ti ti-refresh"></i> {{ $locale.sfc.load }}</MkButton></div>
	<div v-if="chains.length" class="_buttons">
		<MkButton v-for="chain in chains" :key="chain.chainId" rounded :disabled="busy" @click="edit(chain)">{{ chain.name }} ({{ chain.chainId }})</MkButton>
	</div>
	<FormSection>
		<template #label>{{ $locale.sfc.edit }}</template>
		<form class="_gaps_m" @submit.prevent="save">
			<FormSplit>
				<MkInput v-model="chainId" type="number" :min="1" :max="Number.MAX_SAFE_INTEGER" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.chainId }}</template></MkInput>
				<MkInput v-model="nativeCurrencyDecimals" type="number" :min="0" :max="255" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.decimals }}</template></MkInput>
			</FormSplit>
			<MkInput v-model="name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
			<MkInput v-model="nativeCurrencyName" required :disabled="busy"><template #label>{{ $locale.sfc.currencyName }}</template></MkInput>
			<MkInput v-model="nativeCurrencySymbol" required :disabled="busy"><template #label>{{ $locale.sfc.currencySymbol }}</template></MkInput>
			<MkInput v-model="blockExplorerUrl" type="url" :disabled="busy"><template #label>{{ $locale.sfc.explorer }}</template></MkInput>
			<MkSwitch v-model="isEnabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
			<MkInfo>{{ hasRpc ? $locale.sfc.rpcConfigured : $locale.sfc.rpcMissing }}</MkInfo>
			<MkInput v-model="rpcUrl" type="password" autocomplete="new-password" :disabled="busy || clearRpc"><template #label>{{ $locale.sfc.rpc }}</template><template #caption>{{ $locale.sfc.rpcCaption }}</template></MkInput>
			<MkSwitch v-model="clearRpc" :disabled="busy">{{ $locale.sfc.clearRpc }}</MkSwitch>
			<MkInfo v-if="props.catalogClient">{{ $locale.sfc.rpcTestCaption }}</MkInfo>
			<div v-if="props.catalogClient" class="_buttons"><MkButton :disabled="busy || chainId == null" @click="testRpc">{{ $locale.sfc.testRpc }}</MkButton><MkButton danger :disabled="busy || chainId == null || !chains.some(row => row.chainId === chainId)" @click="deleteChain">{{ $locale.sfc.deleteChain }}</MkButton></div>
			<div class="_buttons"><MkButton type="submit" primary rounded :disabled="busy" :wait="busy"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton></div>
		</form>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import * as os from '@features/ui/frontend/os.js';
import type { CatalogAdminClient } from './catalog-client.js';
import { ref } from 'vue';
import type { WalletChainSettings } from '../backend/api.definition.js';
import type { WalletChainAdminClient } from './admin-client.js';

const props = defineProps<{ client: WalletChainAdminClient; catalogClient?: Pick<CatalogAdminClient, 'testBillingChainRpc' | 'deleteBillingChain'> }>();
const chains = ref<WalletChainSettings[]>([]);
const chainId = ref<number | null>(null);
const name = ref('');
const nativeCurrencyDecimals = ref<number | null>(null);
const nativeCurrencyName = ref('');
const nativeCurrencySymbol = ref('');
const blockExplorerUrl = ref('');
const isEnabled = ref(false);
const hasRpc = ref(false);
const rpcUrl = ref('');
const clearRpc = ref(false);
const busy = ref(false);
const error = ref(false);
const saved = ref(false);
const checkedChainId = ref<number | null>(null), deleted = ref(false);

function edit(chain: WalletChainSettings): void {
	chainId.value = chain.chainId;
	name.value = chain.name;
	nativeCurrencyDecimals.value = chain.nativeCurrencyDecimals;
	nativeCurrencyName.value = chain.nativeCurrencyName;
	nativeCurrencySymbol.value = chain.nativeCurrencySymbol;
	blockExplorerUrl.value = chain.blockExplorerUrl ?? '';
	isEnabled.value = chain.isEnabled;
	hasRpc.value = chain.hasRpc;
	rpcUrl.value = '';
	clearRpc.value = false;
	saved.value = false; checkedChainId.value = null; deleted.value = false;
}

async function load(): Promise<void> {
	if (busy.value) return;
	busy.value = true;
	error.value = false;
	saved.value = false; checkedChainId.value = null; deleted.value = false;
	try {
		chains.value = await props.client.listChainSettings({});
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
	saved.value = false; checkedChainId.value = null; deleted.value = false;
	try {
		const chain = await props.client.upsertChainSettings({
			chainId: Number(chainId.value), name: name.value,
			nativeCurrencyDecimals: Number(nativeCurrencyDecimals.value), nativeCurrencyName: nativeCurrencyName.value,
			nativeCurrencySymbol: nativeCurrencySymbol.value, blockExplorerUrl: blockExplorerUrl.value || null,
			isEnabled: isEnabled.value, ...(clearRpc.value ? { rpcUrl: null } : rpcUrl.value ? { rpcUrl: rpcUrl.value } : {}),
		});
		chains.value = [...chains.value.filter(existing => existing.chainId !== chain.chainId), chain];
		edit(chain);
		saved.value = true;
	} catch {
		error.value = true;
	} finally {
		rpcUrl.value = '';
		busy.value = false;
	}
}

async function testRpc() {
	if (busy.value || chainId.value == null || !props.catalogClient) return;
	busy.value = true; error.value = false; saved.value = false; checkedChainId.value = null; deleted.value = false;
	try { await props.catalogClient.testBillingChainRpc({ chainId: chainId.value }); checkedChainId.value = chainId.value; } catch { error.value = true; } finally { busy.value = false; }
}

async function deleteChain() {
	const selected = chainId.value;
	if (busy.value || selected == null || !props.catalogClient || (await os.confirm({ type: 'warning', text: $locale.value.sfc.deleteConfirmation })).canceled) return;
	busy.value = true; error.value = false; saved.value = false; checkedChainId.value = null; deleted.value = false;
	try { await props.catalogClient.deleteBillingChain({ chainId: selected }); chains.value = await props.client.listChainSettings({}); chainId.value = null; deleted.value = true; } catch { error.value = true; } finally { busy.value = false; }
}
</script>

<locale lang="json" locale="ja-JP">
{"rpcPassed":"保存済みRPCのチェーンIDが一致しました。","deleted":"チェーンを削除しました。","rpcTestCaption":"RPC確認は保存済み設定を使います。入力したURLは保存後に確認できます。","testRpc":"チェーンRPCを確認","deleteChain":"チェーンを削除","deleteConfirmation":"チェーンと登録済み決済先を削除しますか？価格履歴と既存の注文・返金記録は保持します。",
	"title": "ウォレットのチェーン設定",
	"edit": "チェーン情報",
	"scope": "ウォレット登録用のチェーン設定です。サービスの価格や支払い処理は設定しません。",
	"chainId": "チェーンID",
	"name": "チェーン名",
	"decimals": "通貨の小数桁数",
	"currencyName": "ネイティブ通貨名",
	"currencySymbol": "ネイティブ通貨記号",
	"explorer": "ブロックエクスプローラーURL（任意）",
	"enabled": "登録画面のチェーン一覧に表示する",
	"rpc": "RPC URL（HTTPS）",
	"rpcCaption": "空欄は保存済みのURLを維持します。保存後にURLは表示されません。",
	"rpcConfigured": "RPC URLは設定済みです。",
	"rpcMissing": "RPC URLが未設定のため登録画面には表示されません。",
	"clearRpc": "保存済みのRPC URLを削除する",
	"load": "設定を読み込む",
	"save": "保存",
	"saved": "チェーン設定を保存しました。",
	"failed": "設定を読み込み・保存できませんでした。"
}
</locale>
