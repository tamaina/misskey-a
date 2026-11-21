<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<section class="_panel _gaps" :class="$style.panel" :aria-busy="busy">
	<h2>{{ today ? (deck?.name ?? (practiceAhead ? $locale.sfc.cramAll : $locale.sfc.today)) : $locale.sfc.title }}</h2>
	<p v-if="unavailable" role="status">{{ $locale.sfc.noStorage }}</p>
	<TodayStudy v-if="today && plan" :queue="today" :practiceAhead="practiceAhead" :offset="offset" :total="plan.cards.length" @prepared="journal.prepare" @saved="confirmed" @rejected="journal.state('stale')" @close="pause"/>
	<StudySummary v-else-if="plan && progress" :progress="progress" :total="plan.cards.length" :busy="busy" :title="summaryTitle" :back="deck ? $locale.sfc.backToDeck : $locale.sfc.backToDecks" @resume="run(resume)" @leave="leave"/>
	<template v-else>
		<div v-if="!deck" class="_buttons">
			<MkButton :disabled="busy" primary @click="run(() => startToday(false))">{{ $locale.sfc.today }}</MkButton>
			<MkButton :disabled="busy" @click="run(load)">{{ $locale.sfc.open }}</MkButton>
			<MkButton v-if="pendingGift" :disabled="busy" @click="run(applyGift)">{{ $locale.sfc.retryGift }}</MkButton>
			<MkButton v-else :disabled="busy" @click="createGift">{{ $locale.sfc.createGift }}</MkButton>
			<MkButton v-if="pendingImport" :disabled="busy" @click="run(() => checkImport(true))">{{ $locale.sfc.checkImport }}</MkButton>
			<template v-else>
				<MkButton :disabled="busy" @click="restore">{{ $locale.sfc.restore }}</MkButton>
				<MkButton :disabled="busy" @click="importApkg">{{ $locale.sfc.importApkg }}</MkButton>
			</template>
			<MkButton :disabled="busy" @click="run(() => startToday(true))">{{ $locale.sfc.cramAll }}</MkButton>
			<MkButton v-if="records" :disabled="busy" @click="exportBackup">{{ $locale.sfc.export }}</MkButton>
		</div>
		<LearningSettings v-if="!deck" @saved="applySettings"/>
		<p v-if="loaded && !records?.decks.length">{{ $locale.sfc.empty }}</p>
		<button v-for="d in !deck ? records?.decks : []" :key="d.id" type="button" class="_button" :class="$style.row" :disabled="busy" @click="run(() => selectDeck(d.id))">
			<strong>{{ d.name }}</strong><span>{{ d.enabledQuestionCount }} {{ $locale.sfc.cards }} ›</span>
		</button>
		<template v-if="deck && records">
			<div class="_buttons"><MkButton small :disabled="busy" @click="run(() => selectDeck(null))">← {{ $locale.sfc.decks }}</MkButton></div>
			<h3>{{ deck.name }}</h3><p v-if="deck.description">{{ deck.description }}</p>
			<div class="_buttons">
				<MkButton primary :disabled="busy" @click="run(() => start(false))">{{ $locale.sfc.study }}</MkButton>
				<MkButton :disabled="busy" @click="run(() => start(true))">{{ $locale.sfc.cram }}</MkButton>
				<MkButton v-if="deck.sourceType === 'gift'" :disabled="busy" @click="updateGift">{{ $locale.sfc.update }}</MkButton>
			</div>
			<details v-if="reviewHistory.length">
				<summary>{{ $locale.sfc.history }} ({{ historyTotal }})</summary>
				<ul :class="$style.logs">
					<li v-for="log in reviewHistory" :key="log.id">
						<time :datetime="log.reviewedAt">{{ new Date(log.reviewedAt).toLocaleString() }}</time> · {{ $locale.sfc[log.rating] }} · {{ log.correct ? $locale.sfc.correct : $locale.sfc.incorrect }}
						<details>
							<summary>{{ cardNames.get(log.questionId) || log.questionId }}</summary>
							<p>{{ $locale.sfc.cardId }} {{ log.questionId }}</p>
							<p v-if="log.responseText">{{ $locale.sfc.response }} {{ log.responseText }}</p>
						</details>
					</li>
				</ul>
				<div class="_buttons">
					<MkButton v-if="historyStack.length > 1" small :disabled="busy" @click="run(() => turnHistory(false))">{{ $locale.sfc.previous }}</MkButton>
					<MkButton v-if="nextHistory" small :disabled="busy" @click="run(() => turnHistory(true))">{{ $locale.sfc.next }}</MkButton>
				</div>
			</details>
			<h4>{{ $locale.sfc.cards }}</h4>
			<div v-for="c in cards.slice(page * 10, (page + 1) * 10)" :key="c.id" :class="$style.card">
				<span v-if="!c.enabled">{{ $locale.sfc.disabled }}</span>
				<SourceContent :anki="c.payload.kind === 'flashcard' ? c.payload : undefined" :content="c.payload.prompt"/>
				<details @toggle="toggleAnswer(c.id, $event)">
					<summary>{{ $locale.sfc.answer }}</summary>
					<template v-if="expanded.has(c.id)">
						<SourceContent v-for="(a, i) in solution(c.payload, $locale.sfc.yes, $locale.sfc.no)" :key="i" :anki="c.payload.kind === 'flashcard' ? c.payload : undefined" :content="a"/>
						<SourceContent v-if="c.payload.explanation" :content="c.payload.explanation"/>
					</template>
				</details>
			</div>
			<div v-if="cards.length > 10" class="_buttons">
				<MkButton small :disabled="page === 0" @click="page--">{{ $locale.sfc.previous }}</MkButton>
				<span>{{ page + 1 }} / {{ Math.ceil(cards.length / 10) }}</span>
				<MkButton small :disabled="(page + 1) * 10 >= cards.length" @click="page++">{{ $locale.sfc.next }}</MkButton>
			</div>
		</template>
		<p v-if="notice" role="status">{{ notice }}</p>
	</template>
	<p v-if="error" role="alert">{{ error }}</p>
