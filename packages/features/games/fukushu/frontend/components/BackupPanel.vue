<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<details class="_panel" :class="$style.panel">
	<summary>{{ $locale.sfc.title }}</summary>
	<div class="_gaps" :class="$style.body" :aria-busy="busy">
		<p>{{ $locale.sfc.scope }}</p>
		<template v-if="deckId">
			<h3>{{ $locale.sfc.exportTitle }}</h3>
			<p>{{ $locale.sfc.exportDescription }}</p>
			<MkInfo warn>{{ $locale.sfc.visibility }}</MkInfo>
			<label :class="$style.ack"><input v-model="acknowledged" type="checkbox" :disabled="disabled || busy || accepted"> {{ $locale.sfc.ack }}</label>
			<MkButton :disabled="disabled || busy || !acknowledged || accepted" :wait="exporting" @click="requestExport">{{ $locale.sfc.export }}</MkButton>
			<p v-if="accepted" role="status">{{ $locale.sfc.queued }}</p>
		</template>
		<h3>{{ $locale.sfc.inspectTitle }}</h3>
		<p>{{ $locale.sfc.inspectDescription }} <MkA to="/my/drive">{{ $locale.sfc.openDrive }}</MkA></p>
		<div class="_buttons">
			<MkButton :disabled="disabled || busy" @click="pick">{{ $locale.sfc.choose }}</MkButton>
			<MkButton :disabled="disabled || busy || !selected" :wait="inspecting" @click="inspect">{{ $locale.sfc.inspect }}</MkButton>
		</div>
		<p v-if="selected" :class="$style.wrap">{{ selected.name }}</p>
		<p v-if="error" role="alert" :class="$style.error">{{ error }}</p>
		<section v-if="report" class="_gaps_s" :class="$style.result" role="status">
			<h3>{{ report.deckName }}</h3>
			<p>{{ $locale.sfc.exportedAt }}: {{ new Date(report.exportedAt).toLocaleString() }}</p>
			<p>{{ $locale.sfc.cards }}: {{ report.questions }} · {{ $locale.sfc.versions }}: {{ report.versions }} · {{ $locale.sfc.states }}: {{ report.studyStates }} · {{ $locale.sfc.reviews }}: {{ report.reviews }}</p>
			<p v-if="report.archived">{{ $locale.sfc.archived }}</p>
			<p>{{ $locale.sfc.conflicts }}: {{ report.conflicts.deck ? 1 : 0 }} / {{ report.conflicts.questions }} / {{ report.conflicts.reviews }}</p>
			<p>{{ $locale.sfc.noWrite }}</p>
		</section>
	</div>
</details>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import type { BackupInspection } from '../../shared/backup.schema.js';

const props = defineProps<{ deckId?: string; disabled?: boolean }>();
const acknowledged = ref(false);
const accepted = ref(false);
const exporting = ref(false);
const inspecting = ref(false);
const busy = computed(() => exporting.value || inspecting.value);
const selected = ref<{ id: string; name: string } | null>(null);
const report = ref<BackupInspection | null>(null);
const error = ref('');
let disposed = false;
let selection = 0;

async function requestExport() {
	if (!props.deckId || props.disabled || busy.value || !acknowledged.value || accepted.value) return;
	exporting.value = true; error.value = '';
	try {
		await misskeyApi('fukushu/backup/export', { id: props.deckId, acknowledgeDriveVisibility: true }, undefined, AbortSignal.timeout(20_000));
		if (!disposed) accepted.value = true;
	} catch {
		if (!disposed) error.value = $locale.value.sfc.exportFailed;
	} finally { if (!disposed) exporting.value = false; }
}

async function pick() {
	if (props.disabled || busy.value) return;
	const current = ++selection;
	try {
		const [file] = await chooseDriveFile({ multiple: false });
		if (file && current === selection && !disposed && !props.disabled && !busy.value) {
			selected.value = { id: file.id, name: file.name }; report.value = null; error.value = '';
		}
	} catch { if (!disposed && current === selection) error.value = $locale.value.sfc.failed; }
}

async function inspect() {
	if (!selected.value || props.disabled || busy.value) return;
	selection++; inspecting.value = true; error.value = ''; report.value = null;
	try {
		const result = await misskeyApi('fukushu/backup/inspect', { fileId: selected.value.id }, undefined, AbortSignal.timeout(20_000));
		if (!disposed) report.value = result;
	} catch (cause) {
		if (!disposed) {
			const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : null;
			error.value = code === 'UPSTREAM_BACKUP_UNSUPPORTED' ? $locale.value.sfc.upstream : code === 'BACKUP_TOO_LARGE' ? $locale.value.sfc.tooLarge : $locale.value.sfc.failed;
		}
	} finally { if (!disposed) inspecting.value = false; }
}

