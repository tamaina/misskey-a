<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<details class="_panel" :class="$style.panel">
	<summary>{{ $locale.sfc.title }}</summary>
	<div class="_gaps" :class="$style.body" :aria-busy="busy">
		<p>{{ $locale.sfc.scope }}</p>
		<MkInfo>{{ $locale.sfc.noWrite }}</MkInfo>
		<p>{{ $locale.sfc.localDescription }}</p>
		<MkButton :disabled="disabled || busy" @click="localInput?.click()">{{ $locale.sfc.localChoose }}</MkButton>
		<input ref="localInput" type="file" accept=".fukushu" hidden :disabled="disabled || busy" data-testid="upstream-local-file" @change="inspectLocal">
		<p>{{ $locale.sfc.drive }} <MkA to="/my/drive">{{ $locale.sfc.openDrive }}</MkA></p>
		<div class="_buttons">
			<MkButton :disabled="disabled || busy" @click="pick">{{ $locale.sfc.choose }}</MkButton>
			<MkButton :disabled="disabled || busy || !selected" :wait="busy" @click="inspect">{{ $locale.sfc.inspect }}</MkButton>
		</div>
		<p v-if="localName">{{ localName }} · {{ $locale.sfc.localOnly }}</p>
		<p v-if="selected">{{ selected.name }}</p>
		<p v-if="error" role="alert" :class="$style.error">{{ error }}</p>
		<section v-if="report" class="_gaps" role="status">
			<h3>{{ $locale.sfc.result }}</h3>
			<p>{{ $locale.sfc.decks }}: {{ report.counts.decks }} · {{ $locale.sfc.cards }}: {{ report.counts.questions }} · {{ $locale.sfc.states }}: {{ report.counts.studyStates }} · {{ $locale.sfc.reviews }}: {{ report.counts.reviewLogs }}</p>
			<p>{{ $locale.sfc.sources }}: {{ report.counts.importSources }} · {{ $locale.sfc.media }}: {{ report.counts.media }} · {{ $locale.sfc.imports }}: {{ report.counts.imports }} · {{ $locale.sfc.bytes }}: {{ report.binaryBytes }}</p>
			<p>{{ $locale.sfc.currentRetention }}: {{ report.currentDesiredRetention }}. {{ $locale.sfc.notHistorical }}</p>
			<p>{{ $locale.sfc.noExportTime }}</p>
			<p v-if="report.missingQuestionOrders">{{ $locale.sfc.missingOrder }}: {{ report.missingQuestionOrders }}</p>
			<ul><li v-for="deck in report.decks" :key="deck.id">{{ deck.name }} — {{ $locale.sfc.cards }}: {{ deck.questions }} · {{ $locale.sfc.reviews }}: {{ deck.reviewLogs }}</li></ul>
			<h3>{{ $locale.sfc.history }}</h3>
			<p>{{ $locale.sfc.unknown }}</p>
			<ul class="_gaps_s">
				<li v-for="row in report.history" :key="row.id" class="_gaps_s" :class="$style.record">
					<p>{{ new Date(row.reviewedAt).toLocaleString() }} · {{ row.rating }} · {{ row.correct ? $locale.sfc.correct : $locale.sfc.incorrect }}</p>
					<p>{{ $locale.sfc.questionId }}: {{ row.questionId }}</p>
					<p>{{ $locale.sfc.unknownCard }}</p>
				</li>
			</ul>
			<p v-if="!report.history.length">{{ $locale.sfc.empty }}</p>
			<p>{{ $locale.sfc.integrity }}</p>
			<p>{{ $locale.sfc.noWrite }}</p>
		</section>
	</div>
</details>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { inspectLocalUpstream } from '../upstream-local.js';
import type { UpstreamInspection } from '../../shared/upstream-backup.schema.js';

const props = defineProps<{ disabled?: boolean }>();
const localInput = ref<HTMLInputElement>();
const localName = ref('');
const selected = ref<{ id: string; name: string } | null>(null);
const report = ref<UpstreamInspection | null>(null);
const busy = ref(false);
const error = ref('');
let disposed = false;
let selection = 0;

async function pick() {
	if (props.disabled || busy.value) return;
	const current = ++selection;
	try {
		const [file] = await chooseDriveFile({ multiple: false });
		if (file && current === selection && !disposed && !props.disabled && !busy.value) {
			selected.value = { id: file.id, name: file.name }; localName.value = ''; report.value = null; error.value = '';
		}
	} catch { if (!disposed && current === selection) error.value = $locale.value.sfc.failed; }
}

function inspectionError(cause: unknown) {
	const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : null;
	return code === 'BACKUP_TOO_LARGE' || code === 'UPSTREAM_INSPECTION_LIMIT' ? $locale.value.sfc.limit : $locale.value.sfc.failed;
}

async function inspectLocal(event: Event) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = '';
	if (!file || props.disabled || busy.value) return;
	selection++; busy.value = true; report.value = null; error.value = ''; selected.value = null; localName.value = file.name;
	try {
		const result = await inspectLocalUpstream(file);
		if (!disposed) report.value = result;
	} catch (cause) { if (!disposed) error.value = inspectionError(cause); } finally { if (!disposed) busy.value = false; }
}

