<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/subscriptions" :label="$locale.sfc.title" :keywords="['billing', 'subscription', 'ERC20']" icon="ti ti-receipt">
	<ServiceSubscriptions :client="client" :listWallets="listWallets" :getRequirements="nativeBillingPolicyClient.getPurchaseRequirements" :getReceipt="getReceipt" :getHistory="nativeBillingReportsClient.listBillingOrderHistory" requireQuotePreview/>
	<RefundRequests :client="nativeRefundClient"/>
</SearchMarker>
</template>
<script setup lang="ts">
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { nativeBillingReportsClient } from '../../reports-client.js';
import { nativeBillingPolicyClient } from '../../policy-client.js';
import RefundRequests from '../../RefundRequests.vue';
import { nativeRefundClient } from '../../native-refund-client.js';
import ServiceSubscriptions from '../../ServiceSubscriptions.vue';
import type { ServiceAccountClient } from '../../service-client.js';
const client: ServiceAccountClient = {
	listCatalog: input => misskeyApi('billing/catalog/list', input),
	cancelOrder: input => misskeyApi('billing/orders/cancel', input),
	quoteOrder: input => misskeyApi('billing/orders/quote', input),
	listOffers: input => misskeyApi('billing/offers/list', input),
	createOrder: input => misskeyApi('billing/orders/create', input),
	checkOrder: input => misskeyApi('billing/orders/check', input),
	listOrders: input => misskeyApi('billing/orders/list', input),
};
const getReceipt = (input: { orderId: string }) => misskeyApi('billing/orders/receipt', input);
const listWallets = () => misskeyApi('account/wallets/list', {});
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-receipt' }));
</script>
<locale lang="json" locale="ja-JP">
{"title":"サービス契約の確認"}
</locale>
