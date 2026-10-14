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
		<MkButton :disabled="busy || !offerId" @click="prepareQuote">{{ $locale.sfc.previewQuote }}</MkButton>
		<MkInfo v-if="selectedQuote && selectedOffer">
			{{ $locale.sfc.base }}: {{ formatServiceAmount(selectedQuote.quote.baseAmountBaseUnits, selectedOffer.decimals) }} {{ selectedOffer.tokenSymbol }}<br>
			{{ $locale.sfc.discount }}: {{ formatServiceAmount(selectedQuote.quote.discountBaseUnits, selectedOffer.decimals) }} {{ selectedOffer.tokenSymbol }}<br>
			{{ $locale.sfc.payable }}: {{ formatServiceAmount(selectedQuote.quote.payableAmountBaseUnits, selectedOffer.decimals) }} {{ selectedOffer.tokenSymbol }}<br>
			{{ $locale.sfc.period }}: {{ new Date(selectedQuote.quote.effectiveStartsAt).toISOString() }} - {{ new Date(selectedQuote.quote.effectiveExpiresAt).toISOString() }}<br>
			<template v-if="selectedQuote.quote.currentPlan">{{ selectedQuote.quote.currentPlan.name }} / {{ formatServiceAmount(selectedQuote.quote.currentPlan.priceAmountBaseUnits, selectedOffer.decimals) }} {{ selectedOffer.tokenSymbol }} / {{ selectedQuote.quote.currentPlan.priceDurationDays }} {{ $locale.sfc.durationUnits[selectedQuote.quote.currentPlan.priceDurationUnit] }} / {{ selectedQuote.quote.discountBaseUnits === '0' ? $locale.sfc.afterTail : $locale.sfc.prorated }}<br></template>
			{{ $locale.sfc.quoteDeadline }}: {{ new Date(selectedQuote.quote.quoteExpiresAt).toISOString() }}
		</MkInfo>
		<MkInfo v-if="requirementsError" warn>{{ $locale.sfc.requirementsFailed }}</MkInfo>
		<MkInfo v-if="requirements?.isRequired && requirements.statement">{{ requirements.statement.statement }}</MkInfo>
		<MkSwitch v-if="requirements?.isRequired" v-model="agreed" :disabled="busy">{{ $locale.sfc.agree }}</MkSwitch>
		<MkSelect v-model="walletId" :items="walletItems" :disabled="busy"><template #label>{{ $locale.sfc.wallet }}</template></MkSelect>
		<MkButton type="submit" :disabled="busy || !offerId || !walletId || (props.requireQuotePreview && !selectedQuote) || requirementsError || (props.getRequirements && !requirements) || (requirements?.isRequired && !agreed)">{{ $locale.sfc.create }}</MkButton>
	</form>
	<div v-for="order in orders" :key="order.id" class="_gaps_s">
		<MkInfo>{{ order.offer.name }} / {{ order.status }} / {{ order.id }}<br>{{ $locale.sfc.token }}: {{ order.offer.chainId }} / {{ order.offer.contractAddress }}<br>{{ $locale.sfc.recipient }}: {{ order.offer.recipientAddress }}<br>{{ $locale.sfc.amount }}: {{ formatServiceAmount((order.amountBaseUnits ?? order.offer.amountBaseUnits), order.offer.decimals) }} {{ order.offer.tokenSymbol }} / {{ (order.amountBaseUnits ?? order.offer.amountBaseUnits) }} ({{ order.offer.decimals }} {{ $locale.sfc.decimals }})<br>{{ $locale.sfc.deadline }}: {{ new Date(order.expiresAt).toISOString() }}<br v-if="order.endsAt">{{ order.startsAt ? new Date(order.startsAt).toISOString() : '' }} — {{ order.endsAt ? new Date(order.endsAt).toISOString() : '' }}</MkInfo>
		<MkInfo v-if="order.quote">{{ $locale.sfc.base }}: {{ formatServiceAmount(order.quote.baseAmountBaseUnits, order.offer.decimals) }} {{ order.offer.tokenSymbol }} / {{ $locale.sfc.discount }}: {{ formatServiceAmount(order.quote.discountBaseUnits, order.offer.decimals) }} {{ order.offer.tokenSymbol }}<br>{{ $locale.sfc.period }}: {{ new Date(order.quote.effectiveStartsAt).toISOString() }} - {{ new Date(order.quote.effectiveExpiresAt).toISOString() }}<template v-if="order.quote.currentPlan"><br>{{ order.quote.currentPlan.name }} / {{ formatServiceAmount(order.quote.currentPlan.priceAmountBaseUnits, order.offer.decimals) }} {{ order.offer.tokenSymbol }} / {{ order.quote.currentPlan.priceDurationDays }} {{ $locale.sfc.durationUnits[order.quote.currentPlan.priceDurationUnit] }} / {{ order.quote.discountBaseUnits === '0' ? $locale.sfc.afterTail : $locale.sfc.prorated }}</template></MkInfo>
		<MkButton v-if="order.status === 'paid' && props.getReceipt" :disabled="busy" @click="loadReceipt(order.id)">{{ $locale.sfc.receipt }}</MkButton>
		<form v-if="order.status === 'pending'" class="_gaps_s" @submit.prevent="check(order)">
			<MkInput v-model="hashes[order.id]" :disabled="busy || !!order.txHash"><template #label>{{ $locale.sfc.hash }}</template><template #caption>{{ order.txHash ?? $locale.sfc.hashCaption }}</template></MkInput>
			<MkButton type="submit" :disabled="busy">{{ $locale.sfc.check }}</MkButton>
			<MkButton v-if="!order.txHash" :disabled="busy" @click="cancel(order)">{{ $locale.sfc.cancel }}</MkButton>
		</form>
	</div>
	<PurchaseReceipt v-if="receipt" :receipt="receipt"/>
	<MkButton v-if="nextHistoryCursor" :disabled="busy" @click="nextHistory">{{ $locale.sfc.nextHistory }}</MkButton>
