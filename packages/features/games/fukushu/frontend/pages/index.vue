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
			<MkButton v-if="pendingImportedId" :disabled="busy" @click="showMaterial(pendingImportedId)">{{ $locale.sfc.openImported }}</MkButton>
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
					<div class="_buttons" role="group" :aria-label="$locale.sfc.libraryFilter">
						<MkButton :disabled="busy" :primary="!archivedList" :aria-pressed="!archivedList" @click="filterList(false)">{{ $locale.sfc.activeList }}</MkButton>
						<MkButton :disabled="busy" :primary="archivedList" :aria-pressed="archivedList" @click="filterList(true)">{{ $locale.sfc.archivedList }}</MkButton>
					</div>
					<p>{{ $locale.sfc.quota }}</p>
					<p v-if="busy && !importing" role="status">{{ $locale.sfc.loading }}</p>
					<p v-else-if="loaded && decks.length === 0" class="_panel" :class="$style.panel">{{ archivedList ? $locale.sfc.emptyArchive : $locale.sfc.empty }}</p>
					<button v-for="deck in decks" :key="deck.id" type="button" class="_button _panel" :class="$style.deck" :disabled="busy" @click="showMaterial(deck.id)">
						<strong :class="$style.wrap">{{ deck.name }}</strong>
						<span>{{ deck.questionCount }} {{ $locale.sfc.cards }} <i class="ti ti-chevron-right" aria-hidden="true"></i></span>
					</button>
				</section>
			</template>
			<template v-else>
				<MkButton :disabled="busy || editing || studyLocked" @click="backToList">← {{ $locale.sfc.library }}</MkButton>
				<section class="_panel _gaps" :class="$style.panel">
					<h2 :class="$style.wrap">{{ material.deck.name }}</h2>
					<p v-if="material.deck.description" :class="$style.content">{{ material.deck.description }}</p>
					<p>{{ material.deck.questionCount }} {{ $locale.sfc.cards }} · {{ $locale.sfc.private }}</p>
					<p v-if="!studyActive">{{ $locale.sfc.previewOnly }}</p>
					<MkInfo v-if="material.archivedAt">{{ $locale.sfc.archivedInfo }}</MkInfo>
					<template v-if="editing">
						<p>{{ $locale.sfc.metadataOnly }}</p>
						<label>
							<MkInput v-model="draftName" :disabled="busy" required><template #label>{{ $locale.sfc.name }}</template></MkInput>
						</label>
						<label>
							<MkTextarea v-model="draftDescription" :disabled="busy"><template #label>{{ $locale.sfc.materialDescription }}</template></MkTextarea>
						</label>
						<p v-if="!validDraft" :class="$style.error">{{ $locale.sfc.metadataBounds }}</p>
						<div class="_buttons">
							<MkButton primary :disabled="busy || !validDraft || reloadRequired" @click="saveMetadata">{{ $locale.sfc.save }}</MkButton>
							<MkButton :disabled="busy" @click="cancelEdit">{{ $locale.sfc.cancel }}</MkButton>
						</div>
					</template>
					<div v-else class="_buttons">
						<MkButton :disabled="busy || reloadRequired || studyActive || studyLocked" @click="editMetadata">{{ $locale.sfc.edit }}</MkButton>
						<MkButton :disabled="busy || reloadRequired || studyActive || studyLocked" @click="changeArchive">{{ material.archivedAt ? $locale.sfc.restore : $locale.sfc.archive }}</MkButton>
					</div>
					<p v-if="reloadRequired">{{ $locale.sfc.reloadNeeded }}</p>
					<MkButton :disabled="busy || studyActive || studyLocked" @click="reloadMaterial">{{ $locale.sfc.reloadMaterial }}</MkButton>
				</section>
				<StudyPanel :key="material.deck.id" :deckId="material.deck.id" :archived="material.archivedAt !== null" :disabled="busy || editing" @active="studyActive = $event" @locked="studyLocked = $event"/>
				<ol v-if="!studyActive" :class="$style.questions">
					<li v-for="question in visibleQuestions" :key="question.id" class="_panel _gaps_s" :class="$style.panel">
						<span v-if="!question.enabled" :class="$style.muted">{{ $locale.sfc.disabled }}</span>
						<p :class="$style.content">{{ question.payload.prompt.value }}</p>
						<details :class="$style.answer"><summary>{{ $locale.sfc.answer }}</summary><p :class="$style.content">{{ question.payload.answer.value }}</p><p v-if="question.payload.explanation" :class="$style.content">{{ question.payload.explanation.value }}</p></details>
					</li>
				</ol>
				<div v-if="!studyActive" :class="$style.heading">
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
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import * as os from '@features/ui/frontend/os.js';
import StudyPanel from '../components/StudyPanel.vue';
import type { FukushuMaterial } from '../../shared/material.schema.js';