</section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { $i } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { chooseDriveFile } from '@features/drive/frontend/utility/drive.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { queue, solution, studyDay } from '../source-study.js';
import SourceContent from './SourceContent.vue';
import StudySummary from './StudySummary.vue';
import { rejectedReview, remainingEntries, sendSessionAnswer, sessionCard, useTabSession } from '../tab-session.js';
import type { SessionAnswer } from '../tab-session.js';
import LearningSettings from './LearningSettings.vue';
import TodayStudy from './TodayStudy.vue';
import type { TodayQueue } from '../../shared/today.schema.js';
import type { LearningSettings as LearningPreferences, UpstreamRecords } from '../../shared/upstream-records.schema.js';

const props = defineProps<{ ownerId?: string }>();
const emit = defineEmits<{ active: [value: boolean]; ankiImported: [] }>();
const records = shallowRef<UpstreamRecords>();
const revisions = shallowRef(new Map<string, number>());
const selected = ref<string | null>(null);
const deck = computed(() => records.value?.decks.find(d => d.id === selected.value));
const practiceAhead = ref(false);
const cards = computed(() => records.value?.questions.filter(q => q.deckId === selected.value).sort((a, b) => (a.sourceOrder ?? Infinity) - (b.sourceOrder ?? Infinity)) ?? []);
const cardNames = computed(() => new Map(cards.value.map(q => [q.id, q.payload.name ?? (q.payload.prompt.format === 'plain' ? q.payload.prompt.value : q.sourceKey)])));
const reviewHistory = computed(() => records.value?.reviewLogs ?? []);
type Cursor = { time: string; key: string };
const historyStack = shallowRef<(Cursor | undefined)[]>([undefined]);
const nextHistory = shallowRef<Cursor | null>(null);
const historyTotal = ref(0);
let reviewedToday = new Set<string>();
let loadedDay = '';
const page = ref(0);
const expanded = ref(new Set<string>());
const today = shallowRef<TodayQueue>();
const journal = useTabSession(props.ownerId);
const { plan, progress, unavailable } = journal;
const offset = ref(0);
const summaryTitle = computed(() => {
	if (progress.value?.answered !== plan.value?.cards.length) return $locale.value.sfc.paused;
	return plan.value?.scope === 'today' && !plan.value.practice ? $locale.value.sfc.dailyFinished : $locale.value.sfc.finished;
});
if (plan.value) emit('active', true);
const loaded = ref(false);
const busy = ref(false);
const notice = ref('');
const error = ref('');
let picker = 0;
onBeforeUnmount(() => { picker++; });
const retryRestore = new Map<string, string>();

