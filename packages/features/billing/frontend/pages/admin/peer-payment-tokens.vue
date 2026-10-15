<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template><SearchMarker path="/admin/peer-payment-tokens" :label="$locale.sfc.title" :keywords="['ERC20', 'payment']" icon="ti ti-arrows-exchange"><PeerTokenSettings :client="client"/></SearchMarker></template>
<script setup lang="ts">
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import PeerTokenSettings from '../../PeerTokenSettings.vue';
import type { PeerPaymentClient } from '../../peer-client.js';
const client: Pick<PeerPaymentClient, 'listSettings' | 'saveSettings'> = { listSettings: input => misskeyApi('admin/peer-payments/tokens/list', input), saveSettings: input => misskeyApi('admin/peer-payments/tokens/upsert', input) };
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-arrows-exchange' }));
</script>
<locale lang="json" locale="ja-JP">{"title":"ユーザー間送金のトークン設定"}</locale>
