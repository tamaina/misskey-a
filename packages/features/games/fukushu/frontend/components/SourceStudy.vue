<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<section class="_gaps" :aria-busy="busy">
	<template v-if="item">
		<div>{{ index + 1 }} / {{ questions.length }}</div>
		<SourceContent :content="item.payload.prompt"/>
		<fieldset v-if="!revealed && (!flash || needsText)" class="_gaps_s">
			<legend>{{ $locale.sfc.answer }}</legend>
			<input v-if="needsText || item.kind === 'short-answer' || item.kind === 'numerical' || item.kind === 'essay'" v-model="entered" :aria-label="$locale.sfc.answer"/>
			<template v-else-if="item.kind === 'single-choice' || item.kind === 'multiple-choice'">
				<label v-for="c in choices" :key="c.id">
					<input v-if="item.kind === 'multiple-choice'" v-model="selected" type="checkbox" :value="c.id"/>
					<input v-else type="radio" :checked="selected[0] === c.id" @change="selected = [c.id]"/>
					<SourceContent :content="c.content"/>
				</label>
			</template>
			<template v-else-if="item.kind === 'true-false'">
				<label v-for="v in ['true', 'false']" :key="v"><input type="radio" :checked="selected[0] === v" @change="selected = [v]"/>{{ v === 'true' ? $locale.sfc.yes : $locale.sfc.no }}</label>
			</template>
			<template v-else-if="item.payload.kind === 'matching'">
				<label v-for="p in pairs" :key="p.id"><SourceContent :content="p.left"/>
					<select :value="matches.get(p.id) ?? ''" @change="matches.set(p.id, ($event.target as HTMLSelectElement).value)">
						<option disabled value="">—</option><option v-for="o in options" :key="o.id" :value="o.id">{{ o.right.value }}</option>
					</select>
				</label>
			</template>
		</fieldset>
		<MkButton v-if="!revealed" primary :disabled="!canReveal" @click="reveal">{{ flash ? $locale.sfc.reveal : $locale.sfc.submit }}</MkButton>
		<template v-else>
			<template v-if="feedback">
				<strong v-if="graded">{{ graded.correct ? $locale.sfc.correct : $locale.sfc.incorrect }} ({{ Math.round(graded.score) }}%)</strong>
				<SourceContent v-for="(c, i) in solution(item.payload, $locale.sfc.yes, $locale.sfc.no)" :key="i" :content="c"/>
				<SourceContent v-for="(c, i) in graded?.feedback" :key="'feedback' + i" :content="c"/>
				<SourceContent v-if="item.payload.explanation" :content="item.payload.explanation"/>
			</template>
			<MkButton v-else @click="feedback = true">{{ $locale.sfc.reveal }}</MkButton>
			<div class="_buttons">
				<MkButton v-for="r in ratings" :key="r" :primary="r === 'good'" :disabled="busy || !!pending || (!selfRated && !graded?.correct && (r === 'good' || r === 'easy'))" @click="rate(r)">{{ $locale.sfc[r] }}</MkButton>
			</div>
		</template>
		<p v-if="error" role="alert">{{ error }}</p>
		<MkButton v-if="pending && !busy && !capacityReached" @click="send">{{ $locale.sfc.retry }}</MkButton>
	</template>
	<p v-else role="status">{{ $locale.sfc.finished }}</p>
	<MkButton :disabled="busy" @click="emit('close')">{{ $locale.sfc.back }}</MkButton>
</section>
</template>
<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { gradeQuestion } from '../../../shared/fukushu-grading.js';
import { shuffled, solution } from '../source-study.js';
import SourceContent from './SourceContent.vue';
import type { SourceQuestion } from '../source-study.js';
import type { GradeResult } from '../../../shared/fukushu-grading.js';
import type { StudyRating } from '../../shared/study.schema.js';

