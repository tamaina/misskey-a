<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/admin/service-offers" :label="$locale.sfc.title" :keywords="['billing', 'subscription', 'ERC20']" icon="ti ti-receipt">
	<ServiceOfferSettings :client="client" :catalogClient="nativeCatalogClient"/>
	<CatalogAdministration :client="nativeCatalogClient"/>
	<RefundRequests :client="nativeRefundClient" admin/>
</SearchMarker>
</template>
<script setup lang="ts">
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import CatalogAdministration from '../../CatalogAdministration.vue';
import { nativeCatalogClient } from '../../catalog-client.js';
import RefundRequests from '../../RefundRequests.vue';
import { nativeRefundClient } from '../../native-refund-client.js';
import ServiceOfferSettings from '../../ServiceOfferSettings.vue';
import type { OfferAdminClient } from '../../service-client.js';
const client: OfferAdminClient = {
	listOfferSettings: input => misskeyApi('admin/billing/offers/list', input),
	upsertOffer: input => misskeyApi('admin/billing/offers/upsert', input),
};
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-receipt' }));
</script>
<locale lang="json" locale="ja-JP">
{"title":"サービス契約の設定"}
</locale>
