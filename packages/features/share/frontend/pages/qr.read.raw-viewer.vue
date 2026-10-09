<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder defaultOpen :withSpacer="false">
	<template #label>{{ data.split('\n')[0] }}</template>
	<template #header>
		<MkTabs
			v-model:tab="tab"
			:tabs="[
				{
					key: 'mfm',
					title: $locale.sfc.mfm,
					icon: 'ti ti-align-left',
				},
				{
					key: 'raw',
					title: $locale.sfc.raw,
					icon: 'ti ti-code',
				},
			]"
		/>
	</template>

	<div v-show="tab === 'mfm'" class="_spacer _gaps">
		<Mfm :text="data" :nyaize="false"/>
		<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="false"/>
	</div>
	<div v-show="tab === 'raw'" class="_spacer" style="--MI_SPACER-min: 10px; --MI_SPACER-max: 16px;">
		<MkCode :code="data" lang="text"/>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as mfm from 'mfm-js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkTabs from '@features/ui/frontend/components/MkTabs.vue';
import { extractUrlFromMfm } from '@features/markup/frontend/utility/extract-url-from-mfm.js';
import MkCode from '@features/markup/frontend/components/MkCode.vue';
import MkUrlPreview from '@features/markup/frontend/components/MkUrlPreview.vue';

const props = defineProps<{
	data: string;
}>();

const parsed = computed(() => mfm.parse(props.data));
const urls = computed(() => extractUrlFromMfm(parsed.value));
const tab = ref<'mfm' | 'raw'>('mfm');
</script>

<locale locale="ar-SA" lang="json">
{
  "mfm": "MFM",
  "raw": "نص"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="en-US" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "mfm": "MFM",
  "raw": "Texto"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "mfm": "MFM",
  "raw": "Texte"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "mfm": "MFM",
  "raw": "Teks"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "mfm": "MFM",
  "raw": "Testo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "mfm": "MFM",
  "raw": "テキスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "mfm": "MFM",
  "raw": "テキスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "mfm": "MFM",
  "raw": "텍스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "mfm": "MFM",
  "raw": "Tekst"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "mfm": "MFM",
  "raw": "Tekst"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "mfm": "MFM",
  "raw": "Texto"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "mfm": "MFM",
  "raw": "Текст"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "mfm": "MFM",
  "raw": "ข้อความ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "mfm": "MFM",
  "raw": "Metin"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "mfm": "MFM",
  "raw": "Text"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "mfm": "MFM",
  "raw": "Текст"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "mfm": "MFM",
  "raw": "Văn bản"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "mfm": "MFM",
  "raw": "文本"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "mfm": "MFM",
  "raw": "文字"
}
</locale>
