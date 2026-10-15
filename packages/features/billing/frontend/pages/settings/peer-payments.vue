<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template><SearchMarker path="/settings/peer-payments" :label="$locale.sfc.title" :keywords="['ERC20', 'payment']" icon="ti ti-arrows-exchange"><PeerPayments v-if="$i" :client="client" :currentUserId="$i.id" :resolveUser="resolveUser"/></SearchMarker></template>
<script setup lang="ts">
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import PeerPayments from '../../PeerPayments.vue';
import type { PeerPaymentClient } from '../../peer-client.js';
const client: PeerPaymentClient = {
	listSettings: input => misskeyApi('admin/peer-payments/tokens/list', input), saveSettings: input => misskeyApi('admin/peer-payments/tokens/upsert', input),
	listTokens: input => misskeyApi('peer-payments/tokens/list', input), ownPublication: input => misskeyApi('account/wallets/publication/list', input),
	publish: input => misskeyApi('account/wallets/publication/set', input), publicWallets: input => misskeyApi('users/payment-wallets', input),
	prepare: input => misskeyApi('peer-payments/prepare', input), check: input => misskeyApi('peer-payments/check', input), list: input => misskeyApi('peer-payments/list', input),
};

async function resolveUser(username: string) { return (await misskeyApi('users/show', { username, host: null })).id; }

definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-arrows-exchange' }));
</script>
<locale lang="json" locale="ja-JP">{"title":"ユーザー間の送金"}</locale>