const decks = ref<Omit<FukushuMaterial['deck'], 'sourceText'>[]>([]);
type ManagedMaterial = FukushuMaterial & { revision: number; archivedAt: string | null };
const material = ref<ManagedMaterial | null>(null);
const archivedList = ref(false);
const editing = ref(false);
const studyActive = ref(false);
const studyLocked = ref(false);
const draftName = ref('');
const draftDescription = ref('');
const reloadRequired = ref(false);
const pendingImportedId = ref<string | null>(null);
const validDraft = computed(() => draftName.value.trim().length > 0 && draftName.value.length <= 256 && draftDescription.value.length <= 4096);
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
	if (code === 'MATERIAL_CONFLICT') return $locale.value.sfc.conflict;
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
		const result = await misskeyApi('fukushu/materials/list', { archived: archivedList.value });
		if (!disposed) { decks.value = result; loaded.value = true; }
	});
}

async function showMaterial(id: string) {
	await perform(async () => {
		const result = await misskeyApi('fukushu/materials/show', { id });
		if (!disposed) { material.value = result; pageIndex.value = 0; editing.value = false; reloadRequired.value = false; pendingImportedId.value = null; }
	});
}

function backToList() { if (busy.value || editing.value || studyLocked.value) return; material.value = null; void refresh(); }

function filterList(archived: boolean) {
	if (busy.value) return;
	archivedList.value = archived;
	decks.value = [];
	loaded.value = false;
	void refresh();
}

function editMetadata() {
	if (!material.value || busy.value || reloadRequired.value || studyActive.value || studyLocked.value) return;
	draftName.value = material.value.deck.name;
	draftDescription.value = material.value.deck.description ?? '';
	editing.value = true;
}

function cancelEdit() { if (!busy.value) editing.value = false; }

async function reloadMaterial() {
	if (studyActive.value || studyLocked.value) return;
	const current = material.value;
	if (!current) return;
	await perform(async () => {
		const result = await misskeyApi('fukushu/materials/show', { id: current.deck.id });
		if (!disposed) {
			material.value = result;
			reloadRequired.value = false;
			notice.value = editing.value ? $locale.value.sfc.reloadedDraft : $locale.value.sfc.reloaded;
		}
	});
}

async function saveMetadata() {
	const current = material.value;
	if (!current || !editing.value || !validDraft.value || reloadRequired.value) return;
	await perform(async () => {
		try {
			const name = draftName.value;
			const description = draftDescription.value;
			const result = await misskeyApi('fukushu/materials/update', { id: current.deck.id, expectedRevision: current.revision, name, description });
			if (!disposed) {
				material.value = { ...current, ...result, deck: { ...current.deck, name, description } };
				editing.value = false;
				notice.value = $locale.value.sfc.saved;
			}
		} catch (cause) {
			reloadRequired.value = true;
			throw cause;
		}
	});
}

async function changeArchive() {
	const current = material.value;
	if (!current || editing.value || reloadRequired.value || studyActive.value || studyLocked.value) return;
	await perform(async () => {
		const archived = current.archivedAt === null;
		const { canceled } = await os.confirm({ type: 'question', title: archived ? $locale.value.sfc.archive : $locale.value.sfc.restore, text: archived ? $locale.value.sfc.archiveConfirm : $locale.value.sfc.restoreConfirm });
		if (canceled || disposed) return;
		try {
			const result = await misskeyApi('fukushu/materials/archive', { id: current.deck.id, expectedRevision: current.revision, archived });
			if (!disposed) {
				material.value = { ...current, ...result };
				notice.value = archived ? $locale.value.sfc.archived : $locale.value.sfc.restored;
			}
		} catch (cause) {
			reloadRequired.value = true;
			throw cause;
		}
	});
}

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
		if (disposed) return;
		selectedFile.value = null;
		pendingImportedId.value = result.deck.id;
		notice.value = $locale.value.sfc.importedPending;
		const managed = await misskeyApi('fukushu/materials/show', { id: result.deck.id });
		if (!disposed) { material.value = managed; pageIndex.value = 0; pendingImportedId.value = null; reloadRequired.value = false; notice.value = $locale.value.sfc.imported; }
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
	"unsupported": "Basic の通常カードのみ対応しています。HTML、画像・音声、穴埋め、逆向きカード、APKG、GIFT、バックアップは未対応です。カード内容の更新・完全削除は未対応です。",
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
	"previewOnly": "カードのプレビューで答えを開いても、採点や復習予定・履歴は変わりません。",
	"disabled": "無効なカード",
	"answer": "答えを見る",
	"previous": "前へ",
	"next": "次へ",
	"invalid": "対応していない形式、重複した表、または上限を超えた教材です。「対応形式と記入例」を確認してください。",
	"duplicate": "同じ内容の教材はすでに保存されています。通常・保管済みの一覧を確認してください。",
	"limit": "保存上限の100教材に達しています。保管済みも含みます。完全削除には対応していません。",
	"unavailable": "ファイルを取得できません。自分の Drive にある対応形式のファイルを選び直してください。",
	"failed": "操作を完了できませんでした。接続とアクセス権を確認して、もう一度お試しください。",
	"imported": "教材を保存しました。",
	"libraryFilter": "教材の表示",
	"activeList": "通常の教材",
	"archivedList": "保管済み",
	"emptyArchive": "保管済みの教材はありません。",
	"quota": "保存上限は保管済みを含めて100教材です。保管しても空き枠は増えません。",
	"archivedInfo": "この教材は保管済みです。カードと元データは残っています。",
	"metadataOnly": "名前と説明だけを編集します。カードの内容・ID・元データや復習履歴は変更しません。",
	"name": "教材名",
	"materialDescription": "説明",
	"metadataBounds": "教材名は空白だけにせず256文字以内、説明は4,096文字以内にしてください。",
	"save": "変更を保存",
	"cancel": "キャンセル",
	"edit": "名前・説明を編集",
	"archive": "教材を保管",
	"restore": "教材を復元",
	"reloadMaterial": "教材の最新状態を読み込む",
	"conflict": "別の操作で教材が変更されました。入力内容は残しています。最新状態を読み込んで確認してから保存してください。",
	"reloadedDraft": "最新状態を表示しました。入力内容は残しています。表示中の教材名・説明と比較してから保存してください。",
	"reloaded": "最新状態を表示しました。",
	"saved": "名前と説明を保存しました。",
	"archiveConfirm": "通常の一覧から隠します。カード・元データ・復習履歴は削除しません。保管済みの一覧から復元でき、100教材の上限には引き続き含まれます。",
	"restoreConfirm": "通常の一覧に戻します。カード・元データ・復習履歴は変更しません。",
	"archived": "教材を保管しました。",
	"restored": "教材を復元しました。",
	"importedPending": "教材は保存済みです。表示に失敗した場合は「保存した教材を開く」で再試行してください。",
	"openImported": "保存した教材を開く",
	"reloadNeeded": "操作の結果を確認するため、教材の最新状態を読み込んでください。入力内容は残しています。"
}
</locale>

