<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<p :class="$style.text"><i class="ti ti-alert-triangle"></i> {{ globalLocale.env.somethingHappened }}</p>
	<button class="_buttonGray _buttonRounded" :class="$style.button" @click="() => emit('retry')">{{ globalLocale.env.retry }}</button>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const emit = defineEmits<{
	(ev: 'retry'): void;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
  align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.button {
	margin: 0 auto;
}

.img {
	vertical-align: bottom;
  width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}
</style>

<locale lang="json" locale="ar-SA">
{}
</locale>

<locale lang="json" locale="ca-ES">
{}
</locale>

<locale lang="json" locale="cs-CZ">
{}
</locale>

<locale lang="json" locale="da-DK">
{}
</locale>

<locale lang="json" locale="de-DE">
{}
</locale>

<locale lang="json" locale="en-US">
{}
</locale>

<locale lang="json" locale="es-ES">
{}
</locale>

<locale lang="json" locale="fr-FR">
{}
</locale>

<locale lang="json" locale="id-ID">
{}
</locale>

<locale lang="json" locale="it-IT">
{}
</locale>

<locale lang="json" locale="ja-JP">
{}
</locale>

<locale lang="json" locale="ja-KS">
{}
</locale>

<locale lang="json" locale="kab-KAB">
{}
</locale>

<locale lang="json" locale="kn-IN">
{}
</locale>

<locale lang="json" locale="ko-KR">
{}
</locale>

<locale lang="json" locale="nl-NL">
{}
</locale>

<locale lang="json" locale="no-NO">
{}
</locale>

<locale lang="json" locale="pl-PL">
{}
</locale>

<locale lang="json" locale="pt-PT">
{}
</locale>

<locale lang="json" locale="ru-RU">
{}
</locale>

<locale lang="json" locale="sk-SK">
{}
</locale>

<locale lang="json" locale="th-TH">
{}
</locale>

<locale lang="json" locale="tr-TR">
{}
</locale>

<locale lang="json" locale="ug-CN">
{}
</locale>

<locale lang="json" locale="uk-UA">
{}
</locale>

<locale lang="json" locale="vi-VN">
{}
</locale>

<locale lang="json" locale="zh-CN">
{}
</locale>

<locale lang="json" locale="zh-TW">
{}
</locale>
