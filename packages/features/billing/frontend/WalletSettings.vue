<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ $locale.sfc.title }}</template>
		<MkInfo>{{ $locale.sfc.description }}</MkInfo>
	</FormSection>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="registered" role="status">{{ $locale.sfc.registered }}</MkInfo>
	<div class="_buttons"><MkButton rounded :disabled="busy" @click="load"><i class="ti ti-refresh"></i> {{ $locale.sfc.reload }}</MkButton></div>
	<FormSection>
		<template #label>{{ $locale.sfc.linked }}</template>
		<div v-if="!wallets.length">{{ $locale.sfc.empty }}</div>
		<div v-for="wallet in sortedWallets" :key="wallet.id" class="_panel _gaps_s" :class="$style.wallet">
			<div><strong>{{ chainName(wallet.chainId) }}</strong> <span v-if="isConnected(wallet)">{{ $locale.sfc.connected }}</span></div>
			<code :class="$style.address">{{ wallet.address }}</code>
			<div class="_buttons"><MkButton rounded danger :disabled="busy" @click="unlink(wallet)"><i class="ti ti-unlink"></i> {{ $locale.sfc.unlink }}</MkButton></div>
		</div>
	</FormSection>
	<FormSection>
		<template #label>{{ $locale.sfc.register }}</template>
		<div class="_gaps_m">
			<MkSelect v-model="chainId" :items="chainItems" :disabled="busy || !chains.length"><template #label>{{ $locale.sfc.chain }}</template></MkSelect>
			<MkInput v-model="password" type="password" autocomplete="current-password" :disabled="busy"><template #label>{{ $locale.sfc.password }}</template></MkInput>
			<MkInput v-model="twoFactorToken" autocomplete="one-time-code" :disabled="busy"><template #label>{{ $locale.sfc.twoFactor }}</template></MkInput>
			<MkInfo v-if="!connectors.length" warn>{{ $locale.sfc.noWallet }}</MkInfo>
			<div class="_buttons"><MkButton v-for="connector in connectors" :key="connector.id" primary rounded :disabled="busy || chainId === null" @click="link(connector)"><i class="ti ti-wallet"></i> {{ connector.name }} {{ $locale.sfc.link }}</MkButton></div>
			<div v-if="busy && step" class="_gaps_s" role="status">
				<div>{{ $locale.sfc[step] }}</div>
				<MkButton v-if="step !== 'verify'" rounded @click="cancel">{{ $locale.sfc.cancel }}</MkButton>
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { computed, onBeforeUnmount, ref } from 'vue';
import { linkWallet, WalletLinkCancelled } from './wallet-link.js';
import type { LinkedWallet, WalletChain } from '../backend/wallet.definition.js';
import type { ConnectedWallet, WalletClient, WalletConnector } from './wallet-client.js';
import type { WalletStep } from './wallet-link.js';

const props = defineProps<{
	client: WalletClient;
	connectors: readonly WalletConnector[];
	/** Host binds Misskey's native confirmation dialog; cancellation returns false. */
	confirmUnlink(wallet: LinkedWallet): Promise<boolean>;
}>();
const wallets = ref<LinkedWallet[]>([]);
const chains = ref<WalletChain[]>([]);
const chainItems = computed(() => chains.value.map(chain => ({ value: chain.chainId, label: `${chain.name} (${chain.chainId})` })));
const chainId = ref<number | null>(null);
const password = ref('');
const twoFactorToken = ref('');
const busy = ref(false);
const error = ref(false);
const registered = ref(false);
const step = ref<WalletStep | null>(null);
const connection = ref<ConnectedWallet | null>(null);
let cancelled = false;
onBeforeUnmount(() => { cancelled = true; });
const sortedWallets = computed(() => [...wallets.value].sort((a, b) => Number(isConnected(b)) - Number(isConnected(a))));

function isConnected(wallet: LinkedWallet): boolean {
	return connection.value?.chainId === wallet.chainId && connection.value.address.toLowerCase() === wallet.address.toLowerCase();
}

function chainName(id: number): string { return chains.value.find(chain => chain.chainId === id)?.name ?? String(id); }

async function load(): Promise<void> {
	if (busy.value) return;
	busy.value = true;
	error.value = false;
	try {
		const result = await Promise.all([props.client.list({}), props.client.chains({})]);
		[wallets.value, chains.value] = result;
		if (!chains.value.some(chain => chain.chainId === chainId.value)) chainId.value = chains.value[0]?.chainId ?? null;
	} catch { error.value = true; } finally { busy.value = false; }
}

function cancel(): void { cancelled = true; }

async function link(connector: WalletConnector): Promise<void> {
	const chain = chains.value.find(value => value.chainId === chainId.value);
	if (busy.value || !chain) return;
	busy.value = true;
	error.value = false;
	registered.value = false;
	cancelled = false;
	try {
		const wallet = await linkWallet({
			client: props.client,
			connector,
			chain,
			auth: {
				...(password.value ? { currentPassword: password.value } : {}),
				...(twoFactorToken.value ? { twoFactorToken: twoFactorToken.value } : {}),
			},
			cancelled: () => cancelled,
			progress: value => { step.value = value; },
			connected: value => { connection.value = value; },
		});
		wallets.value = [wallet, ...wallets.value.filter(value => value.id !== wallet.id)];
		registered.value = true;
	} catch (cause) { if (!(cause instanceof WalletLinkCancelled)) error.value = true; } finally { password.value = ''; twoFactorToken.value = ''; busy.value = false; step.value = null; }
}

async function unlink(wallet: LinkedWallet): Promise<void> {
	if (busy.value) return;
	busy.value = true;
	error.value = false;
	try {
		if (!await props.confirmUnlink(wallet)) return;
		await props.client.unlink({ walletId: wallet.id });
		wallets.value = wallets.value.filter(value => value.id !== wallet.id);
		if (isConnected(wallet)) connection.value = null;
	} catch { error.value = true; } finally { busy.value = false; }
}
</script>

<style lang="scss" module>
.wallet { padding: 16px; }
.address { overflow-wrap: anywhere; }
</style>

<locale lang="json" locale="ja-JP">
{
	"title": "ウォレット",
	"description": "ウォレットの所有確認をして、このアカウントに登録します。登録の署名では送金しません。",
	"reload": "読み込む",
	"linked": "登録済みウォレット",
	"empty": "登録されたウォレットはありません。",
	"connected": "接続中",
	"unlink": "登録を解除",
	"register": "ウォレットを登録",
	"registered": "ウォレットを登録しました。",
	"chain": "チェーン",
	"password": "現在のパスワード",
	"twoFactor": "二段階認証コード（有効な場合）",
	"noWallet": "利用できるウォレットがありません。",
	"link": "で登録",
	"connect": "ウォレットで接続を許可してください。",
	"switch": "ウォレットでチェーンの切り替えを許可してください。",
	"sign": "表示された登録メッセージを確認して、ウォレットで署名してください。",
	"verify": "署名を確認しています。",
	"cancel": "中止（ウォレット側でも要求を拒否してください）",
	"failed": "ウォレットの操作を完了できませんでした。"
}
</locale>