<locale locale="en-US" lang="json">
{
	"title": "Fukushu · Materials",
	"description": "Save your own materials and preview both sides of each card.",
	"importTitle": "Import a material from Drive",
	"importDescription": "Upload a text material to Drive first, then choose its file.",
	"openDrive": "Open Drive",
	"formatTitle": "Supported format and example",
	"formatDescription": "UTF-8 TSV, CSV or TXT, up to 128 KiB and 1,000 cards. Use two columns for the front and back, with #html:false. The example separates columns with tabs.",
	"unsupported": "Only ordinary Basic cards are supported. HTML, images, audio, cloze, reversed cards, APKG, GIFT and backups are not supported. Card content updates and permanent deletion are not available.",
	"privacy": "Saved materials are visible only to you. The original Drive file’s public URL and visibility remain unchanged.",
	"choose": "Choose a Drive file",
	"import": "Save as a material",
	"selected": "Selected",
	"library": "Saved materials",
	"reload": "Reload",
	"loading": "Loading…",
	"empty": "No materials yet. Import a text file from Drive.",
	"cards": "cards",
	"private": "Visible only to you",
	"previewOnly": "Revealing answers in the card preview does not change grades, review schedules or history.",
	"disabled": "Disabled card",
	"answer": "Show answer",
	"previous": "Previous",
	"next": "Next",
	"invalid": "The material has an unsupported format, duplicate fronts or exceeds a limit. Check the supported format and example.",
	"duplicate": "A material with the same content is already saved. Check both the active and archived lists.",
	"limit": "The limit of 100 materials has been reached, including archived materials. Permanent deletion is not available.",
	"unavailable": "The file could not be retrieved. Choose a supported file from your own Drive.",
	"failed": "The operation could not be completed. Check your connection and access permissions.",
	"imported": "Material saved.",
	"libraryFilter": "Material list",
	"activeList": "Active materials",
	"archivedList": "Archived materials",
	"emptyArchive": "No archived materials.",
	"quota": "The 100-material limit includes archived materials. Archiving does not free a slot.",
	"archivedInfo": "This material is archived. Its cards and source data are retained.",
	"metadataOnly": "Edit only the name and description. Card content, IDs, source data and review history are unchanged.",
	"name": "Material name",
	"materialDescription": "Description",
	"metadataBounds": "Enter a nonblank name of up to 256 characters and a description of up to 4,096 characters.",
	"save": "Save changes",
	"cancel": "Cancel",
	"edit": "Edit name and description",
	"archive": "Archive material",
	"restore": "Restore material",
	"reloadMaterial": "Load the latest material",
	"conflict": "Another operation changed this material. Your draft is retained. Load and review the latest material before saving.",
	"reloadedDraft": "The latest material is shown. Your draft is retained. Compare it with the displayed name and description before saving.",
	"reloaded": "The latest material is shown.",
	"saved": "Name and description saved.",
	"archiveConfirm": "Hide this material from the active list. Cards, source data and review history are not deleted. You can restore it from the archived list, and it still counts toward the 100-material limit.",
	"restoreConfirm": "Return this material to the active list. Cards, source data and review history are unchanged.",
	"archived": "Material archived.",
	"restored": "Material restored.",
	"importedPending": "The material has been saved. If loading fails, use “Open saved material” to retry.",
	"openImported": "Open saved material",
	"reloadNeeded": "Load the latest material to check the result of the operation. Your draft is retained."
}
</locale>