type PendingImport = { fileId: string; requestId: string; format?: 'anki-apkg' };
const trackingKey = 'fukushu:import:' + $i?.id;
const pendingImport = shallowRef<PendingImport>();
try {
	const saved = JSON.parse(sessionStorage.getItem(trackingKey) ?? 'null');
	if (typeof saved?.fileId === 'string' && typeof saved.requestId === 'string' && (saved.format === undefined || saved.format === 'anki-apkg')) {
		pendingImport.value = { fileId: saved.fileId, requestId: saved.requestId, ...(saved.format ? { format: saved.format } : {}) };
	}
} catch { /* Tracking still works in memory when session storage is unavailable. */ }

function trackImport(job?: PendingImport) {
	pendingImport.value = job;
	try {
		if (job) sessionStorage.setItem(trackingKey, JSON.stringify(job));
		else sessionStorage.removeItem(trackingKey);
	} catch { /* Optional same-tab resume. */ }
}

async function checkImport(statusOnly: boolean) {
	const job = pendingImport.value;
	if (!job) return;
	const result = await misskeyApi('fukushu/upstream/restore-job', { ...job, confirmRestore: true, statusOnly });
	if (result.status === 'completed') {
		trackImport();
		retryRestore.delete(job.fileId);
		if (job.format === 'anki-apkg') emit('ankiImported');
		else await load();
		notice.value = $locale.value.sfc.restored;
	} else if (result.status === 'failed' || result.status === 'missing') {
		trackImport();
		retryRestore.delete(job.fileId);
		if (job.format !== 'anki-apkg') error.value = $locale.value.sfc.importFailed;
		else if (result.reason === 'unsupported') error.value = $locale.value.sfc.apkgUnsupported;
		else if (result.reason === 'invalid') error.value = $locale.value.sfc.invalidFile;
		else error.value = $locale.value.sfc.apkgFailed;
	} else {
		notice.value = $locale.value.sfc.importQueued;
	}
}

function code(cause: unknown) { return typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : null; }

async function run(action: () => Promise<void>) {
	if (busy.value) return;
	picker++; busy.value = true; notice.value = ''; error.value = '';
	try { await action(); } catch (cause) {
		const c = code(cause);
		error.value = c === 'INVALID_BACKUP' ? $locale.value.sfc.invalidFile : c === 'STUDY_CONFLICT' || c === 'BACKUP_CONFLICT' ? $locale.value.sfc.conflict : c === 'BACKUP_TOO_LARGE' || c === 'UPSTREAM_INSPECTION_LIMIT' ? $locale.value.sfc.limit : $locale.value.sfc.error;
	} finally { busy.value = false; }
}

function applySettings(settings: LearningPreferences) {
	if (records.value) records.value = { ...records.value, settings: [{ ...records.value.settings[0], ...settings }] };
}

async function load(id: string | null = selected.value, stack: (Cursor | undefined)[] = [undefined]) {
	try {
		const day = studyDay(new Date());
		const result = await misskeyApi('fukushu/upstream/show', { page: id === null ? {} : { deckId: id, day, after: stack.at(-1) } });
		historyStack.value = stack;
		nextHistory.value = result.historyPage?.next ?? null;
		historyTotal.value = result.historyPage?.total ?? 0;
		reviewedToday = new Set(result.historyPage?.today);
		loadedDay = day.start;
		records.value = result.records;
		revisions.value = new Map(result.revisions.map(r => [r.questionId, r.revision]));
	} catch (cause) {
		if (code(cause) !== 'NO_SUCH_MATERIAL') throw cause;
		records.value = undefined;
	}
	loaded.value = true;
}

async function turnHistory(next: boolean) {
	const stack = historyStack.value;
	if (next && nextHistory.value) await load(selected.value, [...stack, nextHistory.value]);
	else if (!next && stack.length > 1) await load(selected.value, stack.slice(0, -1));
}

async function selectDeck(id: string | null) {
	await load(id);
	picker++; selected.value = id; emit('active', id !== null); expanded.value.clear(); page.value = 0; notice.value = ''; error.value = '';
}

function toggleAnswer(id: string, event: Event) {
	if ((event.target as HTMLDetailsElement).open) expanded.value.add(id); else expanded.value.delete(id);
}

