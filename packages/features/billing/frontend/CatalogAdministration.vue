<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="saved" role="status">{{ $locale.sfc.saved }}</MkInfo>
	<MkInfo v-if="checkedChainId === deployment.chainId" role="status">{{ $locale.sfc.rpcPassed }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton>
	<FormSection>
		<template #label>{{ $locale.sfc.assets }}</template>
		<div class="_buttons"><MkButton :disabled="busy" @click="asset = emptyAsset()">{{ $locale.sfc.newAsset }}</MkButton><MkButton v-for="row in assets" :key="row.id" :disabled="busy" @click="asset = { ...row }">{{ row.name }}</MkButton></div>
		<form class="_gaps_m" @submit.prevent="saveAsset">
			<MkInput v-model="asset.id" required :disabled="busy"><template #label>{{ $locale.sfc.id }}</template></MkInput>
			<MkInput v-model="asset.pricingAssetKey" required :disabled="busy"><template #label>{{ $locale.sfc.pricingAssetKey }}</template></MkInput>
			<MkInput v-model="asset.name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
			<MkInput v-model="asset.symbol" required :disabled="busy"><template #label>{{ $locale.sfc.symbol }}</template></MkInput>
			<MkInput v-model="asset.currencyCode" required :disabled="busy"><template #label>{{ $locale.sfc.currencyCode }}</template></MkInput>
			<MkSwitch v-model="asset.isEnabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
			<div class="_buttons"><MkButton type="submit" primary :disabled="busy">{{ $locale.sfc.save }}</MkButton><MkButton danger :disabled="busy || !assets.some(row => row.id === asset.id)" @click="deleteAsset">{{ $locale.sfc.delete }}</MkButton></div>
		</form>
	</FormSection>
	<FormSection>
		<template #label>{{ $locale.sfc.deployments }}</template>
		<div class="_buttons"><MkButton :disabled="busy" @click="deployment = emptyDeployment()">{{ $locale.sfc.newDeployment }}</MkButton><MkButton v-for="row in deployments" :key="row.id" :disabled="busy" @click="deployment = { ...row }; checkedChainId = null">{{ row.tokenSymbol }} ({{ row.chainId }})</MkButton></div>
		<form class="_gaps_m" @submit.prevent="saveDeployment">
			<MkSelect v-model="deployment.assetId" :items="assets.map(row => ({ value: row.id, label: row.name }))" :disabled="busy"><template #label>{{ $locale.sfc.assetId }}</template></MkSelect>
			<MkInput v-model="deployment.id" required :disabled="busy"><template #label>{{ $locale.sfc.id }}</template></MkInput>
			<MkInput v-model="deployment.chainId" type="number" :min="1" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.chainId }}</template></MkInput>
			<MkInput v-model="deployment.contractAddress" required :disabled="busy"><template #label>{{ $locale.sfc.contractAddress }}</template></MkInput>
			<MkInput v-model="deployment.recipientAddress" required :disabled="busy"><template #label>{{ $locale.sfc.recipientAddress }}</template></MkInput>
			<MkInput v-model="deployment.tokenSymbol" required :disabled="busy"><template #label>{{ $locale.sfc.tokenSymbol }}</template></MkInput>
			<MkInput v-model="deployment.tokenName" required :disabled="busy"><template #label>{{ $locale.sfc.tokenName }}</template></MkInput>
			<MkInput v-model="deployment.decimals" type="number" :min="0" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.decimals }}</template></MkInput>
			<MkSwitch v-model="deployment.isEnabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
			<div class="_buttons"><MkButton :disabled="busy" @click="resolve">{{ $locale.sfc.resolve }}</MkButton><MkButton :disabled="busy" @click="testRpc">{{ $locale.sfc.testRpc }}</MkButton><MkButton type="submit" primary :disabled="busy">{{ $locale.sfc.save }}</MkButton><MkButton danger :disabled="busy || !deployments.some(row => row.id === deployment.id)" @click="deleteDeployment">{{ $locale.sfc.delete }}</MkButton></div>
		</form>
	</FormSection>
	<FormSection>
		<template #label>{{ $locale.sfc.prices }}</template>
		<form class="_gaps_m" @submit.prevent="attach">
			<MkSelect v-model="priceId" :items="prices.map(row => ({ value: row.priceId, label: `${row.offer.name} (${row.priceId})` }))" :disabled="busy"><template #label>{{ $locale.sfc.price }}</template></MkSelect>
			<MkSelect v-model="deploymentId" :items="deployments.map(row => ({ value: row.id, label: `${row.tokenSymbol} (${row.chainId})` }))" :disabled="busy"><template #label>{{ $locale.sfc.deployment }}</template></MkSelect>
			<MkInput v-model="offerId" required :disabled="busy"><template #label>{{ $locale.sfc.offerId }}</template></MkInput>
			<div class="_buttons"><MkButton type="submit" primary :disabled="busy || !priceId || !deploymentId">{{ $locale.sfc.attach }}</MkButton><MkButton danger :disabled="busy || !priceId" @click="deletePrice">{{ $locale.sfc.delete }}</MkButton></div>
		</form>
	</FormSection>
