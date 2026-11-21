<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkPreferenceContainer k="disableNoteNyaize">
	<MkSwitch v-model="disabled">
		<template #label>{{ label }}</template>
		<template #caption>{{ $locale.sfc.caption }}</template>
	</MkSwitch>
</MkPreferenceContainer>
</template>
<script lang="ts" setup>
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkPreferenceContainer from './MkPreferenceContainer.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
defineProps<{ label: string }>();
const disabled = prefer.model('disableNoteNyaize');
</script>
<locale lang="json" locale="ja-JP">
{
	"caption": "ネコミミは表示したまま、ネコのアカウントの文章を元の文字で表示します。"
}
</locale>
<locale lang="json" locale="en-US">
{
	"caption": "Show the original text from cat accounts while keeping their cat ears."
}
</locale>
