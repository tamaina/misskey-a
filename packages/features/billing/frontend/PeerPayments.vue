<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton>
	<MkInfo>{{ $locale.sfc.publication }}</MkInfo>
	<div v-for="wallet in publications" :key="wallet.walletId" class="_gaps_s">
		<span>{{ wallet.chainId }} / {{ wallet.address }}</span>
		<MkButton :disabled="busy" @click="publish(wallet.walletId, !wallet.isPublic)">{{ wallet.isPublic ? $locale.sfc.hide : $locale.sfc.publish }}</MkButton>
	</div>
	<form class="_gaps_s" @submit.prevent="lookup">
		<MkInput v-model="username" required :disabled="busy"><template #label>{{ $locale.sfc.recipient }}</template></MkInput>
		<MkButton type="submit" :disabled="busy">{{ $locale.sfc.lookup }}</MkButton>
	</form>
	<form class="_gaps_s" @submit.prevent="prepare">
		<MkSelect v-model="tokenId" :items="tokens.map(token => ({ value: token.id, label: `${token.name} / ${token.chainId} / ${token.contractAddress}` }))" :disabled="busy"><template #label>{{ $locale.sfc.token }}</template></MkSelect>
		<MkSelect v-model="walletId" :items="publications.map(wallet => ({ value: wallet.walletId, label: `${wallet.chainId} / ${wallet.address}` }))" :disabled="busy"><template #label>{{ $locale.sfc.payer }}</template></MkSelect>
		<MkSelect v-model="recipientAddress" :items="addresses.map(wallet => ({ value: wallet.address, label: `${wallet.chainId} / ${wallet.address}` }))" :disabled="busy"><template #label>{{ $locale.sfc.address }}</template></MkSelect>
		<MkInput v-model="amount" required :disabled="busy"><template #label>{{ $locale.sfc.amount }}</template></MkInput>
		<MkButton type="submit" :disabled="busy || !tokenId || !walletId || !recipientAddress">{{ $locale.sfc.prepare }}</MkButton>
	</form>
	<MkSelect v-model="connectorId" :items="connectors.map(connector => ({ value: connector.id, label: connector.name }))" :disabled="busy"><template #label>{{ $locale.sfc.browserWallet }}</template></MkSelect>
	<div v-for="intent in history" :key="intent.id" class="_gaps_s">
		<MkInfo>{{ intent.status }} / {{ intent.token.tokenSymbol }} / {{ intent.amountBaseUnits }} {{ $locale.sfc.baseUnits }}<br>{{ intent.token.chainId }} / {{ intent.token.contractAddress }}<br>{{ intent.fromAddress }} → {{ intent.toAddress }}<br>{{ new Date(intent.expiresAt).toISOString() }}</MkInfo>
		<MkButton v-if="intent.senderUserId === currentUserId && intent.status === 'pending' && !intent.txHash && !hashes[intent.id]" :disabled="busy || !connectorId" @click="send(intent)">{{ $locale.sfc.send }}</MkButton>
		<form v-if="intent.status === 'pending' || intent.status === 'expired'" class="_gaps_s" @submit.prevent="check(intent)">
			<MkInput v-model="hashes[intent.id]" :disabled="busy || !!intent.txHash"><template #label>{{ $locale.sfc.hash }}</template><template #caption>{{ intent.txHash }}</template></MkInput>
			<MkInput :modelValue="logIndices[intent.id] ?? null" type="number" :min="0" step="1" :disabled="busy" @update:modelValue="value => logIndices[intent.id] = value"><template #label>{{ $locale.sfc.log }}</template><template #caption>{{ $locale.sfc.logCaption }}</template></MkInput>
			<MkButton type="submit" :disabled="busy">{{ $locale.sfc.check }}</MkButton>
		</form>
	</div>
