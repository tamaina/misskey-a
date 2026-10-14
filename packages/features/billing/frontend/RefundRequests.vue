<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkButton :disabled="busy" @click="load()">{{ $locale.sfc.load }}</MkButton>
	<form v-if="!admin" class="_gaps_s" @submit.prevent="request">
		<MkInput v-model="cutoff" type="datetime-local" :disabled="busy"><template #label>{{ $locale.sfc.requested }}</template><template #caption>{{ $locale.sfc.now }}</template></MkInput>
		<MkInput v-model="reason" required :disabled="busy"><template #label>{{ $locale.sfc.reason }}</template></MkInput>
		<MkButton type="submit" :disabled="busy">{{ $locale.sfc.request }}</MkButton>
	</form>
	<MkSelect v-if="admin" v-model="walletId" :items="walletItems" :disabled="busy"><template #label>{{ $locale.sfc.wallet }}</template></MkSelect>
	<form class="_gaps_s" @submit.prevent="show">
		<MkInput v-model="lookupId" :disabled="busy"><template #label>{{ $locale.sfc.lookup }}</template></MkInput>
		<MkButton type="submit" :disabled="busy || !lookupId">{{ $locale.sfc.show }}</MkButton>
	</form>
	<div v-for="row in requests" :key="row.id" class="_gaps_m">
		<MkInfo>{{ row.id }} / {{ row.status }}<br>{{ $locale.sfc.requested }}: {{ new Date(row.requestedCutoffAt).toISOString() }}<br>{{ $locale.sfc.effective }}: {{ row.effectiveCutoffAt === null ? '—' : new Date(row.effectiveCutoffAt).toISOString() }}<br>{{ row.reason }}</MkInfo>
		<MkInfo v-for="review in row.quote?.reviewReasons" :key="review" warn>{{ review }}</MkInfo>
		<form v-if="admin && ['requested', 'review_required'].includes(row.status)" class="_gaps_s" @submit.prevent="decide(row, 'approve')">
			<MkInput v-model="effective[row.id]" type="datetime-local" :disabled="busy"><template #label>{{ $locale.sfc.effective }}</template><template #caption>{{ $locale.sfc.keepRequested }}</template></MkInput>
			<MkInput v-model="reasons[row.id]" required :disabled="busy"><template #label>{{ $locale.sfc.reason }}</template></MkInput>
			<div class="_buttons"><MkButton type="submit" :disabled="busy">{{ $locale.sfc.approve }}</MkButton><MkButton :disabled="busy" @click="decide(row, 'reject')">{{ $locale.sfc.reject }}</MkButton></div>
		</form>
		<div v-for="group in row.quote?.groups" :key="group.id" class="_gaps_s">
			<MkInfo>{{ $locale.sfc.recipient }}: {{ group.payerAddress }}<br>{{ $locale.sfc.rail }}: {{ group.chainId }} / {{ group.contractAddress }}<br>{{ $locale.sfc.amount }}: {{ formatServiceAmount(group.amountBaseUnits, group.decimals) }} / {{ group.amountBaseUnits }} ({{ group.decimals }})</MkInfo>
			<MkButton v-if="admin && transfer(row, group.id)?.status === 'prepared' && ['prepared','processing'].includes(row.status)" :disabled="busy || !walletId" @click="send(row, group)">{{ $locale.sfc.send }}</MkButton>
			<MkInfo v-if="transfer(row, group.id)?.status === 'broadcast_pending'" warn>{{ $locale.sfc.unknown }}</MkInfo>
			<form v-if="admin && transfer(row, group.id)?.status === 'broadcast_pending'" class="_gaps_s" @submit.prevent="submit(row.id, group.id)">
				<MkInput v-model="hashes[`${row.id}:${group.id}`]" :disabled="busy"><template #label>{{ $locale.sfc.hash }}</template></MkInput>
				<MkButton type="submit" :disabled="busy">{{ $locale.sfc.submit }}</MkButton>
			</form>
			<MkInfo v-if="transfer(row, group.id)?.txHash">{{ transfer(row, group.id)?.txHash }}</MkInfo>
		</div>
		<div class="_buttons">
			<MkButton v-if="admin && ['prepared','processing'].includes(row.status)" :disabled="busy" @click="check(row)">{{ $locale.sfc.check }}</MkButton>
			<MkButton v-if="!admin && ['requested','review_required','prepared'].includes(row.status)" :disabled="busy" @click="cancel(row)">{{ $locale.sfc.cancel }}</MkButton>
			<MkButton v-if="row.document" :disabled="busy" @click="download(row)">{{ $locale.sfc.document }}</MkButton>
		</div>
	</div>
	<MkButton v-if="nextCursor" :disabled="busy" @click="load(nextCursor)">{{ $locale.sfc.next }}</MkButton>
</div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { discoverWallets } from './wallet-discovery.js';
import { formatServiceAmount } from './service-client.js';
import { renderRefundDocument } from './refund-client.js';
import type { RefundClient } from './refund-client.js';
import type { WalletConnector } from './wallet-client.js';
import type { RefundData, RefundQuote } from '../shared/refund-types.js';
const props = defineProps<{ client: RefundClient; admin?: boolean }>();
const requests = ref<RefundData[]>([]), nextCursor = ref<string | null>(null);
const cutoff = ref(''), reason = ref(''), lookupId = ref(''), walletId = ref('');
const effective = ref<Record<string, string>>({}), reasons = ref<Record<string, string>>({}), hashes = ref<Record<string, string>>({});
const wallets = ref<readonly WalletConnector[]>([]), busy = ref(false), error = ref(false);
const walletItems = computed(() => wallets.value.map(wallet => ({ value: wallet.id, label: wallet.name })));
let detach: (() => void) | undefined;
onMounted(() => { if (props.admin) detach = discoverWallets(window, value => { wallets.value = value; }); });
onBeforeUnmount(() => detach?.());
const transfer = (row: RefundData, id: string) => row.transfers.find(item => item.id === id);
let retry: { input: { requestKey: string; cutoffAt?: number; reason: string }; rawCutoff: string } | undefined;