</div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import * as v from 'valibot';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import * as os from '@features/ui/frontend/os.js';
import { pricingAsset, assetDeployment } from '../backend/catalog.schema.js';
import type { PricingAsset, AssetDeployment } from '../backend/catalog.schema.js';
import type { CatalogAdminClient } from './catalog-client.js';
const props = defineProps<{ client: CatalogAdminClient }>();
const emptyAsset = (): PricingAsset => ({ id: '', pricingAssetKey: '', name: '', symbol: '', currencyCode: '', isEnabled: false });
const emptyDeployment = (): AssetDeployment => ({ id: '', assetId: '', chainId: 0, contractAddress: '', recipientAddress: '', tokenSymbol: '', tokenName: '', decimals: 0, isEnabled: false });
const asset = ref(emptyAsset()), deployment = ref(emptyDeployment());
const assets = ref<PricingAsset[]>([]), deployments = ref<AssetDeployment[]>([]), prices = ref<Awaited<ReturnType<CatalogAdminClient['listCatalogPrices']>>>([]);
const busy = ref(false), error = ref(false), saved = ref(false), checkedChainId = ref<number | null>(null);
const priceId = ref(''), deploymentId = ref(''), offerId = ref('');

async function refresh() { [assets.value, deployments.value, prices.value] = await Promise.all([props.client.listPricingAssets({}), props.client.listAssetDeployments({}), props.client.listCatalogPrices({})]); }

async function run(action: () => Promise<unknown>, save = false) {
	if (busy.value) return; busy.value = true; error.value = false; saved.value = false;
	try { await action(); saved.value = save; } catch { error.value = true; } finally { busy.value = false; }
}

function load() { return run(refresh); }

function saveAsset() { return run(async () => { asset.value = await props.client.upsertPricingAsset(v.parse(pricingAsset, asset.value)); await refresh(); }, true); }

function saveDeployment() { return run(async () => { deployment.value = await props.client.upsertAssetDeployment(v.parse(assetDeployment, deployment.value)); await refresh(); }, true); }

function resolve() { return run(async () => { const result = await props.client.resolveTokenMetadata({ chainId: deployment.value.chainId, contractAddress: deployment.value.contractAddress }); deployment.value.decimals = result.decimals; if (result.tokenSymbol) deployment.value.tokenSymbol = result.tokenSymbol; if (result.tokenName) deployment.value.tokenName = result.tokenName; }); }

function testRpc() { checkedChainId.value = null; return run(async () => { await props.client.testBillingChainRpc({ chainId: deployment.value.chainId }); checkedChainId.value = deployment.value.chainId; }); }

function attach() { return run(async () => { await props.client.attachPriceDeployment({ sourcePriceId: priceId.value, deploymentId: deploymentId.value, offerId: offerId.value }); offerId.value = ''; await refresh(); }, true); }

async function remove(action: () => Promise<unknown>) { if (busy.value || (await os.confirm({ type: 'warning', text: $locale.value.sfc.confirmDelete })).canceled) return; await run(async () => { await action(); await refresh(); }, true); }

function deleteAsset() { const id = asset.value.id; return remove(async () => { await props.client.deletePricingAsset({ assetId: id }); asset.value = emptyAsset(); }); }

function deleteDeployment() { const id = deployment.value.id; return remove(async () => { await props.client.deleteAssetDeployment({ deploymentId: id }); deployment.value = emptyDeployment(); }); }

function deletePrice() { const id = priceId.value; return remove(async () => { await props.client.deleteCatalogPrice({ priceId: id }); priceId.value = ''; }); }
</script>
<locale lang="json" locale="ja-JP">
{"title":"課金資産と決済先","load":"読み込む","failed":"操作を完了できませんでした。","saved":"保存しました。","assets":"価格資産","deployments":"ERC20決済先","newAsset":"新しい価格資産","newDeployment":"新しい決済先","id":"ID","pricingAssetKey":"価格資産キー（同じ最小単位の価格を共有）","name":"表示名","symbol":"資産記号","currencyCode":"通貨コード（大文字3文字）","assetId":"価格資産","chainId":"チェーンID","tokenSymbol":"トークン記号","tokenName":"トークン名","contractAddress":"ERC20コントラクト","recipientAddress":"受取アドレス","decimals":"小数桁数","enabled":"有効","save":"保存","delete":"削除","confirmDelete":"削除しますか？既存の注文・返金記録は保持します。","resolve":"トークン情報を取得","testRpc":"チェーンRPCを確認","rpcPassed":"チェーンIDの一致を確認しました。","prices":"価格の決済先を追加","price":"記録済み価格","deployment":"決済先","offerId":"新しいオファーID","attach":"追加","scope":"価格資産を設定し、チェーンごとの決済先を登録します。価格はサービス設定で作成し、記録済み価格を別の決済先にも追加できます。"}
</locale>
