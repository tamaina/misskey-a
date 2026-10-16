<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.reload }}</MkButton>
	<MkInfo v-if="!residenceReady" warn><MkA to="/settings/residence">{{ $locale.sfc.residenceRequired }}</MkA></MkInfo>
	<MkInfo>{{ $locale.sfc.publication }}</MkInfo>
	<div v-for="wallet in publications" :key="wallet.walletId" class="_gaps_s">
		<span>{{ wallet.chainId }} / {{ wallet.address }}</span>
		<MkButton :disabled="busy" @click="publish(wallet.walletId, !wallet.isPublic)">{{ wallet.isPublic ? $locale.sfc.hide : $locale.sfc.publish }}</MkButton>
	</div>
	<div class="_gaps_s">
		<span>{{ $locale.sfc.recipientLabel }}</span>
		<div class="_buttons">
			<MkButton v-if="!recipient" primary :disabled="busy" @click="selectRecipient">{{ $locale.sfc.selectRecipient }}</MkButton>
			<template v-else>
				<span>@{{ recipient.username }}</span>
				<MkButton :disabled="busy" @click="clearRecipient">{{ $locale.sfc.clearRecipient }}</MkButton>
			</template>
		</div>
		<template v-if="recipient">
			<MkInfo v-if="recipientLoading" role="status">{{ $locale.sfc.recipientLoading }}</MkInfo>
			<MkInfo v-else-if="recipientFailed" warn role="alert">{{ $locale.sfc.recipientFailed }}</MkInfo>
			<MkInfo v-else-if="!addresses.length">{{ $locale.sfc.noRecipientWallet }}</MkInfo>
			<MkButton v-if="recipientFailed" :disabled="busy" @click="reloadRecipient">{{ $locale.sfc.retryRecipient }}</MkButton>
		</template>
	</div>
	<form class="_gaps_s" @submit.prevent="prepare">
		<MkSelect v-model="tokenId" :items="tokens.map(token => ({ value: token.id, label: `${token.name} / ${token.chainId} / ${token.contractAddress}` }))" :disabled="busy"><template #label>{{ $locale.sfc.token }}</template></MkSelect>
		<MkSelect v-model="walletId" :items="publications.map(wallet => ({ value: wallet.walletId, label: `${wallet.chainId} / ${wallet.address}` }))" :disabled="busy"><template #label>{{ $locale.sfc.payer }}</template></MkSelect>
		<MkSelect v-model="recipientAddress" :items="addresses.map(wallet => ({ value: wallet.address, label: `${wallet.chainId} / ${wallet.address}` }))" :disabled="busy"><template #label>{{ $locale.sfc.address }}</template></MkSelect>
		<MkInput v-model="amount" required :disabled="busy"><template #label>{{ $locale.sfc.amount }}</template></MkInput>
		<MkButton type="submit" :disabled="busy || !prepareFields || (!residenceReady && !matchingRetry)">{{ $locale.sfc.prepare }}</MkButton>
	</form>
	<MkSelect v-model="connectorId" :items="connectors.map(connector => ({ value: connector.id, label: connector.name }))" :disabled="busy"><template #label>{{ $locale.sfc.browserWallet }}</template></MkSelect>
	<div v-for="intent in history" :key="intent.id" class="_gaps_s">
		<MkInfo>{{ intent.status }} / {{ intent.token.tokenSymbol }} / {{ intent.amountBaseUnits }} {{ $locale.sfc.baseUnits }}<br>{{ intent.token.chainId }} / {{ intent.token.contractAddress }}<br>{{ intent.fromAddress }} → {{ intent.toAddress }}<br>{{ new Date(intent.expiresAt).toISOString() }}</MkInfo>
		<MkButton v-if="intent.senderUserId === currentUserId && intent.status === 'pending' && !intent.txHash && !hashes[intent.id] && intent.broadcastStartedAt === null && !sendAttempts[intent.id]" :disabled="busy || !connectorId || !residenceReady" @click="send(intent)">{{ $locale.sfc.send }}</MkButton>
		<MkInfo v-if="(intent.broadcastStartedAt !== null || sendAttempts[intent.id]) && !intent.txHash" warn>{{ $locale.sfc.broadcastUnknown }}</MkInfo>
		<form v-if="intent.status === 'pending' || intent.status === 'expired'" class="_gaps_s" @submit.prevent="check(intent)">
			<MkInput v-model="hashes[intent.id]" :disabled="busy || !!intent.txHash"><template #label>{{ $locale.sfc.hash }}</template><template #caption>{{ intent.txHash }}</template></MkInput>
			<MkInput :modelValue="logIndices[intent.id] ?? null" type="number" :min="0" step="1" :disabled="busy" @update:modelValue="value => logIndices[intent.id] = value"><template #label>{{ $locale.sfc.log }}</template><template #caption>{{ $locale.sfc.logCaption }}</template></MkInput>
			<MkButton type="submit" :disabled="busy">{{ $locale.sfc.check }}</MkButton>
		</form>
	</div>