function deckQueue(cram: boolean): TodayQueue {
	if (!records.value || !deck.value) return { items: [], shuffle: false, immediate: true };
	const selectedDeck = deck.value;
	const settings = records.value.settings[0];
	return {
		shuffle: settings.shuffleChoices, immediate: settings.showImmediateFeedback,
		items: queue(records.value, selectedDeck.id, new Date(), cram, reviewedToday).map(question => ({
			origin: 'source', question, deckName: selectedDeck.name, flash: selectedDeck.studyMode === 'flashcard', revision: revisions.value.get(question.id)!,
		})),
	};
}

function begin(result: TodayQueue, practice: boolean, id: string | null) {
	if (!result.items.length) { notice.value = $locale.value.sfc.noneDue; return; }
	journal.begin(id === null ? 'today' : 'source', id, practice, result.items.map(sessionCard));
	offset.value = 0;
	practiceAhead.value = practice;
	today.value = result;
	emit('active', true);
}

async function start(cram: boolean) {
	if (studyDay(new Date()).start !== loadedDay) await load();
	if (deck.value) begin(deckQueue(cram), cram, deck.value.id);
}

function fetchToday(practice: boolean) {
	return misskeyApi('fukushu/study/today', { ...studyDay(new Date()), ...(practice ? { practiceAhead: true } : {}) });
}

async function startToday(practice: boolean) {
	begin(await fetchToday(practice), practice, null);
}

function confirmed(answer: SessionAnswer) {
	journal.confirm(answer);
	if (progress.value?.answered === plan.value?.cards.length) today.value = undefined;
}

function pause() {
	if (!progress.value?.answered && !progress.value?.pending && progress.value?.state !== 'stale') { leave(); return; }
	today.value = undefined;
	if (progress.value?.state !== 'stale') journal.state('paused');
}

async function resume() {
	const saved = plan.value;
	if (!saved || !progress.value || saved.owner !== (props.ownerId ?? '') || progress.value.state === 'stale') return;
	const pending = progress.value.pending;
	if (pending) {
		try {
			await sendSessionAnswer(saved.cards[progress.value.answered], pending, saved.practice);
			journal.confirm(pending);
		} catch (cause) {
			if (rejectedReview(cause)) { journal.state('stale'); return; }
			throw cause;
		}
	}
	if (progress.value.answered === saved.cards.length) return;
	let current: TodayQueue;
	try {
		if (saved.scope === 'source' && saved.deck !== null) {
			await selectDeck(saved.deck);
			current = deckQueue(true);
		} else if (saved.scope === 'native' && saved.deck !== null) {
			const q = await misskeyApi('fukushu/study/queue', { id: saved.deck });
			current = { shuffle: false, immediate: true, items: q.items.map(item => ({
				origin: 'native', questionId: item.question.id, deckId: q.deckId, deckName: $locale.value.sfc.nativeDeck,
				version: item.questionVersion, revision: item.stateRevision,
			})) };
		} else {
			current = await fetchToday(saved.practice);
		}
	} catch (cause) {
		if (rejectedReview(cause)) { journal.state('stale'); return; }
		throw cause;
	}
	const remaining = saved.cards.slice(progress.value.answered);
	let items = remainingEntries(remaining, current.items);
	// A newly reduced cap or new due cards can displace an unchanged card.
	// Recover only the original IDs, in order, keeping the original submission mode.
	if (!items && saved.scope !== 'source' && !saved.practice) {
		items = remainingEntries(remaining, (await fetchToday(true)).items);
	}
	if (!items) { journal.state('stale'); return; }
	offset.value = progress.value.answered;
	journal.state('active');
	practiceAhead.value = saved.practice;
	today.value = { ...current, items };
	emit('active', true);
}

function leave() {
	journal.discard();
	today.value = undefined;
	if (!deck.value) selected.value = null;
	emit('active', selected.value !== null);
	if (loaded.value) void run(load);
}

async function pickOwnedFile() {
	if (busy.value) return;
	const ticket = ++picker;
	try {
		const [file] = await chooseDriveFile({ multiple: false });
		if (ticket === picker && !busy.value) return file;
	} catch { if (ticket === picker) error.value = $locale.value.sfc.error; }

	return undefined;
}

