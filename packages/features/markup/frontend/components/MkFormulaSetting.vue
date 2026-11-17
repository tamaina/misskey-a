<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<SearchMarker :keywords="['latex', 'katex', 'formula', 'math', 'mfm']">
	<MkSelect v-model="selection" :items="[{ value: 'disabled', label: $locale.sfc.disabled }, { value: 'enabled', label: $locale.sfc.enabled }]">
		<template #label><SearchLabel>{{ $locale.sfc.label }}</SearchLabel></template>
		<template #caption>{{ $locale.sfc.caption }}</template>
	</MkSelect>
</SearchMarker>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
const enabled = defineModel<boolean>({ required: true });
const selection = computed({
	get: () => enabled.value ? 'enabled' as const : 'disabled' as const,
	set: (value: 'enabled' | 'disabled') => { enabled.value = value === 'enabled'; },
});
</script>
<locale locale="ja-JP" lang="json">
{
  "label": "MFM の数式表示",
  "caption": "通常画面と埋め込みで数式を表示します。無効時は原文を表示します。ほかの画面には設定の再読込後に反映されます。",
  "disabled": "無効（既定）",
  "enabled": "有効"
}
</locale>
<locale locale="en-US" lang="json">
{
  "label": "MFM formula rendering",
  "caption": "Render formulas in the main app and embeds. When disabled, show the source. Other views apply changes when their server settings reload.",
  "disabled": "Disabled (default)",
  "enabled": "Enabled"
}
</locale>