</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import PurchaseReceipt from './PurchaseReceipt.vue';
import { formatServiceAmount } from './service-client.js';
import type { BillingReportsClient } from './reports-client.js';
import type { ServiceBillingClient } from './service-client.js';
import type { ResidencyConsent } from '../backend/policy.schema.js';
import type { BillingPolicyClient } from './policy-client.js';
import type { ServiceAccountClient } from './service-client.js';
import type { LinkedWallet, ServiceOffer, ServiceOrder, CatalogOffer } from '../backend/api.definition.js';
const props = defineProps<{ client: ServiceAccountClient; listWallets: () => Promise<LinkedWallet[]>; getRequirements?: BillingPolicyClient['getPurchaseRequirements']; getReceipt?: ServiceBillingClient['getReceipt']; getHistory?: BillingReportsClient['listBillingOrderHistory']; requireQuotePreview?: boolean }>();
const offers = ref<ServiceOffer[]>([]), wallets = ref<LinkedWallet[]>([]), orders = ref<ServiceOrder[]>([]);
const nextHistoryCursor = ref<string | null>(null);
const receipt = ref<Awaited<ReturnType<ServiceBillingClient['getReceipt']>> | null>(null);
const requirements = ref<Awaited<ReturnType<BillingPolicyClient['getPurchaseRequirements']>> | null>(null), requirementsError = ref(false), agreed = ref(false);
const catalogItems = ref<CatalogOffer[]>([]);
const preparedQuote = ref<{ offer: ServiceOffer; result: Awaited<ReturnType<ServiceAccountClient['quoteOrder']>> } | null>(null);
const offerId = ref(''), walletId = ref(''), hashes = ref<Record<string, string>>({});
const offerItems = computed(() => offers.value.map(offer => ({ value: offer.id, label: `${offer.name}: ${formatServiceAmount(offer.amountBaseUnits, offer.decimals)} ${offer.tokenSymbol} / ${offer.duration} ${offer.durationUnit}` })));
const walletItems = computed(() => wallets.value.map(wallet => ({ value: wallet.id, label: `${wallet.chainId} / ${wallet.address}` })));
const selectedOffer = computed(() => offers.value.find(offer => offer.id === offerId.value));
const selectedQuote = computed(() => preparedQuote.value && selectedOffer.value && JSON.stringify(preparedQuote.value.offer) === JSON.stringify(selectedOffer.value) ? preparedQuote.value.result : null);
const busy = ref(false), error = ref(false);
let retry: { offerId: string; walletId: string; requestKey: string; quotedOffer: ServiceOffer; quotedQuote?: Awaited<ReturnType<ServiceAccountClient['quoteOrder']>>; residencyConsent?: ResidencyConsent } | undefined;

async function run(action: () => Promise<void>) {
	if (busy.value) return;
	busy.value = true; error.value = false;
	try { await action(); } catch { error.value = true; } finally { busy.value = false; }
}

async function loadReceipt(orderId: string) { await run(async () => { if (props.getReceipt) receipt.value = await props.getReceipt({ orderId }); }); }

async function refreshHistory(cursor?: string) { if (props.getHistory) { const page = await props.getHistory({ ...(cursor ? { cursor } : {}), limit: 20 }); orders.value = page.items; nextHistoryCursor.value = page.nextCursor; } else { orders.value = await props.client.listOrders({}); nextHistoryCursor.value = null; } }

