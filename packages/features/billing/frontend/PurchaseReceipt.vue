<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
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
</template>
<script setup lang="ts">
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { formatServiceAmount } from './service-client.js';
import type { ServiceBillingClient } from './service-client.js';
defineProps<{ receipt: Awaited<ReturnType<ServiceBillingClient['getReceipt']>> }>();
</script>
<locale lang="json" locale="ja-JP">
{"title":"購入領収書","amount":"支払額","chain":"チェーン / 送金記録","zero":"支払額0","seller":"販売者","registration":"請求書登録番号","included":"税込金額","excluded":"税抜金額","country":"同意した居住地声明の国","unknown":"この注文には税・地域・販売者の保存済み情報がありません。"}
</locale>