const props = defineProps<{ questions: SourceQuestion[]; revisions: Map<string, number>; flashMode: boolean; immediate: boolean; shuffle: boolean }>();
const emit = defineEmits<{ close: [] }>();
const ratings = ['again', 'hard', 'good', 'easy'] as const;
const index = ref(0);
const item = computed(() => props.questions[index.value]);
const flash = computed(() => props.flashMode || item.value?.kind === 'flashcard');
const selfRated = computed(() => flash.value || ['essay', 'description'].includes(item.value?.kind));
const needsText = computed(() => item.value?.payload.kind === 'flashcard' && item.value.payload.typeAnswer);
const selected = ref<string[]>([]);
const entered = ref('');
const matches = ref(new Map<string, string>());
const choices = computed(() => {
	const q = item.value.payload;
	if (q.kind !== 'single-choice' && q.kind !== 'multiple-choice') return [];
	const fixed = q.choices.some(c => /^(?:上記(?:の)?すべて|以上(?:の)?すべて|該当なし|どれでもない|all of the above|none of the above)$/i.test(c.content.value.trim()));
	return props.shuffle && q.shuffleChoices !== false && !fixed ? shuffled(q.choices) : q.choices;
});
const pairs = computed(() => {
	const q = item.value.payload;
	if (q.kind !== 'matching') return [];
	return props.shuffle && q.shuffleChoices !== false ? shuffled(q.pairs) : q.pairs;
});
const options = computed(() => props.shuffle && item.value.payload.shuffleChoices !== false ? shuffled(pairs.value) : pairs.value);
const answers = computed(() => {
	if (['short-answer', 'numerical', 'essay'].includes(item.value.kind)) return [entered.value];
	if (item.value.kind === 'matching') return pairs.value.map(p => p.id + '\u0000' + (matches.value.get(p.id) ?? ''));
	return selected.value;
});
const canReveal = computed(() => {
	if (flash.value) return !needsText.value || !!entered.value.trim();
	switch (item.value.kind) {
		case 'essay': case 'short-answer': return !!entered.value.trim();
		case 'numerical': return !!entered.value.trim() && Number.isFinite(Number(entered.value));
		case 'description': return true;
		case 'matching': return pairs.value.every(p => matches.value.has(p.id));
		default: return selected.value.length > 0;
	}
});
const graded = shallowRef<GradeResult>();
const revealed = ref(false);
const feedback = ref(false);
const busy = ref(false);
const error = ref('');
const capacityReached = ref(false);
type Submission = { requestId: string; questionId: string; expectedRevision: number; rating: StudyRating; correct: boolean; answers: string[]; durationMs: number };
const pending = shallowRef<Submission>();
let started = Date.now();

function reveal() {
	if (!canReveal.value) return;
	if (!selfRated.value) graded.value = gradeQuestion(item.value.payload, answers.value);
	revealed.value = true;
	feedback.value = flash.value || props.immediate;
}

async function rate(rating: StudyRating) {
	const revision = props.revisions.get(item.value.id);
	if (!revealed.value || pending.value || busy.value || revision === undefined) return;
	pending.value = { requestId: crypto.randomUUID(), questionId: item.value.id, expectedRevision: revision, rating,
																			correct: selfRated.value ? rating !== 'again' : graded.value!.correct, answers: flash.value ? [] : answers.value.slice(),
																			durationMs: Math.min(2147483647, Math.max(0, Date.now() - started)) };
	await send();
}

async function send() {
	if (!pending.value || busy.value) return;
	busy.value = true;
	try {
		await misskeyApi('fukushu/upstream/review', pending.value, undefined, AbortSignal.timeout(30_000));
		pending.value = undefined;
		index.value++;
		started = Date.now();
		selected.value = []; entered.value = ''; matches.value.clear();
		revealed.value = false; graded.value = undefined; error.value = '';
	} catch (cause) {
		const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : null;
		capacityReached.value = code === 'BACKUP_TOO_LARGE';
		error.value = capacityReached.value ? $locale.value.sfc.capacity : code === 'STUDY_CONFLICT' ? $locale.value.sfc.conflict : $locale.value.sfc.failed;
	} finally { busy.value = false; }
}
</script>
<locale locale="ja-JP" lang="json">
{
	"answer": "回答",
	"yes": "正しい",
	"no": "誤り",
	"submit": "採点する",
	"reveal": "答えを見る",
	"correct": "正解",
	"incorrect": "不正解",
	"again": "もう一度",
	"hard": "難しい",
	"good": "できた",
	"easy": "簡単",
	"finished": "この回の復習は終了です。",
	"back": "教材に戻る",
	"retry": "同じ回答の保存を再試行",
	"capacity": "教材の保存容量の上限に達したため、この回答は保存されませんでした。これまでの履歴は教材に戻って書き出せます。",
	"failed": "保存結果を確認できませんでした。同じ回答で再試行できます。",
	"conflict": "このカードは別の操作で更新されました。教材に戻って開き直してください。"
}
</locale>
<locale locale="en-US" lang="json">
{
	"answer": "Answer",
	"yes": "True",
	"no": "False",
	"submit": "Check answer",
	"reveal": "Show answer",
	"correct": "Correct",
	"incorrect": "Incorrect",
	"again": "Again",
	"hard": "Hard",
	"good": "Good",
	"easy": "Easy",
	"finished": "This study session is complete.",
	"back": "Back to deck",
	"capacity": "This answer could not be saved because the collection reached its byte limit. Return to the library to export your existing history.",
	"retry": "Retry saving this answer",
	"failed": "Could not confirm the save. You can retry the same answer.",
	"conflict": "This card has changed. Return to the deck and reopen it."
}
</locale>
