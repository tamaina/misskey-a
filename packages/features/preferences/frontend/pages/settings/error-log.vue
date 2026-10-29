<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div class="_buttons">
		<MkButton :disabled="logs.length === 0" @click="copy(logs)">{{ $locale.sfc.copyAll }}</MkButton>
		<MkButton danger :disabled="logs.length === 0" @click="clear">{{ $locale.sfc.deleteAll }}</MkButton>
	</div>
	<article v-for="log in logs" :key="log.id" class="_panel _gaps_s" :class="$style.entry">
		<div :class="$style.meta">
			<MkTime :time="log.date" mode="detail"/>
			<span :class="$style.type">{{ log.type }}</span>
		</div>
		<div :class="$style.message" class="_selectable">{{ log.message }}</div>
		<MkFolder :canPage="false">
			<template #label>{{ $locale.sfc.details }}</template>
			<pre :class="$style.log" class="_selectable">{{ log.stack }}</pre>
			<div>{{ $locale.sfc.version }} {{ log.version }}</div>
		</MkFolder>
		<MkButton @click="copy([log])"><i class="ti ti-copy"></i> {{ $locale.sfc.copy }}</MkButton>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { ClientErrorLog } from '@features/runtime/frontend/error-log.js';
import { clientErrorLogs, loadClientErrorLogs, clearClientErrorLogs } from '@features/runtime/frontend/error-log.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import * as os from '@features/ui/frontend/os.js';

loadClientErrorLogs();
const logs = computed(() => [...clientErrorLogs.value].reverse());

/** Copies sanitized entries and only reports success after the clipboard write completes. */
async function copy(entries: ClientErrorLog[]): Promise<void> {
	try {
		await navigator.clipboard.writeText(JSON.stringify(entries, null, 2));
		os.toast($locale.value.sfc.copiedToClipboard);
	} catch {
		await os.alert({ type: 'error', text: $locale.value.sfc.error });
	}
}

/** Confirms bulk deletion and reports storage failures to the user. */
async function clear(): Promise<void> {
	const { canceled } = await os.confirm({ type: 'warning', text: $locale.value.sfc.deleteConfirm });
	if (canceled) return;
	if (!clearClientErrorLogs()) await os.alert({ type: 'error', text: $locale.value.sfc.error });
}
</script>

<style lang="scss" module>
.entry {
	padding: var(--MI-margin);
}

.meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	font-size: 85%;
	color: var(--MI_THEME-fgTransparentWeak);
}

.type {
	padding: 2px 8px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
}

.message {
	font-weight: bold;
	overflow-wrap: anywhere;
	white-space: pre-wrap;
}

.log {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	max-height: 300px;
	overflow: auto;
}
</style>

<locale locale="en-US" lang="json">
{
  "title": "Client error logs",
  "copyAll": "Copy all",
  "deleteAll": "Delete all",
  "deleteConfirm": "Delete all client error logs?",
  "details": "Details",
  "version": "Version",
  "copy": "Copy",
  "copiedToClipboard": "Copied to clipboard",
  "error": "Error"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "title": "クライアントエラーログ",
  "copyAll": "すべてコピー",
  "deleteAll": "すべて削除",
  "deleteConfirm": "クライアントエラーログをすべて削除しますか？",
  "details": "詳細",
  "version": "バージョン",
  "copy": "コピー",
  "copiedToClipboard": "クリップボードにコピーしました",
  "error": "エラー"
}
</locale>
