<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton>
	<form class="_gaps_m" @submit.prevent="create">
		<MkSelect v-model="offerId" :items="offerItems" :disabled="busy"><template #label>{{ $locale.sfc.offer }}</template></MkSelect>
		<MkInfo v-for="item in catalogItems.filter(row => row.offer.id === offerId)" :key="item.offer.id">
			<template v-if="item.dealDisplay.canShowDeal && item.dealDisplay.referenceAmountBaseUnits != null">{{ $locale.sfc.reference }}: <s>{{ formatServiceAmount(item.dealDisplay.referenceAmountBaseUnits, item.offer.decimals) }} {{ item.offer.tokenSymbol }}</s><br></template>
			<template v-if="item.priceDisplayWindow.previousPeriod">{{ $locale.sfc.previous }}: {{ formatServiceAmount(item.priceDisplayWindow.previousPeriod.amountBaseUnits, item.offer.decimals) }} {{ item.offer.tokenSymbol }}<br></template>
			{{ $locale.sfc.current }}: {{ formatServiceAmount(item.offer.amountBaseUnits, item.offer.decimals) }} {{ item.offer.tokenSymbol }}
			<template v-if="item.priceDisplayWindow.nextPeriod"><br>{{ $locale.sfc.next }}: {{ formatServiceAmount(item.priceDisplayWindow.nextPeriod.amountBaseUnits, item.offer.decimals) }} {{ item.offer.tokenSymbol }} / {{ new Date(item.priceDisplayWindow.nextPeriod.startsAt).toISOString() }}</template>
		</MkInfo>
		<MkInfo v-if="requirementsError" warn>{{ $locale.sfc.requirementsFailed }}</MkInfo>
		<MkInfo v-if="requirements?.isRequired && requirements.statement">{{ requirements.statement.statement }}</MkInfo>
		<MkSwitch v-if="requirements?.isRequired" v-model="agreed" :disabled="busy">{{ $locale.sfc.agree }}</MkSwitch>
		<MkSelect v-model="walletId" :items="walletItems" :disabled="busy"><template #label>{{ $locale.sfc.wallet }}</template></MkSelect>
		<MkButton type="submit" :disabled="busy || !offerId || !walletId || requirementsError || (props.getRequirements && !requirements) || (requirements?.isRequired && !agreed)">{{ $locale.sfc.create }}</MkButton>
	</form>
	<div v-for="order in orders" :key="order.id" class="_gaps_s">
		<MkInfo>{{ order.offer.name }} / {{ order.status }} / {{ order.id }}<br>{{ $locale.sfc.token }}: {{ order.offer.chainId }} / {{ order.offer.contractAddress }}<br>{{ $locale.sfc.recipient }}: {{ order.offer.recipientAddress }}<br>{{ $locale.sfc.amount }}: {{ formatServiceAmount((order.amountBaseUnits ?? order.offer.amountBaseUnits), order.offer.decimals) }} {{ order.offer.tokenSymbol }} / {{ (order.amountBaseUnits ?? order.offer.amountBaseUnits) }} ({{ order.offer.decimals }} {{ $locale.sfc.decimals }})<br>{{ $locale.sfc.deadline }}: {{ new Date(order.expiresAt).toISOString() }}<br v-if="order.endsAt">{{ order.startsAt ? new Date(order.startsAt).toISOString() : '' }} — {{ order.endsAt ? new Date(order.endsAt).toISOString() : '' }}</MkInfo>
		<MkButton v-if="order.status === 'paid' && props.getReceipt" :disabled="busy" @click="loadReceipt(order.id)">{{ $locale.sfc.receipt }}</MkButton>
		<form v-if="order.status === 'pending'" class="_gaps_s" @submit.prevent="check(order)">
			<MkInput v-model="hashes[order.id]" :disabled="busy || !!order.txHash"><template #label>{{ $locale.sfc.hash }}</template><template #caption>{{ order.txHash ?? $locale.sfc.hashCaption }}</template></MkInput>
			<MkButton type="submit" :disabled="busy">{{ $locale.sfc.check }}</MkButton>
		<MkButton v-if="!order.txHash" :disabled="busy" @click="cancel(order)">{{ $locale.sfc.cancel }}</MkButton>
		</form>
	</div>
	<PurchaseReceipt v-if="receipt" :receipt="receipt"/>
