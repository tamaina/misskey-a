<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section class="_panel _gaps" :class="$style.panel" :aria-label="$locale.sfc.title">
	<h2>{{ $locale.sfc.title }}</h2>
	<p>{{ $locale.sfc.description }}</p>
	<p :class="$style.muted">{{ $locale.sfc.newHistory }}</p>
	<MkInfo v-if="archived">{{ $locale.sfc.archived }}</MkInfo>
	<p v-if="error" role="alert" :class="$style.error">{{ error }}</p>
	<p v-if="noStorage" role="status">{{ $locale.sfc.noStorage }}</p>
	<p v-if="queueBusy" role="status">{{ $locale.sfc.loading }}</p>
	<template v-if="pending && !reviewBusy">
		<p>{{ $locale.sfc.retryDescription }}</p>
		<MkButton primary :disabled="disabled" @click="submitPending">{{ $locale.sfc.retry }}</MkButton>
	</template>
	<template v-if="needsReload">
		<MkButton :disabled="disabled || archived || locked" @click="start">{{ $locale.sfc.reloadQueue }}</MkButton>
	</template>
	<StudySummary v-if="summary && progress && plan" :progress="progress" :total="plan.cards.length" :title="progress.answered === plan.cards.length ? $locale.sfc.completed : $locale.sfc.partial" :back="$locale.sfc.dismiss" @resume="continueStudy" @leave="finish"/>
	<template v-else-if="!queue">
		<MkButton v-if="!needsReload" primary :disabled="disabled || archived || locked" :wait="queueBusy" @click="start">{{ $locale.sfc.start }}</MkButton>
		<p :class="$style.muted">{{ $locale.sfc.queuePolicy }}</p>
	</template>
	<template v-else>
		<div :class="$style.heading">
			<span>{{ Math.min(position + 1, queue.items.length) }} / {{ queue.items.length }}</span>
			<MkButton small :disabled="disabled || locked" @click="stop">{{ $locale.sfc.stop }}</MkButton>
		</div>
		<p v-if="queue.items.length === 0" role="status">{{ $locale.sfc.empty }}</p>
		<p v-else-if="!item" role="status">{{ $locale.sfc.completed }}</p>
		<article v-if="item" class="_gaps" :class="$style.card">
			<span :class="$style.muted">{{ item.isNew ? $locale.sfc.newCard : $locale.sfc.reviewCard }}</span>
			<StaticAnkiCard :fallback="item.question.payload.prompt.value" :html="item.question.payload.ankiTemplate?.frontHtml" :css="item.question.payload.ankiTemplate?.css"/>
			<template v-if="!revealed">
				<template v-if="item.question.payload.typeAnswer">
					<label>
						<MkInput v-model="typedAnswer" :disabled="disabled || locked || needsReload" @keydown="revealOnEnter">
							<template #label>{{ $locale.sfc.typedAnswer }}</template>
						</MkInput>
					</label>
					<p :class="$style.muted">{{ $locale.sfc.typedDescription }}</p>
				</template>
				<MkButton primary :disabled="disabled || archived || locked || needsReload || !canReveal" @click="reveal">{{ $locale.sfc.reveal }}</MkButton>
			</template>
			<template v-else>
				<div class="_gaps_s" :class="$style.answer">
					<h3>{{ $locale.sfc.answer }}</h3>
					<StaticAnkiCard :fallback="item.question.payload.answer.value" :html="item.question.payload.ankiTemplate?.backHtml" :css="item.question.payload.ankiTemplate?.css"/>
					<p v-if="item.question.payload.explanation" :class="$style.content">{{ item.question.payload.explanation.value }}</p>
				</div>
				<template v-if="saved">
					<p role="status">{{ $locale.sfc.saved }} · {{ ratingLabel(saved.record.rating) }}</p>
					<p>{{ $locale.sfc.nextDue }}: <time :datetime="saved.card.due">{{ localDate(saved.card.due) }}</time></p>
					<MkButton primary :disabled="disabled || locked" @click="advance">{{ position + 1 === queue.items.length ? $locale.sfc.finish : $locale.sfc.next }}</MkButton>
				</template>
				<template v-else>
					<p>{{ $locale.sfc.rateDescription }}</p>
					<div class="_buttons" role="group" :aria-label="$locale.sfc.ratings">
						<MkButton v-for="rating in ratings" :key="rating" :primary="rating === 'good'" :disabled="disabled || archived || locked || needsReload" @click="rate(rating)">{{ ratingLabel(rating) }}</MkButton>
					</div>
					<p v-if="reviewBusy" role="status">{{ $locale.sfc.saving }}</p>
				</template>
			</template>
		</article>
	</template>
	<div class="_gaps" :class="$style.history">
		<div :class="$style.heading">
			<h3>{{ $locale.sfc.history }}</h3>
			<MkButton small :disabled="disabled || historyBusy" :wait="historyBusy" @click="loadHistory(0)">{{ historyPage === null ? $locale.sfc.openHistory : $locale.sfc.refreshHistory }}</MkButton>
		</div>
		<p v-if="historyError" role="alert" :class="$style.error">{{ historyError }}</p>
		<template v-if="historyPage !== null">
			<p :class="$style.muted">{{ $locale.sfc.snapshotDescription }}</p>
			<p v-if="history.length === 0">{{ historyPage === 0 ? $locale.sfc.noHistory : $locale.sfc.noOlderHistory }}</p>
			<ol v-else :class="$style.historyList">
				<li v-for="entry in history" :key="entry.id" class="_gaps_s" :class="$style.historyEntry">
					<div :class="$style.heading"><time :datetime="entry.record.reviewedAt">{{ localDate(entry.record.reviewedAt) }}</time><strong>{{ ratingLabel(entry.record.rating) }}</strong></div>
					<p :class="$style.content">{{ entry.question.payload.prompt.value }}</p>
					<details>
						<summary>{{ $locale.sfc.savedCard }} · {{ $locale.sfc.version }} {{ entry.questionVersion }}</summary>
						<p :class="$style.content">{{ entry.question.payload.answer.value }}</p>
						<p v-if="entry.question.payload.explanation" :class="$style.content">{{ entry.question.payload.explanation.value }}</p>
						<p>{{ $locale.sfc.savedNextDue }}: <time :datetime="entry.card.due">{{ localDate(entry.card.due) }}</time></p>
					</details>
				</li>
			</ol>
			<div class="_buttons">
				<MkButton :disabled="disabled || historyBusy || historyPage === 0" @click="loadHistory(historyPage - 1)">{{ $locale.sfc.newerHistory }}</MkButton>
				<MkButton :disabled="disabled || historyBusy || history.length < 20" @click="loadHistory(historyPage + 1)">{{ $locale.sfc.olderHistory }}</MkButton>
			</div>
		</template>
	</div>
