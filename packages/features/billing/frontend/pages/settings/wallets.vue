<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/wallets" :label="$locale.sfc.title" :keywords="['wallet', 'SIWE']" icon="ti ti-wallet">
	<MkA to="/settings/peer-payments">{{ $locale.sfc.peer }}</MkA>
	<MkA to="/settings/subscriptions">{{ $locale.sfc.billing }}</MkA>
	<WalletSettings :residenceClient="nativeResidenceClient" :client="client" :connectors="connectors" :confirmUnlink="confirmUnlink" :authenticateWithPasskey="authenticateWithPasskey"/>
</SearchMarker>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { startAuthentication } from '@simplewebauthn/browser';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import * as os from '@features/ui/frontend/os.js';
import { nativeResidenceClient } from '../../native-residence-client.js';
import WalletSettings from '../../WalletSettings.vue';
import { discoverWallets } from '../../wallet-discovery.js';
import type { WalletClient, WalletConnector } from '../../wallet-client.js';
import type { LinkedWallet } from '../../../backend/api.definition.js';

const client: WalletClient = {
	list: input => misskeyApi('account/wallets/list', input),
	chains: input => misskeyApi('account/wallets/link/chains', input),
	passkeyOptions: input => misskeyApi('account/wallets/link/passkey-options', input),
	begin: input => misskeyApi('account/wallets/link/begin', input),
	verify: input => misskeyApi('account/wallets/link/verify', input),
	unlink: input => misskeyApi('account/wallets/unlink', input),
};
const connectors = shallowRef<readonly WalletConnector[]>([]);
let detach = () => {};
onMounted(() => { detach = discoverWallets(window, value => { connectors.value = value; }); });
onBeforeUnmount(() => detach());

async function confirmUnlink(wallet: LinkedWallet) {
	const result = await os.confirm({ type: 'warning', title: $locale.value.sfc.unlink, text: wallet.address });
	return !result.canceled;
}

async function authenticateWithPasskey() {
	return startAuthentication({ optionsJSON: await client.passkeyOptions({}) });
}

definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-wallet' }));
</script>

<locale lang="json" locale="ja-JP">
{"peer":"ユーザー間の送金","billing":"サービス契約・送金の確認","title":"ウォレット","unlink":"ウォレットの登録を解除しますか？"}
</locale>