</div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { discoverWallets } from './wallet-discovery.js';
import { parsePeerAmount, sendPeerTransfer } from './peer-client.js';
import type { PeerPaymentClient } from './peer-client.js';
import type { PeerToken, PeerTransfer } from '../backend/peer.contract.js';
import type { WalletConnector } from './wallet-client.js';
const props = defineProps<{ client: PeerPaymentClient; currentUserId: string; resolveUser: (username: string) => Promise<string> }>();
const publications = ref<Awaited<ReturnType<PeerPaymentClient['ownPublication']>>>([]), tokens = ref<PeerToken[]>([]), history = ref<PeerTransfer[]>([]);
const addresses = ref<Awaited<ReturnType<PeerPaymentClient['publicWallets']>>>([]), connectors = ref<readonly WalletConnector[]>([]);
const username = ref(''), recipientUserId = ref(''), recipientAddress = ref(''), tokenId = ref(''), walletId = ref(''), amount = ref(''), connectorId = ref('');
const logIndices = ref<Record<string, number | null>>({});
const hashes = ref<Record<string, string>>({}), busy = ref(false), error = ref(false);
let detach: (() => void) | undefined;
let retry: { input: Parameters<PeerPaymentClient['prepare']>[0] } | undefined;
onMounted(() => { detach = discoverWallets(window, found => { connectors.value = found; }); });
onUnmounted(() => detach?.());

async function run(action: () => Promise<void>) { if (busy.value) return; busy.value = true; error.value = false; try { await action(); } catch { error.value = true; } finally { busy.value = false; } }

async function refresh() { history.value = await props.client.list({}); }

async function load() { await run(async () => { publications.value = await props.client.ownPublication({}); tokens.value = await props.client.listTokens({}); await refresh(); }); }

async function publish(id: string, isPublic: boolean) { await run(async () => { await props.client.publish({ walletId: id, isPublic }); publications.value = await props.client.ownPublication({}); }); }

async function lookup() { await run(async () => { recipientUserId.value = ''; recipientAddress.value = ''; addresses.value = []; const id = await props.resolveUser(username.value); addresses.value = await props.client.publicWallets({ userId: id }); recipientUserId.value = id; }); }

async function prepare() {
 await run(async () => {
	const token = tokens.value.find(row => row.id === tokenId.value), payer = publications.value.find(row => row.walletId === walletId.value), recipient = addresses.value.find(row => row.address === recipientAddress.value && row.chainId === token?.chainId);
	if (!token || !payer || payer.chainId !== token.chainId || !recipient) throw new Error('Unavailable');
	const fields = { walletId: payer.walletId, recipientUserId: recipientUserId.value, recipientAddress: recipient.address, tokenId: token.id, amountBaseUnits: parsePeerAmount(amount.value, token.decimals) };
	if (!retry || Object.entries(fields).some(([key, value]) => retry?.input[key as keyof typeof fields] !== value)) retry = { input: { ...fields, requestKey: crypto.randomUUID() } };
	await props.client.prepare(retry.input); retry = undefined; await refresh();
}); 
}

async function send(intent: PeerTransfer) {
 await run(async () => {
	const connector = connectors.value.find(row => row.id === connectorId.value); if (!connector) throw new Error('Wallet unavailable');
	const hash = await sendPeerTransfer(connector.provider, intent); hashes.value[intent.id] = hash;
	await props.client.check({ intentId: intent.id, txHash: hash }); await refresh();
}); 
}

async function check(intent: PeerTransfer) { await run(async () => { await props.client.check({ intentId: intent.id, ...(logIndices.value[intent.id] != null ? { logIndex: logIndices.value[intent.id]! } : {}), ...(!intent.txHash && hashes.value[intent.id] ? { txHash: hashes.value[intent.id] } : {}) }); await refresh(); }); }
</script>
<locale lang="json" locale="ja-JP">
{"scope":"ユーザー間のERC20送金の試作です。内容を確認してウォレットで送信し、サーバーで確認します。残高やノートのリアクションは変更しません。","failed":"処理できませんでした。送信済みの場合は再送せず、ウォレットの取引ハッシュで確認してください。","load":"読み込む","publication":"受取用アドレスは初期状態では非公開です。公開すると他のアカウントが取得でき、チェーン上の履歴とあなたのアカウントを関連付けられます。非公開に戻すと新しい送金準備の対象から外れます。","publish":"受取アドレスを公開する","hide":"非公開に戻す","recipient":"受取人のローカルユーザー名","lookup":"公開アドレスを確認","token":"トークン","payer":"登録済みの送信元","address":"公開された受取アドレス","amount":"送金額（トークン単位）","prepare":"送金内容を準備する","browserWallet":"送信に使うブラウザーウォレット","send":"内容を確認してウォレットで送信","log":"ログインデックス（任意）","logCaption":"同じ内容のTransferログが複数ある場合だけ指定します。","hash":"取引ハッシュ","check":"送金を確認","baseUnits":"最小単位"}
</locale>
