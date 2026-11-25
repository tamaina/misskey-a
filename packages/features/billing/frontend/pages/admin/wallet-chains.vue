<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/admin/wallet-chains" :label="$locale.sfc.title" :keywords="['wallet', 'RPC']" icon="ti ti-wallet">
	<BillingChainSettings :client="client"/>
</SearchMarker>
</template>

<script setup lang="ts">
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import BillingChainSettings from '../../BillingChainSettings.vue';
import type { WalletChainAdminClient } from '../../admin-client.js';

const client: WalletChainAdminClient = {
	listChainSettings: input => misskeyApi('admin/wallets/chains/list', input),
	upsertChainSettings: input => misskeyApi('admin/wallets/chains/upsert', input),
};
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-wallet' }));
</script>

<locale lang="json" locale="ja-JP">
{"title":"ウォレットのチェーン設定"}
</locale>