onBeforeUnmount(() => { disposed = true; selection++; });
</script>

<style lang="scss" module>
.panel { padding: 20px; }
.panel summary { cursor: pointer; font-weight: bold; }
.body { margin-top: 20px; }
.body h3, .body p { margin: 0; }
.ack { display: flex; gap: 8px; align-items: baseline; }
.wrap, .result { overflow-wrap: anywhere; }
.result { border-top: 1px solid var(--MI_THEME-divider); padding-top: 16px; }
.error { color: var(--MI_THEME-error); }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "バックアップ・復元前の確認",
	"scope": "9k 用の教材バックアップを扱います。初回は1教材・8 MiBまでです。本家 Fukushu の .fukushu ファイルや旧JSONは、まだ復元できません。",
	"exportTitle": "この教材をバックアップ",
	"exportDescription": "現在のカード、保存した版、復習予定と履歴をまとめて Drive に保存します。大きすぎる場合も履歴を切り捨てません。",
	"visibility": "教材と学習記録がファイルに含まれます。Drive のファイルは、URLを知っている人が取得できる場合があります。バックアップのURLは共有しないでください。",
	"ack": "Drive に保存したファイルのURLの扱いを確認しました",
	"export": "バックアップを Drive に保存",
	"queued": "書き出しを受け付けました。保存が完了するとファイルへの通知が届きます。保存結果は通知または Drive で確認してください。",
	"exportFailed": "受付結果を確認できませんでした。再実行する前に通知と Drive を確認してください。",
	"inspectTitle": "復元する前に内容を確認",
	"inspectDescription": "Drive に保存した9k用バックアップの内容と、既存データとのID重複を検査します。",
	"openDrive": "Drive を開く",
	"choose": "Drive のバックアップを選ぶ",
	"inspect": "書き込まずに検査",
	"exportedAt": "書き出し日時",
	"cards": "カード",
	"versions": "保存した版",
	"states": "復習状態",
	"reviews": "復習記録",
	"archived": "保管済みの教材です。",
	"conflicts": "現在の自分のデータと重複するID（教材 / カード / 復習記録）",
	"noWrite": "検査のみ完了しました。教材や履歴への書き込み・置換はしていません。復元の実行は今後対応します。",
	"upstream": "本家 Fukushu のバックアップです。媒体や過去のカード版の扱いを確認する必要があるため、この機能では復元しません。",
	"tooLarge": "初回対応の上限8 MiBを超えています。データの一部だけを読み込むことはありません。",
	"failed": "バックアップを検査できませんでした。ファイルの取得・形式・整合性を確認してください。教材や履歴は変更していません。"
}
</locale>

<locale locale="en-US" lang="json">
{
	"title": "Backup and restore inspection",
	"scope": "This pilot supports one 9k deck backup up to 8 MiB. Upstream .fukushu and legacy JSON backups cannot be restored yet.",
	"exportTitle": "Back up this deck",
	"exportDescription": "Save current cards, retained versions, study schedules and review history to Drive. Oversized backups fail without truncating history.",
	"visibility": "The file contains material and study history. Anyone with a Drive file URL may be able to download it. Do not share the backup URL.",
	"ack": "I understand how the Drive file URL is handled",
	"export": "Save backup to Drive",
	"queued": "Export requested. A notification links to the completed file. Check notifications or Drive for the saved file.",
	"exportFailed": "The request outcome is unknown. Check notifications and Drive before requesting another export.",
	"inspectTitle": "Inspect before restoring",
	"inspectDescription": "Inspect a 9k backup in Drive and check for IDs already present in your data.",
	"openDrive": "Open Drive",
	"choose": "Choose a backup from Drive",
	"inspect": "Inspect without writing",
	"exportedAt": "Exported",
	"cards": "Cards",
	"versions": "Retained versions",
	"states": "Study states",
	"reviews": "Reviews",
	"archived": "This deck was archived.",
	"conflicts": "IDs already in your data (decks / cards / reviews)",
	"noWrite": "Inspection complete. No materials or history were written or replaced. Applying a restore is a future step.",
	"upstream": "This is an upstream Fukushu backup. Media and historical card versions require a separate migration design; this feature does not restore it.",
	"tooLarge": "The backup exceeds this pilot's 8 MiB limit. No partial import is performed.",
	"failed": "Could not inspect the backup. Check file availability, format and integrity. Your materials and history have not changed."
}
</locale>
