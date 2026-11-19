<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<section class="_gaps">
	<p v-if="entry">{{ index + 1 }} / {{ queue.items.length }} · {{ entry.deckName }}</p>
	<SourceStudy v-if="question && entry" :practiceAhead="practiceAhead" :key="index" :questions="[question]" :revisions="new Map([[question.id, entry.revision]])"
		:flashMode="entry.origin === 'native' || entry.flash" :nativeVersion="entry.origin === 'native' ? entry.version : undefined"
		:singleStep="true" :immediate="queue.immediate" :shuffle="queue.shuffle" @saved="advance" @close="emit('close')"/>
	<template v-else>
		<p v-if="failed" role="alert">{{ $locale.sfc.loadFailed }}</p>
		<MkButton v-if="failed" @click="load">{{ $locale.sfc.retry }}</MkButton>
		<p v-else role="status">{{ entry ? $locale.sfc.loading : (practiceAhead ? $locale.sfc.practiceFinished : $locale.sfc.finished) }}</p>
		<MkButton @click="emit('close')">{{ $locale.sfc.back }}</MkButton>
	</template>
</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import SourceStudy from './SourceStudy.vue';
import type { TodayQueue } from '../../shared/today.schema.js';
import type { SourceQuestion } from '../source-study.js';

const props = defineProps<{ queue: TodayQueue; practiceAhead: boolean }>();
const emit = defineEmits<{ close: [] }>();
const index = ref(0);
const entry = computed(() => props.queue.items[index.value]);
const question = shallowRef<SourceQuestion>();
const failed = ref(false);
let controller: AbortController | undefined;
onBeforeUnmount(() => controller?.abort());

async function load() {
	controller?.abort();
	const current = entry.value;
	question.value = undefined;
	failed.value = false;
	if (!current) return;
	if (current.origin === 'source') {
		question.value = current.question;
		return;
	}
	const request = new AbortController();
	controller = request;
	try {
		const version = await misskeyApi('fukushu/materials/card-version', { id: current.deckId, questionId: current.questionId, version: current.version }, undefined, request.signal);
		if (!request.signal.aborted) question.value = version.question;
	} catch {
		if (!request.signal.aborted) failed.value = true;
	}
}

function advance() {
	index.value++;
	void load();
}

void load();
</script>
<locale locale="ja-JP" lang="json">
{
	"loadFailed": "カードを読み込めませんでした。",
	"retry": "このカードを再読み込み",
	"loading": "カードを読み込み中…",
	"finished": "今日の学習を終了しました。",
	"practiceFinished": "この回の復習は終了です。",
	"back": "教材一覧に戻る"
}
</locale>
<locale locale="en-US" lang="json">
{
	"loadFailed": "Could not load this card.",
	"retry": "Reload this card",
	"loading": "Loading card…",
	"finished": "Today's study session is complete.",
	"practiceFinished": "This practice session is complete.",
	"back": "Back to decks"
}
</locale>