async function run(action: () => Promise<void>) { if (busy.value) return; busy.value = true; error.value = false; try { await action(); } catch { error.value = true; } finally { busy.value = false; } }

function update(row: RefundData) { const index = requests.value.findIndex(item => item.id === row.id); if (index < 0) requests.value.unshift(row); else requests.value[index] = row; }

async function load(cursor?: string | null) { await run(async () => { const page = await (props.admin ? props.client.adminListRefunds : props.client.listRefunds)({ ...(cursor ? { cursor } : {}), limit: 20 }); requests.value = page.items; nextCursor.value = page.nextCursor; }); }

async function show() { await run(async () => update(await (props.admin ? props.client.adminShowRefund : props.client.showRefund)({ requestId: lookupId.value }))); }

async function request() { await run(async () => { if (!retry || retry.rawCutoff !== cutoff.value || retry.input.reason !== reason.value) retry = { rawCutoff: cutoff.value, input: { requestKey: crypto.randomUUID(), ...(cutoff.value ? { cutoffAt: new Date(cutoff.value).getTime() } : {}), reason: reason.value } }; update(await props.client.requestRefund(retry.input)); retry = undefined; }); }

async function decide(row: RefundData, decision: 'approve' | 'reject') { await run(async () => update(await props.client.decideRefund({ requestId: row.id, version: row.version, decision, reason: reasons.value[row.id] ?? '', ...(effective.value[row.id] ? { effectiveCutoffAt: new Date(effective.value[row.id]).getTime() } : {}) }))); }

async function cancel(row: RefundData) { await run(async () => update(await props.client.cancelRefund({ requestId: row.id }))); }

async function check(row: RefundData) { await run(async () => update(await props.client.checkRefund({ requestId: row.id }))); }

async function submit(requestId: string, transferId: string) { await run(async () => update(await props.client.submitRefundTransfer({ requestId, transferId, txHash: hashes.value[`${requestId}:${transferId}`] ?? '' }))); }

async function send(row: RefundData, group: RefundQuote['groups'][number]) {
	await run(async () => {
		const provider = wallets.value.find(wallet => wallet.id === walletId.value)?.provider; if (!provider) throw new Error('Wallet unavailable');
		const accounts = await provider.request({ method: 'eth_requestAccounts' });
		if (!Array.isArray(accounts) || typeof accounts[0] !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(accounts[0])) throw new Error('Invalid account');
		const chainId = `0x${group.chainId.toString(16)}`;
		if (await provider.request({ method: 'eth_chainId' }) !== chainId) await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
		if (await provider.request({ method: 'eth_chainId' }) !== chainId) throw new Error('Wrong chain');
		const currentAccounts = await provider.request({ method: 'eth_accounts' });
		if (!Array.isArray(currentAccounts) || currentAccounts[0] !== accounts[0]) throw new Error('Account changed');
		const intent = await props.client.startRefundTransfer({ requestId: row.id, transferId: group.id, version: row.version, senderAddress: accounts[0] });
		update(intent);
		// This persisted intent disables every resend path, even if wallet/RPC outcome is unknown.
		const data = `0xa9059cbb${group.payerAddress.slice(2).padStart(64, '0')}${BigInt(group.amountBaseUnits).toString(16).padStart(64, '0')}`;
		const hash = await provider.request({ method: 'eth_sendTransaction', params: [{ from: accounts[0], to: group.contractAddress, value: '0x0', data, chainId }] });
		if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error('Unknown broadcast result');
		hashes.value[`${row.id}:${group.id}`] = hash;
		update(await props.client.submitRefundTransfer({ requestId: row.id, transferId: group.id, txHash: hash }));
	});
}

function download(row: RefundData) { if (!row.document) return; const url = URL.createObjectURL(new Blob([renderRefundDocument(row.document)], { type: 'text/html;charset=utf-8' })); const a = window.document.createElement('a'); a.href = url; a.download = `refund-${row.id}.html`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
</script>
<locale lang="json" locale="ja-JP">
{"scope":"返金申請と確定状況を確認します。全送金のチェーン確認が終わるまで利用期間は変わりません。由来不明の旧購入は自動返金できません。","failed":"処理できませんでした。入力を確認して再読込してください。送信開始済みの返金は再送しないでください。","load":"読み込む","requested":"希望終了日時","effective":"管理者承認の終了日時","now":"空欄なら今すぐ終了を希望します。","keepRequested":"空欄なら当初の希望日時を保持します。","reason":"理由","request":"返金を申請","wallet":"管理者の送金ウォレット","lookup":"申請ID","show":"申請を開く","approve":"再見積・承認","reject":"却下","recipient":"原購入ウォレットへの返金先","rail":"チェーン / ERC20コントラクト","amount":"返金額 / 最小単位 / 小数桁","send":"接続ウォレットで返金を送信","unknown":"送信開始済みです。結果不明でも再送せず、ウォレットの履歴からTx Hashを確認してください。","hash":"送信済みトランザクションハッシュ","submit":"ハッシュを登録・復帰","check":"全送金を再確認して一括失効","cancel":"送信前の申請を取り消す","document":"返金証憑を保存（印刷可）","next":"次のページ"}
</locale>
