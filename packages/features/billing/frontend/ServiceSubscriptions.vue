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
		<MkSelect v-model="walletId" :items="walletItems" :disabled="busy"><template #label>{{ $locale.sfc.wallet }}</template></MkSelect>
		<MkButton type="submit" :disabled="busy || !offerId || !walletId">{{ $locale.sfc.create }}</MkButton>
	</form>
	<div v-for="order in orders" :key="order.id" class="_gaps_s">
		<MkInfo>{{ order.offer.name }} / {{ order.status }} / {{ order.id }}<br>{{ $locale.sfc.token }}: {{ order.offer.chainId }} / {{ order.offer.contractAddress }}<br>{{ $locale.sfc.recipient }}: {{ order.offer.recipientAddress }}<br>{{ $locale.sfc.amount }}: {{ formatServiceAmount(order.offer.amountBaseUnits, order.offer.decimals) }} {{ order.offer.tokenSymbol }} / {{ order.offer.amountBaseUnits }} ({{ order.offer.decimals }} {{ $locale.sfc.decimals }})<br>{{ $locale.sfc.deadline }}: {{ new Date(order.expiresAt).toISOString() }}<br v-if="order.endsAt">{{ order.startsAt ? new Date(order.startsAt).toISOString() : '' }} — {{ order.endsAt ? new Date(order.endsAt).toISOString() : '' }}</MkInfo>
		<form v-if="order.status === 'pending'" class="_gaps_s" @submit.prevent="check(order)">
			<MkInput v-model="hashes[order.id]" :disabled="busy || !!order.txHash"><template #label>{{ $locale.sfc.hash }}</template><template #caption>{{ order.txHash ?? $locale.sfc.hashCaption }}</template></MkInput>
			<MkButton type="submit" :disabled="busy">{{ $locale.sfc.check }}</MkButton>
		</form>
	</div>
	<form class="_gaps_s" @submit.prevent="detect">
		<MkInfo>{{ $locale.sfc.detectScope }}</MkInfo>
		<MkInput v-model="transferHash" required :disabled="busy"><template #label>{{ $locale.sfc.hash }}</template></MkInput>
		<MkInput v-model="logIndex" type="number" :min="0" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.log }}</template></MkInput>
		<MkButton type="submit" :disabled="busy || !offerId">{{ $locale.sfc.detect }}</MkButton>
	</form>
	<MkInfo v-if="pending" role="status">{{ $locale.sfc.pending }}</MkInfo>
	<MkInfo v-for="transfer in transfers" :key="transfer.id">{{ transfer.fromAddress }} → {{ transfer.toAddress }} / {{ transfer.amountBaseUnits }} / {{ transfer.txHash }}:{{ transfer.logIndex }}</MkInfo>
</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { formatServiceAmount } from './service-client.js';
import type { ServiceAccountClient } from './service-client.js';
import type { DetectedTransfer, LinkedWallet, ServiceOffer, ServiceOrder } from '../backend/api.definition.js';
const props = defineProps<{ client: ServiceAccountClient; listWallets: () => Promise<LinkedWallet[]> }>();
const offers = ref<ServiceOffer[]>([]), wallets = ref<LinkedWallet[]>([]), orders = ref<ServiceOrder[]>([]), transfers = ref<DetectedTransfer[]>([]);
const offerId = ref(''), walletId = ref(''), transferHash = ref(''), logIndex = ref(0), hashes = ref<Record<string, string>>({});
const offerItems = computed(() => offers.value.map(offer => ({ value: offer.id, label: `${offer.name}: ${formatServiceAmount(offer.amountBaseUnits, offer.decimals)} ${offer.tokenSymbol} / ${offer.duration} ${offer.durationUnit}` })));
const walletItems = computed(() => wallets.value.map(wallet => ({ value: wallet.id, label: `${wallet.chainId} / ${wallet.address}` })));
const busy = ref(false), error = ref(false), pending = ref(false);
let retry: { offerId: string; walletId: string; requestKey: string; quotedOffer: ServiceOffer } | undefined;

async function run(action: () => Promise<void>) {
	if (busy.value) return;
	busy.value = true; error.value = false; pending.value = false;
	try { await action(); } catch { error.value = true; } finally { busy.value = false; }
}

async function refreshHistory() { orders.value = await props.client.listOrders({}); transfers.value = await props.client.listTransfers({}); }

async function load() { await run(async () => { offers.value = await props.client.listOffers({}); wallets.value = await props.listWallets(); await refreshHistory(); }); }

async function create() {
	await run(async () => {
		const quotedOffer = offers.value.find(offer => offer.id === offerId.value);
		if (!quotedOffer) throw new Error('Offer unavailable');
		if (!retry || retry.offerId !== offerId.value || retry.walletId !== walletId.value || JSON.stringify(retry.quotedOffer) !== JSON.stringify(quotedOffer)) retry = { offerId: offerId.value, walletId: walletId.value, requestKey: crypto.randomUUID(), quotedOffer };
		await props.client.createOrder(retry); retry = undefined; await refreshHistory();
	});
}

async function check(order: ServiceOrder) {
	await run(async () => { await props.client.checkOrder({ orderId: order.id, ...(!order.txHash && hashes.value[order.id] ? { txHash: hashes.value[order.id] } : {}) }); await refreshHistory(); });
}

async function detect() {
	await run(async () => { const result = await props.client.detectTransfer({ offerId: offerId.value, txHash: transferHash.value, logIndex: logIndex.value }); pending.value = result.status === 'pending'; await refreshHistory(); });
}
</script>
<locale lang="json" locale="ja-JP">
{"scope":"固定期間のサービス契約の試作です。注文と確認済み期間を記録しますが、役割・利用枠は変更しません。この画面は署名・送金・自動更新を実行しません。","failed":"処理できませんでした。設定と入力を確認してください。","load":"読み込む","offer":"サービス・送金検出用トークン","wallet":"登録済みの支払ウォレット","create":"注文を作成","hash":"トランザクションハッシュ","hashCaption":"注文期限内に提出します。別のハッシュへの変更はできません。","check":"確認する","detectScope":"選択したトークンについて、登録済みの別アカウント間の送金を検出します。自分が送信者または受信者であるイベントのみ記録できます。","log":"ログインデックス","detect":"送金を検出","pending":"未確認です。後で再確認してください。","decimals":"小数桁","token":"チェーン / コントラクト","recipient":"受取先","amount":"金額（最小単位）","deadline":"ハッシュ提出期限"}
</locale>
