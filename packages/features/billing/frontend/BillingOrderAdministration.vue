<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="failed" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<FormSection>
		<template #label>{{ $locale.sfc.orders }}</template>
		<div class="_gaps">
			<MkInput v-model="userId" :disabled="busy"><template #label>{{ $locale.sfc.user }}</template><template #caption>{{ $locale.sfc.all }}</template></MkInput>
			<MkButton :disabled="busy" @click="load()">{{ $locale.sfc.load }}</MkButton>
			<div v-for="row in orders" :key="row.order.id" class="_gaps_s">
				<MkInfo>{{ row.order.id }} / {{ row.userId ?? $locale.sfc.deleted }} / {{ $locale.sfc.status[row.order.status] }}<br>{{ row.order.offer.name }} / {{ amount(row.order.amountBaseUnits, row.order.offer.decimals) }} {{ row.order.offer.tokenSymbol }}<br>{{ row.order.txHash ?? '-' }}</MkInfo>
				<MkButton v-if="row.order.status === 'pending'" :disabled="busy || row.userId == null" @click="check(row.order.id)">{{ $locale.sfc.check }}</MkButton>
				<PurchaseReceipt v-if="row.order.status === 'paid'" :receipt="row"/>
			</div>
			<MkButton v-if="nextCursor" :disabled="busy" @click="load(nextCursor)">{{ $locale.sfc.next }}</MkButton>
		</div>
	</FormSection>
	<FormSection>
		<template #label>{{ $locale.sfc.sales }}</template>
		<form class="_gaps" @submit.prevent="summarize">
			<MkInput v-model="from" type="datetime-local" :disabled="busy"><template #label>{{ $locale.sfc.from }}</template><template #caption>{{ $locale.sfc.utc }}</template></MkInput>
			<MkInput v-model="to" type="datetime-local" :disabled="busy"><template #label>{{ $locale.sfc.to }}</template><template #caption>{{ $locale.sfc.utc }}</template></MkInput>
			<MkButton type="submit" :disabled="busy">{{ $locale.sfc.summarize }}</MkButton>
		</form>
		<div v-if="summary" class="_gaps">
			<MkInfo>{{ new Date(summary.from).toISOString() }} - {{ new Date(summary.to).toISOString() }}<br>{{ $locale.sfc.count }}: {{ summary.count }} / {{ $locale.sfc.unknownCount }}: {{ summary.unknownTaxCount }}<br>{{ $locale.sfc.units }}</MkInfo>
			<FormSection v-for="group in groups" :key="group.key">
				<template #label>{{ group.label }}</template>
				<div class="table">
					<table>
						<thead><tr><th>{{ $locale.sfc.unit }}</th><th>{{ $locale.sfc.count }}</th><th>{{ $locale.sfc.gross }}</th><th>{{ $locale.sfc.net }}</th><th>{{ $locale.sfc.tax }}</th></tr></thead><tbody>
							<tr v-for="(bucket, index) in group.items" :key="index"><td>{{ bucket.assetKey }} / {{ bucket.currencyCode ?? $locale.sfc.unknown }} / {{ bucket.decimals }}<br>{{ bucket.planName ?? bucket.tokenSymbol ?? bucket.taxName ?? '' }} {{ bucket.taxRate ?? '' }}</td><td>{{ bucket.count }}</td><td>{{ amount(bucket.grossBaseUnits, bucket.decimals) }}</td><td>{{ amount(bucket.netBaseUnits, bucket.decimals) }}</td><td>{{ amount(bucket.taxBaseUnits, bucket.decimals) }}</td></tr>
						</tbody>
					</table>
				</div>
			</FormSection>
		</div>
	</FormSection>
</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import PurchaseReceipt from './PurchaseReceipt.vue';
import { formatServiceAmount } from './service-client.js';
import type { BillingReportsClient } from './reports-client.js';
const props = defineProps<{ client: BillingReportsClient }>();
const userId = ref(''), busy = ref(false), failed = ref(false), nextCursor = ref<string | null>(null);
const orders = ref<Awaited<ReturnType<BillingReportsClient['listAdminBillingOrders']>>['items']>([]);
const summary = ref<Awaited<ReturnType<BillingReportsClient['getBillingSalesSummary']>> | null>(null);
const from = ref(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 16)), to = ref(new Date().toISOString().slice(0, 16));
let loadedUser: string | undefined;
const groups = computed(() => summary.value ? [{ key: 'currency', label: $locale.value.sfc.byCurrency, items: summary.value.byCurrency }, { key: 'tax', label: $locale.value.sfc.byTax, items: summary.value.byTax }, { key: 'plan', label: $locale.value.sfc.byPlan, items: summary.value.byPlan }, { key: 'asset', label: $locale.value.sfc.byAsset, items: summary.value.byAsset }] : []);

function amount(value: string | null, decimals: number) { return value == null ? $locale.value.sfc.unknown : formatServiceAmount(value, decimals); }

async function run(action: () => Promise<void>) { if (busy.value) return; busy.value = true; failed.value = false; try { await action(); } catch { failed.value = true; } finally { busy.value = false; } }

async function load(next?: string | null) { await run(async () => { const filter = userId.value.trim() || undefined; const result = await props.client.listAdminBillingOrders({ ...(filter ? { userId: filter } : {}), ...(next && filter === loadedUser ? { cursor: next } : {}), limit: 20 }); orders.value = result.items; nextCursor.value = result.nextCursor; loadedUser = filter; }); }

async function check(orderId: string) { await run(async () => { const result = await props.client.checkAdminBillingOrder({ orderId }); const index = orders.value.findIndex(row => row.order.id === orderId); if (index >= 0) orders.value[index] = result; }); }

async function summarize() { await run(async () => { summary.value = null; const start = Date.parse(`${from.value}Z`), end = Date.parse(`${to.value}Z`); if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= end) throw new Error('Invalid period'); summary.value = await props.client.getBillingSalesSummary({ from: start, to: end }); }); }
</script>
<style scoped>
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
</style>
<locale lang="json" locale="ja-JP">
{"scope":"原注文の支払状況と購入時点の領収情報を確認します。再確認は保存済み送金のチェーン確認を行います。","failed":"確認できませんでした。条件を見直して再確認してください。","orders":"注文の管理","user":"ユーザーID","all":"空欄は全ユーザー（削除済みアカウントの保存済み注文を含む）","load":"読み込む","deleted":"削除済みユーザー","status":{"pending":"未確認","paid":"支払済み","expired":"期限切れ","failed":"失敗"},"check":"支払を再確認","next":"次のページ","sales":"期間内の購入売上","from":"開始日時（含む）","to":"終了日時（含まない）","utc":"UTCで入力します。支払確定日時で集計します。","summarize":"集計する","count":"注文数","unknownCount":"税情報未保存の注文数","units":"金額は価格資産・通貨・小数桁ごとの購入売上です。税抜は税を除いた額です。返金を差し引いた売上ではありません。","unit":"価格単位 / 内訳","gross":"税込・支払額","net":"税抜","tax":"税額","unknown":"不明（未保存）","byCurrency":"通貨別（価格単位ごと）","byTax":"税別","byPlan":"プラン別","byAsset":"価格資産別"}
</locale>