async function inspect() {
	if (!selected.value || props.disabled || busy.value) return;
	selection++; busy.value = true; report.value = null; error.value = '';
	try {
		const result = await misskeyApi('fukushu/backup/inspect-upstream', { fileId: selected.value.id }, undefined, AbortSignal.timeout(20_000));
		if (!disposed) report.value = result;
	} catch (cause) {
		if (!disposed) {
			error.value = inspectionError(cause);
		}
	} finally { if (!disposed) busy.value = false; }
}

onBeforeUnmount(() => { disposed = true; selection++; });
</script>

<style lang="scss" module>
.panel { padding: 20px; overflow-wrap: anywhere; }
.panel summary { cursor: pointer; font-weight: bold; }
.body { margin-top: 20px; }
.body h3, .body p { margin: 0; }
.record { border-top: 1px solid var(--MI_THEME-divider); padding-top: 12px; }
.error { color: var(--MI_THEME-error); }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "本家 Fukushu のバックアップを調べる",
	"scope": "本家の .fukushu バイナリ形式を読み込みます。初回は8 MiB・100教材・1,000カード・10,000履歴まで。旧JSONは対象外です。",
	"noWrite": "移行前の検査だけを行います。教材・予定・履歴は取り込まず、既存データも変更しません。",
	"localDescription": "端末内で検査できます。ファイルの内容はサーバーへ送信せず、Drive やブラウザにも保存しません。",
	"localChoose": "端末の .fukushu を検査",
	"localOnly": "端末内で検査・未送信",
	"drive": "本人の Drive に保存した原本を選んでください。Drive がバイナリファイルのアップロードを許可しているアカウントで利用できます。公開URLや公開状態は変わりません。",
	"openDrive": "Drive を開く",
	"choose": "本家 .fukushu を Drive から選ぶ",
	"inspect": "本家バックアップを書き込まずに検査",
	"result": "読み込めた内容",
	"decks": "教材",
	"cards": "カード",
	"states": "復習状態",
	"reviews": "復習記録",
	"sources": "読み込み元",
	"media": "媒体",
	"imports": "取り込み操作記録",
	"bytes": "バイナリのバイト数",
	"currentRetention": "現在の設定にある目標記憶率",
	"notHistorical": "過去の復習時に使った値とは限りません。",
	"noExportTime": "このバイナリ形式には書き出し日時が記録されていません。",
	"missingOrder": "元の出題順が未記録のカード",
	"history": "復習記録の見本（新しい順に最大20件）",
	"unknown": "本家の履歴には回答時のカード内容・版や完全な前後の状態がありません。現在のカードや予定から過去の値を推測せず、不明として扱います。",
	"unknownCard": "回答時のカード内容: 不明（バックアップに保存されていません）",
	"questionId": "元のカードID",
	"correct": "記録上の正解",
	"incorrect": "記録上の不正解",
	"empty": "復習記録は含まれていません。",
	"integrity": "チェックサム・形式・参照と媒体のハッシュを検査しました。作成者の証明やHTML・媒体の安全性確認ではありません。媒体は表示しません。",
	"limit": "検査のサイズ・件数上限を超えています。一部だけを取り込むことはありません。",
	"failed": "本家バイナリの検査に失敗しました。原本の取得・形式・整合性を確認してください。データは変更していません。"
}
</locale>
<locale locale="en-US" lang="json">
{
	"title": "Inspect an upstream Fukushu backup",
	"scope": "Read the upstream .fukushu binary format. This pilot allows 8 MiB, 100 decks, 1,000 cards and 10,000 reviews. Legacy JSON is excluded.",
	"noWrite": "Pre-import inspection only. No materials, schedules or history are imported, and existing data is unchanged.",
	"localDescription": "Inspect on this device. File contents are not sent to the server or saved in Drive or browser storage.",
	"localChoose": "Inspect a .fukushu on this device",
	"localOnly": "Inspected locally · not uploaded",
	"drive": "Choose an original in your own Drive. Your account must already be allowed to upload binary files. Its public URL and visibility remain unchanged.",
	"openDrive": "Open Drive",
	"choose": "Choose an upstream .fukushu from Drive",
	"inspect": "Inspect upstream backup without writing",
	"result": "Archive contents",
	"decks": "Decks",
	"cards": "Cards",
	"states": "Study states",
	"reviews": "Reviews",
	"sources": "Import sources",
	"media": "Media",
	"imports": "Import operations",
	"bytes": "Binary bytes",
	"currentRetention": "Desired retention in current settings",
	"notHistorical": "This is not evidence of the value used for past reviews.",
	"noExportTime": "This binary format does not record an export timestamp.",
	"missingOrder": "Cards without recorded source order",
	"history": "Review sample (newest 20 at most)",
	"unknown": "Upstream history lacks historical card content, versions and complete before/after states. We do not infer them from current cards or schedules.",
	"unknownCard": "Card content at review time: unknown (not stored in the backup)",
	"questionId": "Original card ID",
	"correct": "Recorded correct",
	"incorrect": "Recorded incorrect",
	"empty": "No review records in this archive.",
	"integrity": "Checksums, schemas, references and media hashes were checked. This does not authenticate authorship or establish HTML/media safety. Media is not displayed.",
	"limit": "The archive exceeds the inspection size or record limit. No partial import is performed.",
	"failed": "Could not inspect the upstream binary archive. Check original availability, format and integrity. No data was changed."
}
</locale>
