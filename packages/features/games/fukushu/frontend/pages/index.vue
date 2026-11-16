<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<header><h1>{{ $locale.sfc.title }}</h1><p>{{ $locale.sfc.description }}</p></header>
			<p v-if="error" role="alert" :class="$style.error">{{ error }}</p>
			<p v-if="notice" role="status">{{ notice }}</p>
			<template v-if="!material">
				<section class="_panel _gaps" :class="$style.panel">
					<h2>{{ $locale.sfc.importTitle }}</h2>
					<p>{{ $locale.sfc.importDescription }} <MkA to="/my/drive">{{ $locale.sfc.openDrive }}</MkA></p>
					<details>
						<summary>{{ $locale.sfc.formatTitle }}</summary>
						<p>{{ $locale.sfc.formatDescription }}</p>
						<pre :class="$style.sample">{{ sample }}</pre>
						<p>{{ $locale.sfc.unsupported }}</p>
					</details>
					<MkInfo>{{ $locale.sfc.privacy }}</MkInfo>
					<div class="_buttons">
						<MkButton :disabled="busy" @click="pickFile">{{ $locale.sfc.choose }}</MkButton>
						<MkButton primary :disabled="busy || !selectedFile" :wait="importing" @click="importFile">{{ $locale.sfc.import }}</MkButton>
					</div>
					<p v-if="selectedFile" :class="$style.wrap">{{ $locale.sfc.selected }}: {{ selectedFile.name }}</p>
				</section>
				<section class="_gaps" :aria-busy="busy">
					<div :class="$style.heading"><h2>{{ $locale.sfc.library }}</h2><MkButton small :disabled="busy" @click="refresh">{{ $locale.sfc.reload }}</MkButton></div>
					<p v-if="busy && !importing" role="status">{{ $locale.sfc.loading }}</p>
					<p v-else-if="loaded && decks.length === 0" class="_panel" :class="$style.panel">{{ $locale.sfc.empty }}</p>
					<button v-for="deck in decks" :key="deck.id" type="button" class="_button _panel" :class="$style.deck" :disabled="busy" @click="showMaterial(deck.id)">
						<strong :class="$style.wrap">{{ deck.name }}</strong>
						<span>{{ deck.questionCount }} {{ $locale.sfc.cards }} <i class="ti ti-chevron-right" aria-hidden="true"></i></span>
					</button>
				</section>
			</template>
			<template v-else>
				<MkButton :disabled="busy" @click="backToList">← {{ $locale.sfc.library }}</MkButton>
				<section class="_panel _gaps" :class="$style.panel">
					<h2 :class="$style.wrap">{{ material.deck.name }}</h2>
					<p v-if="material.deck.description" :class="$style.content">{{ material.deck.description }}</p>
					<p>{{ material.deck.questionCount }} {{ $locale.sfc.cards }} · {{ $locale.sfc.private }}</p>
					<p>{{ $locale.sfc.previewOnly }}</p>
				</section>
				<ol :class="$style.questions">
					<li v-for="question in visibleQuestions" :key="question.id" class="_panel _gaps_s" :class="$style.panel">
						<span v-if="!question.enabled" :class="$style.muted">{{ $locale.sfc.disabled }}</span>
						<p :class="$style.content">{{ question.payload.prompt.value }}</p>
						<details :class="$style.answer"><summary>{{ $locale.sfc.answer }}</summary><p :class="$style.content">{{ question.payload.answer.value }}</p><p v-if="question.payload.explanation" :class="$style.content">{{ question.payload.explanation.value }}</p></details>
					</li>
				</ol>
				<div :class="$style.heading">
					<MkButton :disabled="pageIndex === 0" @click="pageIndex--">{{ $locale.sfc.previous }}</MkButton>
					<span>{{ pageIndex + 1 }} / {{ pageCount }}</span>
					<MkButton :disabled="pageIndex + 1 >= pageCount" @click="pageIndex++">{{ $locale.sfc.next }}</MkButton>
				</div>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import type { FukushuMaterial } from '../../shared/material.schema.js';

const decks = ref<Omit<FukushuMaterial['deck'], 'sourceText'>[]>([]);
const material = ref<FukushuMaterial | null>(null);
const selectedFile = ref<{ id: string; name: string } | null>(null);
const busy = ref(false);
const importing = ref(false);
const loaded = ref(false);
const error = ref('');
const notice = ref('');
const pageIndex = ref(0);
const pageCount = computed(() => Math.ceil((material.value?.questions.length ?? 0) / 20));
const visibleQuestions = computed(() => material.value?.questions.slice(pageIndex.value * 20, (pageIndex.value + 1) * 20) ?? []);
const sample = '#separator:Tab\n#html:false\n#notetype:Basic\n#deck:地理\n日本の首都は？\t東京\nフランスの首都は？\tパリ';
let disposed = false;
let selection = 0;

