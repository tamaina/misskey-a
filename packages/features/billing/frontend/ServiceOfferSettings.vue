<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="saved" role="status">{{ $locale.sfc.saved }}</MkInfo>
	<div class="_buttons"><MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton></div>
	<div class="_buttons"><MkButton v-for="offer in offers" :key="offer.id" :disabled="busy" @click="select(offer)">{{ offer.name }}</MkButton></div>
	<form class="_gaps_m" @submit.prevent="save">
		<MkInput v-model="draft.id" required :disabled="busy"><template #label>{{ $locale.sfc.id }}</template></MkInput>
		<MkInput v-model="draft.serviceKey" required :disabled="busy"><template #label>{{ $locale.sfc.key }}</template></MkInput>
		<MkInput v-model="draft.catalogPriceId" :disabled="busy"><template #label>{{ $locale.sfc.priceId }}</template></MkInput>
		<MkSelect v-if="props.catalogClient" v-model="selectedDeploymentId" :items="[{ value: '', label: $locale.sfc.manualDeployment }, ...deployments.map(row => ({ value: row.id, label: `${row.tokenSymbol} (${row.chainId})` }))]" :disabled="busy" @update:modelValue="useDeployment"><template #label>{{ $locale.sfc.deployment }}</template></MkSelect>
		<MkInput v-model="draft.pricingAssetKey" :disabled="busy"><template #label>{{ $locale.sfc.asset }}</template></MkInput>
		<MkInput v-model="draft.planGroup" :disabled="busy"><template #label>{{ $locale.sfc.group }}</template></MkInput>
		<MkInput v-model="draft.sortOrder" type="number" :min="0" step="1" :disabled="busy"><template #label>{{ $locale.sfc.rank }}</template></MkInput>
		<MkInput v-model="draft.roleId" :disabled="busy"><template #label>{{ $locale.sfc.role }}</template></MkInput>
		<MkInput v-model="draft.name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
		<MkInput v-model="draft.chainId" type="number" :min="1" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.chain }}</template></MkInput>
		<MkInput v-model="draft.contractAddress" required :disabled="busy"><template #label>{{ $locale.sfc.contract }}</template></MkInput>
		<MkInput v-model="draft.recipientAddress" required :disabled="busy"><template #label>{{ $locale.sfc.recipient }}</template></MkInput>
		<MkInput v-model="draft.tokenSymbol" required :disabled="busy"><template #label>{{ $locale.sfc.symbol }}</template></MkInput>
		<MkInput v-model="draft.decimals" type="number" :min="0" :max="255" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.decimals }}</template></MkInput>
		<MkInput v-model="draft.amountBaseUnits" required :disabled="busy"><template #label>{{ $locale.sfc.amount }}</template><template #caption>{{ $locale.sfc.integer }}</template></MkInput>
		<MkInput v-model="priceStartDate" type="datetime-local" :disabled="busy"><template #label>{{ $locale.sfc.priceStart }}</template><template #caption>{{ $locale.sfc.utc }}</template></MkInput>
		<MkInput v-model="priceEndDate" type="datetime-local" :disabled="busy"><template #label>{{ $locale.sfc.priceEnd }}</template></MkInput>
		<MkInput v-model="draft.duration" type="number" :min="1" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.duration }}</template></MkInput>
		<MkSelect v-model="draft.durationUnit" :items="[{ value: 'days', label: $locale.sfc.days }, { value: 'months', label: $locale.sfc.months }, { value: 'years', label: $locale.sfc.years }]" :disabled="busy"><template #label>{{ $locale.sfc.unit }}</template></MkSelect>
		<MkInput v-model="draft.confirmationsRequired" type="number" :min="1" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.confirmations }}</template></MkInput>
		<MkSwitch v-model="draft.isEnabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
		<MkButton type="submit" primary :disabled="busy" :wait="busy">{{ $locale.sfc.save }}</MkButton>
	</form>
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
import { serviceOffer } from '../backend/api.definition.js';
import type { ServiceOffer } from '../backend/api.definition.js';
import type { CatalogAdminClient } from './catalog-client.js';
import type { AssetDeployment, PricingAsset } from '../backend/catalog.schema.js';
import type { OfferAdminClient } from './service-client.js';
const props = defineProps<{ client: OfferAdminClient; catalogClient?: CatalogAdminClient }>();
const offers = ref<ServiceOffer[]>([]);
const deployments = ref<AssetDeployment[]>([]), assets = ref<PricingAsset[]>([]), selectedDeploymentId = ref('');

function useDeployment() {
	const deployment = deployments.value.find(row => row.id === selectedDeploymentId.value);
	if (!deployment) { delete draft.value.deploymentId; delete draft.value.currencyCode; return; }
	const asset = assets.value.find(row => row.id === deployment.assetId);
	if (!asset) return;
	Object.assign(draft.value, { deploymentId: deployment.id, pricingAssetKey: asset.pricingAssetKey, currencyCode: asset.currencyCode, chainId: deployment.chainId, contractAddress: deployment.contractAddress, recipientAddress: deployment.recipientAddress, tokenSymbol: deployment.tokenSymbol, decimals: deployment.decimals });
}

