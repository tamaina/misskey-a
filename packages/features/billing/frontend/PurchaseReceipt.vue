<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps">
	<MkButton :disabled="busy || !receipt.snapshot" @click="download">{{ $locale.sfc.pdf }}</MkButton>
	<MkInfo v-if="failed" warn>{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo>
		<strong>{{ $locale.sfc.title }}: {{ receipt.order.id }}</strong><br>
		{{ receipt.order.offer.name }} / {{ receipt.order.paidAt == null ? '' : new Date(receipt.order.paidAt).toISOString() }}<br>
		{{ $locale.sfc.amount }}: {{ formatServiceAmount(receipt.order.amountBaseUnits, receipt.order.offer.decimals) }} {{ receipt.order.offer.tokenSymbol }}<br>
		{{ $locale.sfc.chain }}: {{ receipt.order.offer.chainId }} / {{ receipt.order.txHash ?? $locale.sfc.zero }}<br>
		<template v-if="receipt.snapshot">
			{{ $locale.sfc.seller }}: {{ receipt.snapshot.seller.name }}<br>{{ receipt.snapshot.seller.address }}<br>
			{{ $locale.sfc.registration }}: {{ receipt.snapshot.seller.invoiceRegistrationNumber }}<br>
			{{ $locale.sfc.included }}: {{ formatServiceAmount(receipt.snapshot.tax.includedBaseUnits, receipt.order.offer.decimals) }} {{ receipt.snapshot.tax.currencyCode }}<br>
			{{ $locale.sfc.excluded }}: {{ formatServiceAmount(receipt.snapshot.tax.excludedBaseUnits, receipt.order.offer.decimals) }} {{ receipt.snapshot.tax.currencyCode }}<br>
			{{ receipt.snapshot.tax.name }} ({{ receipt.snapshot.tax.rate }}): {{ formatServiceAmount(receipt.snapshot.tax.taxBaseUnits, receipt.order.offer.decimals) }} {{ receipt.snapshot.tax.currencyCode }}<br>
			{{ $locale.sfc.country }}: {{ receipt.snapshot.statement.country }}<br>{{ receipt.snapshot.statement.statement }}
		</template>
		<template v-else>{{ $locale.sfc.unknown }}</template>
	</MkInfo>
</div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { formatServiceAmount } from './service-client.js';
import type { ServiceBillingClient } from './service-client.js';
const props = defineProps<{ receipt: Awaited<ReturnType<ServiceBillingClient['getReceipt']>> }>();
const busy = ref(false), failed = ref(false);

async function download() { if (busy.value) return; busy.value = true; failed.value = false; try { const { downloadReceiptPdf } = await import('./receipt-pdf.js'); await downloadReceiptPdf(props.receipt); } catch { failed.value = true; } finally { busy.value = false; } }
</script>
<locale lang="json" locale="ja-JP">
{"pdf":"領収書PDFを保存","failed":"PDFを保存できませんでした。後で再確認してください。","title":"購入領収書","amount":"支払額","chain":"チェーン / 送金記録","zero":"支払額0","seller":"販売者","registration":"請求書登録番号","included":"税込金額","excluded":"税抜金額","country":"同意した居住地声明の国","unknown":"この注文には税・地域・販売者の保存済み情報がありません。"}
</locale>
