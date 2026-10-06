<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.oneline]: oneline }]">
	<div :class="$style.key">
		<slot name="key"></slot>
	</div>
	<div :class="$style.value" class="_selectable">
		<slot name="value"></slot>
		<button v-if="copy" v-tooltip="$locale.sfc.copy" class="_textButton" style="margin-left: 0.5em;" @click="copy_"><i class="ti ti-copy"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import * as os from '@/os.js';

const props = withDefaults(defineProps<{
	copy?: string | null;
	oneline?: boolean;
}>(), {
	copy: null,
	oneline: false,
});

const copy_ = () => {
	copyToClipboard(props.copy);
};
</script>

<style lang="scss" module>
.root {
	&.oneline {
		display: flex;

		.key {
			width: 30%;
			font-size: 1em;
			padding: 0 8px 0 0;
		}

		.value {
			width: 70%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

.key {
	font-size: 0.85em;
	padding: 0 0 0.25em 0;
	opacity: 0.75;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "copy": "نسخ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "copy": "Copiar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "copy": "Kopírovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "copy": "Copy"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "copy": "Kopieren"
}
</locale>

<locale locale="en-US" lang="json">
{
  "copy": "Copy"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "copy": "Copiar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "copy": "Copier"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "copy": "Salin"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "copy": "Copia"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "copy": "コピー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "copy": "コピー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "copy": "Copy"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "copy": "Copy"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "copy": "복사"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "copy": "Kopiëren"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "copy": "Kopier"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "copy": "Kopiuj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "copy": "Copiar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "copy": "Копировать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "copy": "Kopírovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "copy": "คัดลอก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "copy": "Kopyala"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "copy": "Copy"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "copy": "Скопіювати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "copy": "Sao chép"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "copy": "复制"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "copy": "複製"
}
</locale>