// No monetary/recipient defaults. Blank inputs require an explicit admin policy.
const draft = ref<Omit<ServiceOffer, 'pricingAssetKey' | 'planGroup' | 'sortOrder' | 'catalogPriceId'> & { roleId: string | null; catalogPriceId: string | null; pricingAssetKey: string | null; planGroup: string | null; sortOrder: number | null }>({ roleId: null, catalogPriceId: null, pricingAssetKey: null, planGroup: null, sortOrder: null, id: '', serviceKey: '', name: '', chainId: 0, contractAddress: '', recipientAddress: '', tokenSymbol: '', decimals: 0, amountBaseUnits: '', duration: 0, durationUnit: 'days', confirmationsRequired: 0, isEnabled: false });
const priceStartDate = ref(''), priceEndDate = ref('');

function select(offer: ServiceOffer) {
	selectedDeploymentId.value = offer.deploymentId ?? '';
	draft.value = { ...offer, roleId: offer.roleId ?? null, catalogPriceId: offer.catalogPriceId ?? null, pricingAssetKey: offer.pricingAssetKey ?? null, planGroup: offer.planGroup ?? null, sortOrder: offer.sortOrder ?? null };
	priceStartDate.value = offer.priceStartsAt == null ? '' : new Date(offer.priceStartsAt).toISOString().slice(0, 16);
	priceEndDate.value = offer.priceExpiresAt == null ? '' : new Date(offer.priceExpiresAt).toISOString().slice(0, 16);
}

function parsePriceDate(input: string, previous: number | null | undefined): number {
	return previous != null && new Date(previous).toISOString().slice(0, 16) === input ? previous : Date.parse(`${input}Z`);
}

const busy = ref(false), error = ref(false), saved = ref(false);

async function load() {
	busy.value = true; error.value = false; saved.value = false;
	try { offers.value = await props.client.listOfferSettings({}); if (props.catalogClient) [deployments.value, assets.value] = await Promise.all([props.catalogClient.listAssetDeployments({}), props.catalogClient.listPricingAssets({})]); } catch { error.value = true; } finally { busy.value = false; }
}

async function save() {
	busy.value = true; error.value = false; saved.value = false;
	try { if (priceEndDate.value && !priceStartDate.value) throw new Error('Price start required'); const { catalogPriceId, pricingAssetKey, planGroup, sortOrder, priceStartsAt, priceExpiresAt, ...base } = draft.value; const input = v.parse(serviceOffer, { ...base, roleId: draft.value.roleId || null, ...(priceStartDate.value ? { priceStartsAt: parsePriceDate(priceStartDate.value, priceStartsAt), priceExpiresAt: priceEndDate.value ? parsePriceDate(priceEndDate.value, priceExpiresAt) : null } : {}), ...(catalogPriceId?.trim() ? { catalogPriceId: catalogPriceId.trim() } : {}), ...(pricingAssetKey?.trim() ? { pricingAssetKey: pricingAssetKey.trim() } : {}), ...(planGroup?.trim() ? { planGroup: planGroup.trim() } : {}), ...(typeof sortOrder === 'number' && !Number.isNaN(sortOrder) ? { sortOrder } : {}) }); const savedOffer = await props.client.upsertOffer(input); draft.value = { ...savedOffer, roleId: savedOffer.roleId ?? null, catalogPriceId: savedOffer.catalogPriceId ?? null, pricingAssetKey: savedOffer.pricingAssetKey ?? null, planGroup: savedOffer.planGroup ?? null, sortOrder: savedOffer.sortOrder ?? null }; offers.value = await props.client.listOfferSettings({}); saved.value = true; } catch { error.value = true; } finally { busy.value = false; }
}
</script>
<locale lang="json" locale="ja-JP">
{"deployment":"登録済み決済先","manualDeployment":"手動設定（旧オファー）","priceId":"価格ID（同じ価格を複数の決済先で提供する場合に共通指定）","priceStart":"価格の販売開始日時（空欄は履歴不明の旧設定）","priceEnd":"販売終了日時（空欄は終了なし）","utc":"UTCで入力します。記録済み価格は上書きせず、新しいIDと販売期間で追加してください。","scope":"固定期間のサービス契約を設定します。通常の手動ロールを指定すると、支払を確認した期間内だけ適用します。価格・受取先・必要確認数を管理者が明示してください。チェーンとRPCはウォレット設定で管理します。","failed":"設定を読み込み・保存できませんでした。","saved":"サービス設定を保存しました。","load":"読み込む","asset":"価格資産キー（同じ最小単位の原価格を共有する場合のみ）","group":"プラン群（順位を比較するサービス群）","rank":"プラン順位（上位ほど大きい値）","role":"適用する通常ロールID（空欄なら期間記録のみ）","id":"オファーID","key":"サービスキー（同じキーの期間を延長）","name":"表示名","chain":"チェーンID","contract":"ERC20コントラクト","recipient":"サーバーの受取アドレス","symbol":"トークン表示名","decimals":"小数桁数","amount":"価格（最小単位の整数）","integer":"小数ではなく、ERC20の最小単位で入力します。","duration":"契約期間","unit":"期間の単位","days":"日","months":"月","years":"年","confirmations":"必要確認数","enabled":"新しい注文を有効にする","save":"保存"}
</locale>
