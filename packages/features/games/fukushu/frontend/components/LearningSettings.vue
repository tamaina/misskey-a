<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<details :class="$style.settings" @toggle="toggle">
	<summary>{{ $locale.sfc.title }}</summary>
	<form v-if="original" class="_gaps_s" @input="saved = false" @submit.prevent="save">
		<fieldset class="_gaps_s" :disabled="busy">
			<label>{{ $locale.sfc.fresh }}<input v-model="fresh" type="number" min="0" max="200" step="1" required/></label>
			<label>{{ $locale.sfc.reviews }}<input v-model="reviews" type="number" min="1" max="1000" step="1" :placeholder="$locale.sfc.unlimited"/></label>
			<label>{{ $locale.sfc.retention }}<input v-model="percent" type="number" min="80" max="97" step="any" required/></label>
			<p>{{ $locale.sfc.hint }}</p>
			<MkButton type="submit" primary :disabled="busy || conflict">{{ $locale.sfc.save }}</MkButton>
		</fieldset>
	</form>
	<p v-if="saved" role="status">{{ $locale.sfc.saved }}</p>
	<p v-if="failed" role="alert">{{ conflict ? $locale.sfc.conflict : $locale.sfc.failed }}</p>
	<MkButton v-if="failed" small :disabled="busy" @click="load">{{ $locale.sfc.reload }}</MkButton>
</details>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { LearningSettings } from '../../shared/upstream-records.schema.js';

const emit = defineEmits<{ saved: [value: LearningSettings] }>();
const original = ref<LearningSettings>();
const fresh = ref<number | ''>('');
const reviews = ref<number | ''>('');
const percent = ref<number | ''>('');
const saved = ref(false);
const failed = ref(false);
const conflict = ref(false);
const busy = ref(false);
const asPercent = (retention: number) => Number((retention * 100).toPrecision(15));

function show(settings: LearningSettings) {
	original.value = settings;
	fresh.value = settings.newQuestionsPerDay;
	reviews.value = settings.maxReviewsPerDay ?? '';
	percent.value = asPercent(settings.desiredRetention);
}

function toggle(event: Event) {
	if ((event.currentTarget as HTMLDetailsElement).open) void load();
}

async function load() {
	if (busy.value) return;
	busy.value = true;
	saved.value = failed.value = conflict.value = false;
	try {
		show(await misskeyApi('fukushu/study/settings', {}));
	} catch { failed.value = true; } finally { busy.value = false; }
}

async function save() {
	const expected = original.value;
	if (busy.value || !expected || fresh.value === '' || percent.value === '') return;
	const settings = {
		newQuestionsPerDay: fresh.value,
		maxReviewsPerDay: reviews.value === '' ? null : reviews.value,
		desiredRetention: percent.value === asPercent(expected.desiredRetention) ? expected.desiredRetention : percent.value / 100,
	};
	busy.value = true;
	saved.value = failed.value = conflict.value = false;
	try {
		const result = await misskeyApi('fukushu/study/update-settings', { expected, settings });
		show(result);
		emit('saved', result);
		saved.value = true;
	} catch (err) {
		failed.value = true;
		conflict.value = (err as { code?: string })?.code === 'STUDY_CONFLICT';
	} finally { busy.value = false; }
}
</script>

<style module>
.settings summary { cursor: pointer; }
.settings fieldset { border: 0; padding: 0; margin: 12px 0 0; }
.settings label { display: grid; gap: 4px; }
.settings input { box-sizing: border-box; width: 10em; max-width: 100%; padding: 6px 8px; border: 1px solid var(--MI_THEME-divider); border-radius: 6px; background: var(--MI_THEME-panel); color: inherit; font: inherit; }
.settings p { margin: 6px 0; }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "学習設定",
	"fresh": "1回の「今日の学習」で出す新規カード（0〜200枚）",
	"reviews": "復習カードの上限（1〜1000枚・空欄で無制限）",
	"unlimited": "無制限",
	"retention": "目標記憶率（80〜97%）",
	"hint": "目標記憶率を高くすると、復習間隔が短くなります。新しい設定は次の回答から使います。",
	"save": "学習設定を保存",
	"saved": "学習設定を保存しました。",
	"failed": "設定を確認できませんでした。通信状態を確認してください。",
	"conflict": "別の画面で設定が変更されました。再読み込みしてから編集してください。",
	"reload": "設定を再読み込み"
}
</locale>
<locale locale="en-US" lang="json">
{
	"title": "Study settings",
	"fresh": "New cards per daily study session (0–200)",
	"reviews": "Review limit (1–1000, blank for unlimited)",
	"unlimited": "Unlimited",
	"retention": "Desired retention (80–97%)",
	"hint": "Higher retention shortens review intervals. Changes apply from your next answer.",
	"save": "Save study settings",
	"saved": "Study settings saved.",
	"failed": "Could not confirm the settings. Check your connection.",
	"conflict": "Settings changed in another session. Reload them before editing.",
	"reload": "Reload settings"
}
</locale>