</div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { discoverWallets } from './wallet-discovery.js';
import { requireResidenceForStart } from './residence-client.js';
import { parsePeerAmount, sendPeerTransfer } from './peer-client.js';
import type { ResidenceClient } from './residence-client.js';
import type { PeerPaymentClient } from './peer-client.js';
import type { PeerToken, PeerTransfer } from '../backend/peer.contract.js';
import type { WalletConnector } from './wallet-client.js';
const props = defineProps<{ client: PeerPaymentClient; residenceClient: Pick<ResidenceClient, 'getResidence'>; currentUserId: string }>();
const publications = ref<Awaited<ReturnType<PeerPaymentClient['ownPublication']>>>([]), tokens = ref<PeerToken[]>([]), history = ref<PeerTransfer[]>([]);
const addresses = ref<Awaited<ReturnType<PeerPaymentClient['publicWallets']>>>([]), connectors = ref<readonly WalletConnector[]>([]);
const recipient = ref<{ id: string; username: string } | null>(null);
const recipientLoading = ref(false), recipientFailed = ref(false);
let recipientVersion = 0, selectionVersion = 0;
const recipientUserId = ref(''), recipientAddress = ref(''), tokenId = ref(''), walletId = ref(''), amount = ref(''), connectorId = ref('');
const logIndices = ref<Record<string, number | null>>({});
const hashes = ref<Record<string, string>>({}), busy = ref(false), error = ref(false);
let detach: (() => void) | undefined;
const residenceReady = ref(false), sendAttempts = ref<Record<string, boolean>>({});
const retry = ref<{ input: Parameters<PeerPaymentClient['prepare']>[0] }>();
const prepareFields = computed(() => {
	const token = tokens.value.find(row => row.id === tokenId.value), payer = publications.value.find(row => row.walletId === walletId.value), recipientWallet = addresses.value.find(row => row.address === recipientAddress.value && row.chainId === token?.chainId);
	if (recipientLoading.value || !recipientUserId.value || !token || !payer || payer.chainId !== token.chainId || !recipientWallet) return null;
	try { return { walletId: payer.walletId, recipientUserId: recipientUserId.value, recipientAddress: recipientWallet.address, tokenId: token.id, amountBaseUnits: parsePeerAmount(amount.value, token.decimals) }; } catch { return null; }
});
const matchingRetry = computed(() => !!retry.value && !!prepareFields.value && Object.entries(prepareFields.value).every(([key, value]) => retry.value?.input[key as keyof NonNullable<typeof prepareFields.value>] === value));
onMounted(() => { detach = discoverWallets(window, found => { connectors.value = found; }); void load(); });
onUnmounted(() => { recipientVersion++; selectionVersion++; detach?.(); });

async function run(action: () => Promise<void>) { if (busy.value) return; busy.value = true; error.value = false; try { await action(); } catch { error.value = true; } finally { busy.value = false; } }

async function refresh() { history.value = await props.client.list({}); }

async function load() { await run(async () => { publications.value = await props.client.ownPublication({}); tokens.value = await props.client.listTokens({}); await refresh(); residenceReady.value = false; try { residenceReady.value = (await props.residenceClient.getResidence({})).isReady; } catch { error.value = true; } }); }

async function publish(id: string, isPublic: boolean) { await run(async () => { await props.client.publish({ walletId: id, isPublic }); publications.value = await props.client.ownPublication({}); }); }

function clearRecipient() {
	recipientVersion++; selectionVersion++;
	recipient.value = null; recipientUserId.value = ''; recipientAddress.value = ''; addresses.value = [];
	recipientLoading.value = false; recipientFailed.value = false;
}

async function selectRecipient() {
	if (busy.value) return;
	const version = ++selectionVersion;
	error.value = false;
	try {
		const { selectUser } = await import('@features/ui/frontend/os.js');
		if (version !== selectionVersion) return;
		const user = await selectUser({ localOnly: true, includeSelf: false });
		if (version !== selectionVersion) return;
		clearRecipient();
		if (user.host != null || user.id === props.currentUserId) { error.value = true; return; }
		recipient.value = { id: user.id, username: user.username };
		recipientUserId.value = user.id;
		await reloadRecipient();
	} catch { if (version === selectionVersion) error.value = true; }
}

