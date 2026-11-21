<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_s">
	<MkPreferenceContainer k="mfmSearchEngine">
		<MkSelect v-model="engine" :items="[...builtinItems, { label: $locale.sfc.custom, value: 'custom' as const }]">
			<template #label>{{ label }}</template>
			<template #caption>{{ $locale.sfc.caption }}</template>
		</MkSelect>
	</MkPreferenceContainer>
	<MkPreferenceContainer v-if="engine === 'custom'" k="mfmSearchEngineCustomUrl">
		<MkInput v-model="customUrl" type="url" placeholder="https://example.com/search?q={query}" manualSave>
			<template #label>{{ $locale.sfc.customUrl }}</template>
			<template #caption>{{ valid || customUrl === '' ? $locale.sfc.customHint : $locale.sfc.invalid }}</template>
		</MkInput>
	</MkPreferenceContainer>
</div>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { SEARCH_ENGINES, SEARCH_ENGINE_IDS, isValidCustomSearchUrl } from '@features/integrations/frontend/utility/mfm-search-engines.js';
import MkPreferenceContainer from './MkPreferenceContainer.vue';
defineProps<{ label: string }>();
const engine = prefer.model('mfmSearchEngine');
const customUrl = prefer.model('mfmSearchEngineCustomUrl');
const builtinItems = SEARCH_ENGINE_IDS.map(value => ({ label: SEARCH_ENGINES[value].name, value }));
const valid = computed(() => isValidCustomSearchUrl(customUrl.value));
</script>
<locale locale="ja-JP" lang="json">
{
 "caption": "ノート内の検索窓から開く検索サービスを選びます。",
 "custom": "カスタム",
 "customUrl": "カスタム検索 URL",
 "customHint": "HTTP または HTTPS の URL で、検索語を入れる場所に {query} を書きます。",
 "invalid": "検索語を入れる {query} が必要です。ホスト名・認証情報には置けません。無効な URL は Google に戻ります。"
}
</locale>
<locale locale="en-US" lang="json">
{
 "caption": "Choose the service opened by search boxes in notes.",
 "custom": "Custom",
 "customUrl": "Custom search URL",
 "customHint": "Use an HTTP or HTTPS URL with {query} where the search text belongs.",
 "invalid": "Include {query} outside the host and credentials. Invalid URLs fall back to Google."
}
</locale>