</section>
</template>

<script setup lang="ts">
import StaticAnkiCard from './StaticAnkiCard.vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import StudySummary from './StudySummary.vue';
import { useTabSession } from '../tab-session.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import type { StudyHistoryItem, StudyQueue, StudyRating, StudyReviewInput, StudyReviewResult } from '../../shared/study.schema.js';

const props = defineProps<{ deckId: string; archived: boolean; disabled?: boolean; ownerId?: string }>();
const emit = defineEmits<{ (event: 'active', value: boolean): void; (event: 'locked', value: boolean): void }>();
const ratings: StudyRating[] = ['again', 'hard', 'good', 'easy'];
const queue = ref<StudyQueue | null>(null);
const position = ref(0);
const journal = useTabSession(props.ownerId);
const { plan, progress, unavailable: noStorage } = journal;
const summary = ref(false);
const revealed = ref(false);
const typedAnswer = ref('');
const queueBusy = ref(false);
const reviewBusy = ref(false);
const pending = ref<StudyReviewInput | null>(null);
const saved = ref<StudyReviewResult | null>(null);
const needsReload = ref(false);
const error = ref('');
const history = ref<StudyHistoryItem[]>([]);
const historyPage = ref<number | null>(null);
const historyCursors = ref<(string | undefined)[]>([undefined]);
const historyBusy = ref(false);
const historyError = ref('');
const item = computed(() => queue.value?.items[position.value]);
const locked = computed(() => queueBusy.value || reviewBusy.value || pending.value !== null);
const active = computed(() => queue.value !== null && item.value !== undefined);
const canReveal = computed(() => !item.value?.question.payload.typeAnswer || typedAnswer.value.trim().length > 0);
let disposed = false;
let started = 0;
watch(locked, value => emit('locked', value), { immediate: true, flush: 'sync' });
watch(active, value => emit('active', value), { immediate: true, flush: 'sync' });