async function nextHistory() { await run(async () => { if (nextHistoryCursor.value) await refreshHistory(nextHistoryCursor.value); }); }

async function load() { await run(async () => { requirements.value = null; agreed.value = false; catalogItems.value = await props.client.listCatalog({}); offers.value = catalogItems.value.map(item => item.offer); wallets.value = await props.listWallets(); await refreshHistory(); if (props.getRequirements) { requirements.value = null; agreed.value = false; try { requirements.value = await props.getRequirements({}); requirementsError.value = false; agreed.value = false; } catch { requirementsError.value = true; } } }); }

async function prepareQuote() { await run(async () => { const offer = selectedOffer.value; if (!offer) throw new Error('Offer unavailable'); if (retry && retry.offerId === offerId.value && retry.walletId === walletId.value && JSON.stringify(retry.quotedOffer) === JSON.stringify(offer) && retry.quotedQuote) preparedQuote.value = { offer: retry.quotedOffer, result: retry.quotedQuote }; else { preparedQuote.value = null; preparedQuote.value = { offer: { ...offer }, result: await props.client.quoteOrder({ offerId: offer.id }) }; } }); }

async function create() {
	await run(async () => {
		const quotedOffer = offers.value.find(offer => offer.id === offerId.value);
		if (!quotedOffer) throw new Error('Offer unavailable');
		if (props.requireQuotePreview && !selectedQuote.value) throw new Error('Review quote before creating order');
		if (requirementsError.value || (props.getRequirements && !requirements.value) || (requirements.value?.isRequired && !agreed.value)) throw new Error('Residency consent required');
		if (!retry || retry.offerId !== offerId.value || retry.walletId !== walletId.value || JSON.stringify(retry.quotedOffer) !== JSON.stringify(quotedOffer)) { const quotedQuote = props.requireQuotePreview ? selectedQuote.value! : await props.client.quoteOrder({ offerId: quotedOffer.id }); retry = { offerId: offerId.value, walletId: walletId.value, requestKey: crypto.randomUUID(), quotedOffer, quotedQuote, ...(requirements.value?.isRequired && requirements.value.statement ? { residencyConsent: { statementId: requirements.value.statement.id, agreed: true } as const } : {}) }; }
		try { await props.client.createOrder(retry); } catch (cause) { if (cause !== null && typeof cause === 'object' && 'code' in cause && cause.code === 'BILLING_CONFLICT') { retry = undefined; preparedQuote.value = null; } throw cause; }
		retry = undefined; preparedQuote.value = null; await refreshHistory();
	});
}

async function cancel(order: ServiceOrder) { await run(async () => { await props.client.cancelOrder({ orderId: order.id }); await refreshHistory(); }); }

async function check(order: ServiceOrder) {
	await run(async () => { await props.client.checkOrder({ orderId: order.id, ...(!order.txHash && hashes.value[order.id] ? { txHash: hashes.value[order.id] } : {}) }); await refreshHistory(); });
}

</script>
<locale lang="json" locale="ja-JP">
{"durationUnits":{"days":"日","months":"ヶ月","years":"年"},"previewQuote":"日割りと利用期間の見積を確認","base":"通常価格","discount":"残り期間の日割り割引","payable":"今回の支払額","period":"利用期間","prorated":"残り期間を元の価格で按分","afterTail":"現在の上位プランの期限後に開始（または同プラン更新）","quoteDeadline":"見積の有効期限","nextHistory":"支払い履歴の次のページ","receipt":"領収書を表示","requirementsFailed":"新規購入の地域条件を確認できませんでした。履歴は引き続き閲覧できます。","agree":"表示された居住地声明に同意して購入します。","reference":"基準価格（元の販売期間条件を満たす価格）","previous":"前の価格","current":"現在価格","next":"次の価格","scope":"固定期間のサービス契約の試作です。注文と確認済み期間を記録しますが、管理者が紐付けた通常ロールは確認済み期間内だけ有効です。この画面は署名・送金・自動更新を実行しません。","failed":"処理できませんでした。設定と入力を確認してください。","load":"読み込む","offer":"サービス","wallet":"登録済みの支払ウォレット","create":"注文を作成","hash":"トランザクションハッシュ","hashCaption":"注文期限内に提出します。別のハッシュへの変更はできません。","check":"確認する","detectScope":"選択したトークンについて、登録済みの別アカウント間の送金を検出します。自分が送信者または受信者であるイベントのみ記録できます。","log":"ログインデックス","detect":"送金を検出","pending":"未確認です。後で再確認してください。","decimals":"小数桁","token":"チェーン / コントラクト","recipient":"受取先","amount":"金額（最小単位）","cancel":"送信前の注文を取り消す","deadline":"ハッシュ提出期限"}
</locale>