</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import type { BillingPolicyClient } from './policy-client.js';
import type { ResidencyConsent } from '../backend/policy.schema.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import PurchaseReceipt from './PurchaseReceipt.vue';
import type { ServiceBillingClient } from './service-client.js';
import { formatServiceAmount } from './service-client.js';
import type { ServiceAccountClient } from './service-client.js';
import type { LinkedWallet, ServiceOffer, ServiceOrder, CatalogOffer } from '../backend/api.definition.js';
const props = defineProps<{ client: ServiceAccountClient; listWallets: () => Promise<LinkedWallet[]>; getRequirements?: BillingPolicyClient['getPurchaseRequirements']; getReceipt?: ServiceBillingClient['getReceipt'] }>();
const offers = ref<ServiceOffer[]>([]), wallets = ref<LinkedWallet[]>([]), orders = ref<ServiceOrder[]>([]);
const receipt = ref<Awaited<ReturnType<ServiceBillingClient['getReceipt']>> | null>(null);
const requirements = ref<Awaited<ReturnType<BillingPolicyClient['getPurchaseRequirements']>> | null>(null), requirementsError = ref(false), agreed = ref(false);
const catalogItems = ref<CatalogOffer[]>([]);
const offerId = ref(''), walletId = ref(''), hashes = ref<Record<string, string>>({});
const offerItems = computed(() => offers.value.map(offer => ({ value: offer.id, label: `${offer.name}: ${formatServiceAmount(offer.amountBaseUnits, offer.decimals)} ${offer.tokenSymbol} / ${offer.duration} ${offer.durationUnit}` })));
const walletItems = computed(() => wallets.value.map(wallet => ({ value: wallet.id, label: `${wallet.chainId} / ${wallet.address}` })));
const busy = ref(false), error = ref(false);
let retry: { offerId: string; walletId: string; requestKey: string; quotedOffer: ServiceOffer; quotedQuote?: Awaited<ReturnType<ServiceAccountClient['quoteOrder']>>; residencyConsent?: ResidencyConsent } | undefined;

async function run(action: () => Promise<void>) {
	if (busy.value) return;
	busy.value = true; error.value = false;
	try { await action(); } catch { error.value = true; } finally { busy.value = false; }
}

async function loadReceipt(orderId: string) { await run(async () => { if (props.getReceipt) receipt.value = await props.getReceipt({ orderId }); }); }

async function refreshHistory() { orders.value = await props.client.listOrders({}); }

async function load() { await run(async () => { requirements.value = null; agreed.value = false; catalogItems.value = await props.client.listCatalog({}); offers.value = catalogItems.value.map(item => item.offer); wallets.value = await props.listWallets(); await refreshHistory(); if (props.getRequirements) { requirements.value = null; agreed.value = false; try { requirements.value = await props.getRequirements({}); requirementsError.value = false; agreed.value = false; } catch { requirementsError.value = true; } } }); }

async function create() {
	await run(async () => {
		const quotedOffer = offers.value.find(offer => offer.id === offerId.value);
		if (!quotedOffer) throw new Error('Offer unavailable');
		if (requirementsError.value || (props.getRequirements && !requirements.value) || (requirements.value?.isRequired && !agreed.value)) throw new Error('Residency consent required');
		if (!retry || retry.offerId !== offerId.value || retry.walletId !== walletId.value || JSON.stringify(retry.quotedOffer) !== JSON.stringify(quotedOffer)) { const quotedQuote = await props.client.quoteOrder({ offerId: quotedOffer.id }); retry = { offerId: offerId.value, walletId: walletId.value, requestKey: crypto.randomUUID(), quotedOffer, quotedQuote, ...(requirements.value?.isRequired && requirements.value.statement ? { residencyConsent: { statementId: requirements.value.statement.id, agreed: true } as const } : {}) }; }
		await props.client.createOrder(retry); retry = undefined; await refreshHistory();
	});
}

async function cancel(order: ServiceOrder) { await run(async () => { await props.client.cancelOrder({ orderId: order.id }); await refreshHistory(); }); }

async function check(order: ServiceOrder) {
	await run(async () => { await props.client.checkOrder({ orderId: order.id, ...(!order.txHash && hashes.value[order.id] ? { txHash: hashes.value[order.id] } : {}) }); await refreshHistory(); });
}

</script>
<locale lang="json" locale="ja-JP">
{"receipt":"領収書を表示","requirementsFailed":"新規購入の地域条件を確認できませんでした。履歴は引き続き閲覧できます。","agree":"表示された居住地声明に同意して購入します。","reference":"基準価格（元の販売期間条件を満たす価格）","previous":"前の価格","current":"現在価格","next":"次の価格","scope":"固定期間のサービス契約の試作です。注文と確認済み期間を記録しますが、管理者が紐付けた通常ロールは確認済み期間内だけ有効です。この画面は署名・送金・自動更新を実行しません。","failed":"処理できませんでした。設定と入力を確認してください。","load":"読み込む","offer":"サービス","wallet":"登録済みの支払ウォレット","create":"注文を作成","hash":"トランザクションハッシュ","hashCaption":"注文期限内に提出します。別のハッシュへの変更はできません。","check":"確認する","detectScope":"選択したトークンについて、登録済みの別アカウント間の送金を検出します。自分が送信者または受信者であるイベントのみ記録できます。","log":"ログインデックス","detect":"送金を検出","pending":"未確認です。後で再確認してください。","decimals":"小数桁","token":"チェーン / コントラクト","recipient":"受取先","amount":"金額（最小単位）","cancel":"送信前の注文を取り消す","deadline":"ハッシュ提出期限"}
</locale>