function ratingLabel(rating: StudyRating) { return $locale.value.sfc[rating]; }

function localDate(value: string) { return new Date(value).toLocaleString(); }

function errorCode(cause: unknown): string | null {
	return typeof cause === 'object' && cause !== null && 'code' in cause && typeof cause.code === 'string' ? cause.code : null;
}

function resetCard() { revealed.value = false; typedAnswer.value = ''; saved.value = null; started = performance.now(); }

async function start() {
	if (disposed || props.disabled || props.archived || locked.value) return;
	queueBusy.value = true;
	error.value = '';
	try {
		const result = await misskeyApi('fukushu/study/queue', { id: props.deckId }, undefined, AbortSignal.timeout(20_000));
		if (disposed) return;
		queue.value = result;
		if (result.items.length) journal.begin('native', props.deckId, false, result.items.map(i => ({
			id: i.question.id, deck: props.deckId, version: i.questionVersion, revision: i.stateRevision,
		})));
		else journal.discard();
		summary.value = false;
		position.value = 0;
		needsReload.value = false;
		resetCard();
	} catch (cause) {
		if (!disposed) error.value = ['STUDY_UNAVAILABLE', 'NO_SUCH_MATERIAL'].includes(errorCode(cause) ?? '') ? $locale.value.sfc.unavailable : $locale.value.sfc.loadFailed;
	} finally { if (!disposed) queueBusy.value = false; }
}

function stop() {
	if (disposed || props.disabled || locked.value) return;
	if (progress.value?.answered) {
		if (progress.value.state !== 'stale') journal.state('paused');
		summary.value = true;
		return;
	}
	finish();
}

function continueStudy() {
	journal.state('active');
	summary.value = false;
}

function finish() {
	journal.discard();
	summary.value = false;
	queue.value = null;
	position.value = 0;
	needsReload.value = false;
	error.value = '';
	resetCard();
}

function reveal() {
	if (!item.value || props.disabled || props.archived || locked.value || needsReload.value || !canReveal.value) return;
	revealed.value = true;
}

function revealOnEnter(event: KeyboardEvent) {
	if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) return;
	event.preventDefault();
	reveal();
}

async function rate(rating: StudyRating) {
	const current = item.value;
	if (disposed || !current || !revealed.value || saved.value || props.disabled || props.archived || locked.value || needsReload.value) return;
	pending.value = {
		id: props.deckId, questionId: current.question.id, questionVersion: current.questionVersion,
		expectedStateRevision: current.stateRevision, requestId: crypto.randomUUID(), rating,
		durationMs: Math.min(86_400_000, Math.max(0, Math.floor(performance.now() - started))),
	};
	journal.prepare({ requestId: pending.value.requestId, questionId: current.question.id, expectedRevision: current.stateRevision,
		rating, correct: rating !== 'again', answers: [], durationMs: pending.value.durationMs });
	await submitPending();
}

async function submitPending() {
	const input = pending.value;
	if (disposed || props.disabled || !input || reviewBusy.value) return;
	reviewBusy.value = true;
	error.value = '';
	try {
		const result = await misskeyApi('fukushu/study/review', { ...input }, undefined, AbortSignal.timeout(20_000));
		if (disposed) return;
		const answer = progress.value?.pending;
		if (answer) journal.confirm(answer);
		saved.value = result;
		pending.value = null;
	} catch (cause) {
		if (disposed) return;
		const code = errorCode(cause);
		if (code === 'STUDY_CONFLICT' || code === 'STUDY_UNAVAILABLE' || code === 'NO_SUCH_MATERIAL' || code === 'STUDY_LIMIT' || code === 'CARD_HISTORY_LIMIT' || code === 'INVALID_PARAM' || code === 'PERMISSION_DENIED' || code === 'CREDENTIAL_REQUIRED') {
			pending.value = null;
			journal.state('stale');
			needsReload.value = true;
			error.value = code === 'STUDY_LIMIT' || code === 'CARD_HISTORY_LIMIT' ? $locale.value.sfc.limit : code === 'STUDY_CONFLICT' ? $locale.value.sfc.conflict : $locale.value.sfc.unavailable;
		} else {
			// Keep the exact UUID, rating, duration and versions: the server may have committed.
			error.value = $locale.value.sfc.uncertain;
		}
	} finally { if (!disposed) reviewBusy.value = false; }
}