async function restore() {
	const file = await pickOwnedFile();
	if (!file) return;
	await run(async () => {
		if ((await os.confirm({ type: 'question', title: $locale.value.sfc.restore, text: file.name + '\n' + $locale.value.sfc.restoreConfirm })).canceled) return;
		const id = retryRestore.get(file.id) ?? crypto.randomUUID();
		retryRestore.set(file.id, id);
		if (file.size > 8 * 1024 * 1024) {
			trackImport({ fileId: file.id, requestId: id });
			await checkImport(false);
			return;
		}
		await misskeyApi('fukushu/upstream/restore', { fileId: file.id, requestId: id, confirmRestore: true });
		retryRestore.delete(file.id);
		await load(); notice.value = $locale.value.sfc.restored;
	});
}

async function importApkg() {
	const file = await pickOwnedFile();
	if (!file) return;
	await run(async () => {
		if (!/\.apkg$/i.test(file.name)) {
			error.value = $locale.value.sfc.invalidFile;
			return;
		}
		const ticket = picker;
		const confirmation = await os.confirm({
			type: 'question',
			title: $locale.value.sfc.importApkg,
			text: file.name + '\n' + $locale.value.sfc.apkgConfirm,
		});
		if (confirmation.canceled || ticket !== picker) return;
		trackImport({ fileId: file.id, requestId: crypto.randomUUID(), format: 'anki-apkg' });
		try {
			await checkImport(false);
		} catch (cause) {
			const c = code(cause);
			if (c !== 'BACKUP_TOO_LARGE' && c !== 'INVALID_BACKUP' && c !== 'NO_SUCH_FILE') throw cause;
			trackImport();
			error.value = c === 'BACKUP_TOO_LARGE' ? $locale.value.sfc.apkgLimit : $locale.value.sfc.invalidFile;
		}
	});
}

async function exportBackup() {
	await run(async () => {
		if ((await os.confirm({ type: 'warning', title: $locale.value.sfc.export, text: $locale.value.sfc.visibility })).canceled) return;
		await misskeyApi('fukushu/upstream/export', { acknowledgeDriveVisibility: true });
		notice.value = $locale.value.sfc.exported;
	});
}

type GiftConfirmation = { fileId: string; requestId: string; name: string; confirmToken: string };
const giftKey = 'fukushu:create-gift:' + $i?.id;
const pendingGift = shallowRef<GiftConfirmation>();
try {
	const saved = JSON.parse(sessionStorage.getItem(giftKey) ?? 'null');
	if (saved && ['fileId', 'requestId', 'name', 'confirmToken'].every(key => typeof saved[key] === 'string')) pendingGift.value = saved;
} catch { /* In-memory retry is available when session storage is unavailable. */ }

function trackGift(input?: GiftConfirmation) {
	pendingGift.value = input;
	try {
		if (input) sessionStorage.setItem(giftKey, JSON.stringify(input));
		else sessionStorage.removeItem(giftKey);
	} catch { /* Optional same-tab resume. */ }
}

async function applyGift() {
	const input = pendingGift.value;
	if (!input) return;
	try {
		await misskeyApi('fukushu/upstream/create-gift', input);
	} catch (cause) {
		if (['STUDY_CONFLICT', 'BACKUP_CONFLICT', 'INVALID_BACKUP', 'BACKUP_FAILED', 'BACKUP_TOO_LARGE', 'UPSTREAM_INSPECTION_LIMIT', 'NO_SUCH_FILE'].includes(String(code(cause)))) trackGift();
		throw cause;
	}
	await selectDeck(input.requestId);
	trackGift();
}

async function createGift() {
	const file = await pickOwnedFile();
	if (!file) return;
	await run(async () => {
		const answer = await os.inputText({ title: $locale.value.sfc.deckName, default: file.name.replace(/\.(gift|txt)$/i, ''), maxLength: 256 });
		if (answer.canceled) return;
		const input = { fileId: file.id, name: answer.result.trim() || $locale.value.sfc.untitled, requestId: crypto.randomUUID() };
		const preview = await misskeyApi('fukushu/upstream/create-gift', input);
		const text = input.name + '\n' + file.name + '\n' + $locale.value.sfc.added + ' ' + preview.added;
		if ((await os.confirm({ type: 'question', title: $locale.value.sfc.createGift, text })).canceled) return;
		trackGift({ ...input, confirmToken: preview.token });
		await applyGift();
	});
}