function message(cause: unknown) {
	const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : null;
	if (code === 'INVALID_MATERIAL') return $locale.value.sfc.invalid;
	if (code === 'MATERIAL_EXISTS') return $locale.value.sfc.duplicate;
	if (code === 'MATERIAL_LIMIT') return $locale.value.sfc.limit;
	if (code === 'NO_SUCH_FILE' || code === 'IMPORT_FAILED') return $locale.value.sfc.unavailable;
	return $locale.value.sfc.failed;
}

async function perform(action: () => Promise<void>) {
	if (busy.value || disposed) return;
	busy.value = true;
	error.value = '';
	notice.value = '';
	try { await action(); } catch (cause) { if (!disposed) error.value = message(cause); } finally { busy.value = false; importing.value = false; }
}

async function refresh() {
	await perform(async () => {
		const result = await misskeyApi('fukushu/materials/list');
		if (!disposed) { decks.value = result; loaded.value = true; }
	});
}

async function showMaterial(id: string) {
	await perform(async () => {
		const result = await misskeyApi('fukushu/materials/show', { id });
		if (!disposed) { material.value = result; pageIndex.value = 0; }
	});
}

function backToList() { material.value = null; void refresh(); }

async function pickFile() {
	if (busy.value) return;
	const current = ++selection;
	// The existing picker leaves its promise pending on cancellation. Do not lock the page while it is open.
	try {
		const [file] = await chooseDriveFile({ multiple: false });
		if (file && current === selection && !disposed && !busy.value) { selectedFile.value = { id: file.id, name: file.name }; error.value = ''; }
	} catch (cause) { if (!disposed && current === selection) error.value = message(cause); }
}

async function importFile() {
	const file = selectedFile.value;
	if (!file) return;
	await perform(async () => {
		importing.value = true;
		selection++;
		const result = await misskeyApi('fukushu/materials/import', { fileId: file.id });
		if (!disposed) { material.value = result; pageIndex.value = 0; selectedFile.value = null; notice.value = $locale.value.sfc.imported; }
	});
}

onBeforeUnmount(() => { disposed = true; selection++; });
void refresh();
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-cards' }));
</script>

<style lang="scss" module>
.panel { padding: 20px; }
.panel h2, .panel p { margin: 0; }
.heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.heading h2 { margin: 0; font-size: 1.2em; }
.deck { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px; text-align: start; }
.deck:hover { box-shadow: inset 0 0 0 1px var(--MI_THEME-accent); }
.deck span { flex-shrink: 0; color: var(--MI_THEME-fgTransparentWeak); }
.wrap, .content { overflow-wrap: anywhere; min-width: 0; }
.content { white-space: pre-wrap; }
.sample { white-space: pre-wrap; overflow-wrap: anywhere; tab-size: 4; padding: 12px; background: var(--MI_THEME-bg); border-radius: 8px; }
.questions { padding: 0; margin: 0; list-style: none; display: grid; gap: 12px; }
.answer { border-top: 1px solid var(--MI_THEME-divider); padding-top: 12px; }
.answer p { margin-top: 12px; }
.answer summary, .panel summary { cursor: pointer; }
.error { color: var(--MI_THEME-error); }
.muted { opacity: .7; font-size: .85em; }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "Fukushu · 教材",
	"description": "自分の教材を保存して、カードの表と裏を確認できます。",
	"importTitle": "Drive から教材を取り込む",
	"importDescription": "テキスト教材を先に Drive にアップロードし、ファイルを選んでください。",
	"openDrive": "Drive を開く",
	"formatTitle": "対応形式と記入例",
	"formatDescription": "UTF-8 の TSV・CSV・TXT、最大128 KiB・1,000枚。表と裏の2列で、#html:false が必要です。下の例では列の間にタブを入れます。",
	"unsupported": "Basic の通常カードのみ対応しています。HTML、画像・音声、穴埋め、逆向きカード、APKG、GIFT、バックアップは未対応です。既存教材の更新・削除はまだできません。",
	"privacy": "保存した教材は自分だけが閲覧できます。元の Drive ファイルの公開 URL や公開状態は変わりません。",
	"choose": "Drive のファイルを選ぶ",
	"import": "教材として保存",
	"selected": "選択中",
	"library": "保存した教材",
	"reload": "再読み込み",
	"loading": "読み込み中…",
	"empty": "教材はまだありません。Drive のテキストファイルから取り込めます。",
	"cards": "枚",
	"private": "自分だけに表示",
	"previewOnly": "ここで答えを開いても採点や復習予定・履歴は変わりません。",
	"disabled": "無効なカード",
	"answer": "答えを見る",
	"previous": "前へ",
	"next": "次へ",
	"invalid": "対応していない形式、重複した表、または上限を超えた教材です。「対応形式と記入例」を確認してください。",
	"duplicate": "同じ内容の教材はすでに保存されています。一覧を再読み込みしてください。",
	"limit": "保存上限の100教材に達しています。現在は既存教材の削除に対応していません。",
	"unavailable": "ファイルを取得できません。自分の Drive にある対応形式のファイルを選び直してください。",
	"failed": "操作を完了できませんでした。接続とアクセス権を確認して、もう一度お試しください。",
	"imported": "教材を保存しました。"
}
</locale>