async function reloadRecipient() {
	if (!recipient.value || busy.value) return;
	const version = ++recipientVersion, userId = recipient.value.id;
	addresses.value = []; recipientAddress.value = ''; recipientLoading.value = true; recipientFailed.value = false;
	try {
		const wallets = await props.client.publicWallets({ userId });
		if (version === recipientVersion) addresses.value = wallets;
	} catch { if (version === recipientVersion) recipientFailed.value = true; } finally { if (version === recipientVersion) recipientLoading.value = false; }
}

async function prepare() {
	await run(async () => {
		const fields = prepareFields.value; if (!fields) throw new Error('Unavailable');
		if (!matchingRetry.value) { await ensureResidence(); retry.value = { input: { ...fields, requestKey: crypto.randomUUID() } }; }
		if (!retry.value) throw new Error('Preparation unavailable');
		await props.client.prepare(retry.value.input); retry.value = undefined; await refresh();
	});
}

async function ensureResidence() { residenceReady.value = false; await requireResidenceForStart(props.residenceClient); residenceReady.value = true; }

async function startBroadcast(intentId: string) {
	sendAttempts.value[intentId] = true;
	try {
		const started = await props.client.start({ intentId });
		history.value = history.value.map(row => row.id === started.id ? started : row);
	} catch (cause) {
		if (cause !== null && typeof cause === 'object' && 'code' in cause && cause.code === 'RESIDENCE_REQUIRED') {
			// A definitive guard rejection precedes the server reservation and wallet request.
			residenceReady.value = false; sendAttempts.value[intentId] = false;
		}
		throw cause;
	}
}

async function send(intent: PeerTransfer) {
	await run(async () => {
		const connector = connectors.value.find(row => row.id === connectorId.value); if (!connector) throw new Error('Wallet unavailable');
		const hash = await sendPeerTransfer(connector.provider, intent, ensureResidence, async () => startBroadcast(intent.id)); hashes.value[intent.id] = hash;
		await props.client.check({ intentId: intent.id, txHash: hash }); await refresh();
	});
}

async function check(intent: PeerTransfer) { await run(async () => { await props.client.check({ intentId: intent.id, ...(logIndices.value[intent.id] != null ? { logIndex: logIndices.value[intent.id]! } : {}), ...(!intent.txHash && hashes.value[intent.id] ? { txHash: hashes.value[intent.id] } : {}) }); await refresh(); }); }
</script>
<locale lang="json" locale="ja-JP">
{"broadcastUnknown":"この送金は送信開始済みです。結果が不明な場合も再送せず、ウォレットで取引ハッシュを確認して登録してください。","residenceRequired":"新しい送金の準備・送信前に居住地を設定してください。送信済みハッシュの確認と履歴は引き続き利用できます。","scope":"ユーザー間のERC20送金の試作です。内容を確認してウォレットで送信し、サーバーで確認します。残高やノートのリアクションは変更しません。","failed":"処理できませんでした。送信済みの場合は再送せず、ウォレットの取引ハッシュで確認してください。","load":"読み込む","reload":"ウォレット・トークン・履歴を再読み込み","publication":"受取用アドレスは初期状態では非公開です。公開すると他のアカウントが取得でき、チェーン上の履歴とあなたのアカウントを関連付けられます。非公開に戻すと新しい送金準備の対象から外れます。","publish":"受取アドレスを公開する","hide":"非公開に戻す","recipient":"受取人のローカルユーザー名","lookup":"公開アドレスを確認","recipientLabel":"受取人","selectRecipient":"選択","clearRecipient":"解除","recipientLoading":"受取人の公開ウォレットを取得しています。","recipientFailed":"公開ウォレットを取得できませんでした。再取得するか受取人を選び直してください。","noRecipientWallet":"この受取人には公開された受取ウォレットがありません。","retryRecipient":"公開ウォレットを再取得","token":"トークン","payer":"登録済みの送信元","address":"公開された受取アドレス","amount":"送金額（トークン単位）","prepare":"送金内容を準備する","browserWallet":"送信に使うブラウザーウォレット","send":"内容を確認してウォレットで送信","log":"ログインデックス（任意）","logCaption":"同じ内容のTransferログが複数ある場合だけ指定します。","hash":"取引ハッシュ","check":"送金を確認","baseUnits":"最小単位"}
</locale>
