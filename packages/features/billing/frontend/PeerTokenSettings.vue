<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton>
	<MkButton v-for="token in tokens" :key="token.id" :disabled="busy" @click="draft = { ...token }">{{ token.name }}</MkButton>
	<form class="_gaps_s" @submit.prevent="save">
		<MkInput v-model="draft.id" required :disabled="busy"><template #label>{{ $locale.sfc.id }}</template></MkInput>
		<MkInput v-model="draft.name" required :disabled="busy"><template #label>{{ $locale.sfc.name }}</template></MkInput>
		<MkInput v-model="draft.chainId" type="number" :min="1" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.chain }}</template></MkInput>
		<MkInput v-model="draft.contractAddress" required :disabled="busy"><template #label>{{ $locale.sfc.contract }}</template></MkInput>
		<MkInput v-model="draft.tokenSymbol" required :disabled="busy"><template #label>{{ $locale.sfc.symbol }}</template></MkInput>
		<MkInput v-model="draft.decimals" type="number" :min="0" :max="255" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.decimals }}</template></MkInput>
		<MkInput v-model="draft.confirmationsRequired" type="number" :min="1" step="1" required :disabled="busy"><template #label>{{ $locale.sfc.confirmations }}</template></MkInput>
		<MkSwitch v-model="draft.isEnabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
		<MkButton type="submit" :disabled="busy">{{ $locale.sfc.save }}</MkButton>
	</form>
</div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import * as v from 'valibot';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { peerToken } from '../backend/peer.contract.js';
import type { PeerToken } from '../backend/peer.contract.js';
import type { PeerPaymentClient } from './peer-client.js';
const props = defineProps<{ client: Pick<PeerPaymentClient, 'listSettings' | 'saveSettings'> }>();
const tokens = ref<PeerToken[]>([]), draft = ref<PeerToken>({ id: '', name: '', chainId: 0, contractAddress: '', tokenSymbol: '', decimals: 0, confirmationsRequired: 0, isEnabled: false });
const busy = ref(false), error = ref(false);

async function load() { busy.value = true; error.value = false; try { tokens.value = await props.client.listSettings({}); } catch { error.value = true; } finally { busy.value = false; } }

async function save() { if (busy.value) return; busy.value = true; error.value = false; try { draft.value = { ...await props.client.saveSettings(v.parse(peerToken, draft.value)) }; tokens.value = await props.client.listSettings({}); } catch { error.value = true; } finally { busy.value = false; } }
</script>
<locale lang="json" locale="ja-JP">{"scope":"ユーザー間で送金を準備・確認できるトークンを明示します。価格・手数料・受取先は設定しません。チェーンとRPCはウォレット設定で管理します。","failed":"設定を読み込み・保存できませんでした。","load":"読み込む","id":"トークン設定ID","name":"表示名","chain":"チェーンID","contract":"ERC20コントラクト","symbol":"トークン表示名","decimals":"小数桁数","confirmations":"必要確認数","enabled":"新しい送金準備を有効にする","save":"保存"}</locale>