function advance() {
	if (disposed || props.disabled || locked.value || !saved.value) return;
	position.value++;
	if (position.value === queue.value?.items.length) summary.value = true;
	resetCard();
}

async function loadHistory(page: number) {
	if (disposed || props.disabled || historyBusy.value || page < 0) return;
	const cursor = page === 0 ? undefined : page === (historyPage.value ?? 0) + 1 ? history.value.at(-1)?.id : historyCursors.value[page];
	if (page > 0 && !cursor) return;
	historyBusy.value = true;
	historyError.value = '';
	try {
		const result = await misskeyApi('fukushu/study/history', { id: props.deckId, ...(cursor ? { beforeId: cursor } : {}), limit: 20 }, undefined, AbortSignal.timeout(20_000));
		if (disposed) return;
		if (page === 0) historyCursors.value = [undefined];
		else historyCursors.value[page] = cursor;
		history.value = result;
		historyPage.value = page;
	} catch {
		if (!disposed) historyError.value = $locale.value.sfc.historyFailed;
	} finally { if (!disposed) historyBusy.value = false; }
}

onBeforeUnmount(() => { disposed = true; emit('locked', false); emit('active', false); });
</script>

<style lang="scss" module>
.panel { padding: 20px; }
.panel h2, .panel h3, .panel p { margin: 0; }
.heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.card { padding: 20px 0; }
.content { white-space: pre-wrap; overflow-wrap: anywhere; min-width: 0; }
.answer, .history { border-top: 1px solid var(--MI_THEME-divider); padding-top: 16px; }
.historyList { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.historyEntry { padding: 16px; border: 1px solid var(--MI_THEME-divider); border-radius: 8px; }
.historyEntry details p { margin-top: 12px; }
.historyEntry summary { cursor: pointer; }
.muted { color: var(--MI_THEME-fgTransparentWeak); font-size: .9em; }
.error { color: var(--MI_THEME-error); }
</style>

<locale locale="ja-JP" lang="json">
{
	"partial": "ここまでの学習結果",
	"dismiss": "結果を閉じる",
	"noStorage": "再開情報をこのタブに保存できません。",
	"title": "この教材を復習",
	"description": "答えを確認して自己評価すると、復習予定と記録を保存します。",
	"newHistory": "学習記録はこのサーバーで新しく保存します。元の Fukushu やブラウザの学習履歴は取り込みません。",
	"archived": "保管済みの教材は復習できません。過去の記録は閲覧できます。",
	"loading": "復習するカードを読み込み中…",
	"retryDescription": "結果を確認するまで、評価の変更や次のカードへの移動はできません。この画面を閉じずに再試行してください。",
	"retry": "同じ記録を再確認",
	"reloadQueue": "復習するカードを読み直す",
	"start": "復習を始める",
	"queuePolicy": "期限になった復習カードと、新規カードを最大20枚取り込みます。「もう一度」でも同じ回には再出題しません。",
	"stop": "復習を終了",
	"empty": "今は復習できるカードがありません。期限前のカードを自動で出題することはありません。",
	"completed": "今回の復習は完了しました。",
	"newCard": "新規カード",
	"reviewCard": "復習カード",
	"typedAnswer": "答えを入力",
	"typedDescription": "入力は答えを見るためのメモです。自動採点せず、入力した内容も保存しません。",
	"reveal": "答えを開く",
	"answer": "答えと解説",
	"saved": "記録しました",
	"nextDue": "次回の復習予定",
	"finish": "今回の復習を完了",
	"next": "次のカードへ",
	"rateDescription": "この問題はどのくらい難しかったですか？",
	"ratings": "自己評価",
	"again": "もう一度",
	"hard": "難しかった",
	"good": "わかった",
	"easy": "簡単",
	"saving": "記録を保存中…",
	"history": "この教材の復習記録",
	"openHistory": "復習記録を見る",
	"refreshHistory": "最新の記録を読む",
	"snapshotDescription": "1ページ20件。回答した時点のカードを表示します。後から解説を編集しても、この記録の内容は変わりません。",
	"noHistory": "このサーバーで保存した復習記録はまだありません。",
	"noOlderHistory": "これより前の復習記録はありません。",
	"savedCard": "回答時のカードを見る",
	"version": "版",
	"savedNextDue": "記録時の次回予定",
	"newerHistory": "新しい記録へ",
	"olderHistory": "古い記録へ",
	"unavailable": "このカードでは記録を続けられません。保管状態・利用権限・期限やカードの状態を確認し、復習するカードを読み直してください。",
	"loadFailed": "復習するカードを取得できませんでした。接続を確認して再試行してください。",
	"limit": "記録の保存上限に達しました。過去の記録は保持されています。",
	"conflict": "別の操作でカードや復習状態が変わりました。この評価は保存せず、復習するカードを読み直してください。",
	"uncertain": "記録が保存されたか確認できません。同じ内容で再試行すると、保存済みの記録は重複しません。",
	"historyFailed": "復習記録を取得できませんでした。表示中の記録は残しています。再試行してください。"
}
</locale>

<locale locale="en-US" lang="json">
{
	"partial": "Session so far",
	"dismiss": "Close results",
	"noStorage": "This tab cannot store session progress.",
	"title": "Study this material",
	"description": "Reveal the answer and rate yourself to save a review and its next due date.",
	"newHistory": "New study records are saved on this server. Existing Fukushu or browser study histories are not imported.",
	"archived": "Archived materials cannot be studied. You can still read their previous reviews.",
	"loading": "Loading cards to study…",
	"retryDescription": "Keep this screen open and retry before changing the rating or moving to another card.",
	"retry": "Check the same review again",
	"reloadQueue": "Reload cards to study",
	"start": "Start studying",
	"queuePolicy": "Study due review cards followed by up to 20 new cards. Again does not reinsert the card into this session.",
	"stop": "End session",
	"empty": "No cards are available to study now. Future-due cards are not added automatically.",
	"completed": "This session is complete.",
	"newCard": "New card",
	"reviewCard": "Review card",
	"typedAnswer": "Type your answer",
	"typedDescription": "Typing helps you recall before revealing. It is not graded automatically, and your typed text is not saved.",
	"reveal": "Reveal answer",
	"answer": "Answer and explanation",
	"saved": "Review saved",
	"nextDue": "Next review due",
	"finish": "Complete this session",
	"next": "Next card",
	"rateDescription": "How difficult was this question?",
	"ratings": "Self-rating",
	"again": "Again",
	"hard": "Hard",
	"good": "Good",
	"easy": "Easy",
	"saving": "Saving review…",
	"history": "Reviews for this material",
	"openHistory": "View reviews",
	"refreshHistory": "Load latest reviews",
	"snapshotDescription": "20 reviews per page. Each shows the card as it was reviewed. Later explanation edits do not change these records.",
	"noHistory": "No reviews have been saved on this server yet.",
	"noOlderHistory": "There are no earlier reviews.",
	"savedCard": "View the reviewed card",
	"version": "Version",
	"savedNextDue": "Next due recorded at the time",
	"newerHistory": "Newer reviews",
	"olderHistory": "Older reviews",
	"unavailable": "This card cannot be reviewed now. Check its archive status, permissions, due date and availability, then reload the cards.",
	"loadFailed": "Cards could not be loaded. Check your connection and try again.",
	"limit": "The retained-history limit has been reached. Previous records are preserved.",
	"conflict": "Another operation changed the card or its review state. This rating was not saved. Reload the cards before continuing.",
	"uncertain": "The result could not be confirmed. Retry the same review; an already saved record will not be duplicated.",
	"historyFailed": "Reviews could not be loaded. The displayed records are retained. Try again."
}
</locale>
