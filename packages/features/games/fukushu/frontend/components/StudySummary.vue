<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<section class="_gaps_s">
	<h3>{{ title }}</h3>
	<p>{{ $l.sfc.totals({ answered: progress.answered, total, correct: progress.correct, wrong: progress.answered - progress.correct }) }}</p>
	<p v-if="progress.answered">{{ $l.sfc.accuracy({ percent: Math.round(100 * progress.correct / progress.answered) }) }}</p>
	<p v-if="progress.pending">{{ $locale.sfc.pending }}</p>
	<p v-if="progress.state === 'stale'" role="alert">{{ $locale.sfc.changed }}</p>
	<div class="_buttons">
		<MkButton v-if="progress.state !== 'stale' && progress.answered < total" primary :disabled="busy" @click="emit('resume')">{{ $locale.sfc.resume }}</MkButton>
		<MkButton :disabled="busy" @click="emit('leave')">{{ back }}</MkButton>
	</div>
</section>
</template>
<script setup lang="ts">
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { SessionProgress } from '../tab-session.js';
defineProps<{ title: string; back: string; progress: SessionProgress; total: number; busy?: boolean }>();
const emit = defineEmits<{ resume: []; leave: [] }>();
</script>
<locale locale="ja-JP" lang="json">
{
	"totals": "回答 {answered} / {total} 枚 · 正解 {correct} 枚 · 不正解 {wrong} 枚",
	"accuracy": "正答率 {percent}%",
	"resume": "この回の学習を再開",
	"pending": "保存結果が未確認の回答があります。再開すると同じ回答で保存結果を確認します。",
	"changed": "カードや学習候補が変わったため、この回を終了してください。ここまでに確認できた回答を表示しています。"
}
</locale>
<locale locale="en-US" lang="json">
{
	"totals": "Answered {answered} / {total} · Correct {correct} · Incorrect {wrong}",
	"accuracy": "Accuracy {percent}%",
	"resume": "Resume this session",
	"pending": "One answer is awaiting confirmation. Resume to check it using the original submission.",
	"changed": "The cards or study queue changed. End this session to start a new one. Confirmed answers are shown above."
}
</locale>