async function updateGift() {
	const deckId = deck.value?.id;
	if (deckId === undefined) return;
	const file = await pickOwnedFile();
	if (!file || deck.value?.id !== deckId) return;
	await run(async () => {
		const input = { deckId, fileId: file.id };
		const preview = await misskeyApi('fukushu/upstream/update-gift', input);
		const text = [file.name, $locale.value.sfc.added + ' ' + preview.added, $locale.value.sfc.changed + ' ' + preview.changed, $locale.value.sfc.removed + ' ' + preview.disabled, $locale.value.sfc.reset + ' ' + preview.reset].join('\n');
		if ((await os.confirm({ type: 'warning', title: $locale.value.sfc.update, text })).canceled) return;
		await misskeyApi('fukushu/upstream/update-gift', { ...input, confirmToken: preview.token });
		await load(); notice.value = $locale.value.sfc.updated;
	});
}
</script>
<style module>
.panel { padding: 20px; overflow-wrap: anywhere; }
.panel :is(h2, h3, h4, p) { margin: 0; }
.panel summary { cursor: pointer; }
.logs { display: grid; gap: 8px; padding-inline-start: 20px; }
.row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; text-align: start; }
.card { border-top: 1px solid var(--MI_THEME-divider); padding-top: 12px; }
</style>
<locale locale="ja-JP" lang="json">
{
	"noStorage": "このタブに再開情報を保存できません。再読み込みすると今回の進捗表示が消えます。",
	"finished": "この回の復習は終了です。",
	"dailyFinished": "今日の学習を終了しました。",
	"paused": "このタブの学習",
	"nativeDeck": "直接作成教材",
	"backToDeck": "教材に戻る",
	"backToDecks": "教材一覧に戻る",
	"title": "Fukushu からの教材",
	"today": "今日の学習",
	"createGift": "Drive の GIFT から教材を作成",
	"retryGift": "確認済みの教材作成を再試行",
	"deckName": "新しい教材の名前",
	"untitled": "名称未設定の問題集",
	"invalidFile": "ファイルを読み取れません。形式と内容を確認してください。",
	"yes": "正しい",
	"no": "誤り",
	"open": "取込済み教材を開く",
	"restore": "Drive の .fukushu を取り込む",
	"importApkg": "Drive の Anki デッキ (.apkg) を取り込む",
	"apkgConfirm": "1デッキ（最大1,000枚）を新しい教材として保存します。静的なカードテンプレートに対応します（装飾の一部のみ）。試験対応のメディアは、デッキにつき静止 PNG と PCM 16-bit WAV 各1点（各256 KiB以下）です。その他のメディア、復習履歴、文字入力解答、スクリプト、外部参照のあるファイルは取り込めません。復習予定は引き継がれません。Drive のファイルサイズ上限とサーバーのアップロード設定が適用されます。",
	"apkgLimit": "Anki のファイルは 256 MiB まで取り込めます。",
	"apkgFailed": "Anki の取り込みが完了しませんでした。原本と接続を確認して、再度お試しください。",
	"apkgUnsupported": "未対応の Anki デッキです。1デッキに絞り、復習履歴・スクリプト・外部参照がないか確認してください。メディアは静止 PNG と PCM 16-bit WAV 各1点（各256 KiB以下）のみ対応しています。",
	"export": "本家形式で Drive に書き出す",
	"empty": "取込済みの教材はありません。",
	"cards": "カード",
	"decks": "教材一覧",
	"study": "予定のカードを復習",
	"cram": "予定外も含めて復習",
	"cramAll": "全教材を予定外も含めて復習",
	"update": "Drive の GIFT で教材を更新",
	"added": "追加",
	"changed": "変更",
	"removed": "無効化",
	"reset": "復習予定のリセット",
	"history": "復習履歴",
	"more": "さらに表示",
	"disabled": "無効",
	"answer": "答え・解説",
	"previous": "前のページ",
	"next": "次のページ",
	"noneDue": "対象のカードはありません。",
	"error": "操作を完了できませんでした。ファイルと接続を確認してください。",
	"conflict": "既存データと重複するか、確認後に変更されました。教材を開き直してください。",
	"limit": "取込上限を超えています。バックアップは 1 GiB、履歴以外の JSON は合計 8 MiB、JSON 1 件は 8 MiB、GIFT 更新ファイルは 256 KiB までです。",
	"checkImport": "取込状況を確認",
	"importQueued": "サーバーで取り込んでいます。このタブで取込状況を確認できます。",
	"importFailed": "取込が完了しませんでした。原本と既存教材との ID 重複を確認して、再度お試しください。",
	"restoreConfirm": "教材・媒体・復習記録をこのアカウントに保存します。既存IDと重複する場合は取り込みません。初めての取り込みでは、バックアップの学習設定を全教材に適用します。",
	"restored": "教材を取り込みました。",
	"visibility": "学習記録も保存されます。Drive の URL を知っている人が取得できる場合があります。",
	"exported": "書き出しを受け付けました。完了は通知と Drive で確認できます。",
	"updated": "教材を更新しました。",
	"correct": "正解",
	"incorrect": "不正解",
	"again": "もう一度",
	"hard": "難しい",
	"good": "できた",
	"easy": "簡単",
	"cardId": "カード ID",
	"response": "記録された回答"
}
</locale>
<locale locale="en-US" lang="json">
{
	"noStorage": "This tab cannot store session progress. Reloading will lose this session summary.",
	"finished": "This practice session is complete.",
	"dailyFinished": "Today's study session is complete.",
	"paused": "Study session in this tab",
	"nativeDeck": "Saved deck",
	"backToDeck": "Back to deck",
	"backToDecks": "Back to decks",
	"title": "Decks from Fukushu",
	"today": "Study today",
	"createGift": "Create a deck from a GIFT file in Drive",
	"retryGift": "Retry confirmed deck creation",
	"deckName": "New deck name",
	"untitled": "Untitled deck",
	"invalidFile": "Could not read this file. Check its format and contents.",
	"yes": "True",
	"no": "False",
	"open": "Open imported decks",
	"restore": "Import a .fukushu file from Drive",
	"importApkg": "Import an Anki deck (.apkg) from Drive",
	"apkgConfirm": "Save one deck of up to 1,000 cards as a new deck. Static card templates are supported with limited styling. Experimental media support: one static PNG and one PCM 16-bit WAV per deck, up to 256 KiB each. Other media, review history, typed-answer cards, scripts and external references are not supported. Scheduling information is not carried over. Drive size and your server’s upload settings still apply.",
	"apkgLimit": "Anki files up to 256 MiB can be imported.",
	"apkgFailed": "Anki import did not complete. Check the original file and your connection, then try again.",
	"apkgUnsupported": "Unsupported Anki deck. Check for a single deck without review history, scripts or external references. Only one static PNG and one PCM 16-bit WAV (up to 256 KiB each) are supported.",
	"export": "Export to Drive in Fukushu format",
	"empty": "No imported decks yet.",
	"cards": "Cards",
	"decks": "Decks",
	"study": "Study due cards",
	"cram": "Study all active cards",
	"cramAll": "Practice all active cards across decks",
	"update": "Update deck from GIFT in Drive",
	"added": "Added",
	"changed": "Changed",
	"removed": "Disabled",
	"reset": "Schedules reset",
	"history": "Review history",
	"more": "Show more",
	"disabled": "Disabled",
	"answer": "Answer and explanation",
	"previous": "Previous page",
	"next": "Next page",
	"noneDue": "There are no eligible cards.",
	"error": "The operation could not be completed. Check the file and connection.",
	"conflict": "An ID already exists or this deck changed. Reopen the deck.",
	"limit": "Import limit exceeded. Backups support up to 1 GiB with 8 MiB of non-history JSON and 8 MiB per JSON record. GIFT updates support up to 256 KiB.",
	"checkImport": "Check import status",
	"importQueued": "The server is importing the file. Check its status from this tab.",
	"importFailed": "Import did not complete. Check the original file and existing IDs, then try again.",
	"restoreConfirm": "Save decks, media and study history to your account. Existing IDs prevent the entire import. On first import, the backed-up study settings apply to all your decks.",
	"restored": "Decks imported.",
	"visibility": "Includes your study history. People who know the Drive file URL may be able to access it.",
	"exported": "Export requested. Check notifications and Drive for completion.",
	"updated": "Deck updated.",
	"correct": "Correct",
	"incorrect": "Incorrect",
	"again": "Again",
	"hard": "Hard",
	"good": "Good",
	"easy": "Easy",
	"cardId": "Card ID",
	"response": "Recorded answer"
}
</locale>
