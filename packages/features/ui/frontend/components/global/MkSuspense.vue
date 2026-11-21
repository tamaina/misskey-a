<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="pending">
	<MkLoading/>
</div>
<div v-else-if="resolved">
	<slot :result="result as T"></slot>
</div>
<div v-else>
	<div :class="$style.error">
		<slot name="error" :error="error">
			<div><i class="ti ti-alert-triangle"></i> {{ globalLocale.env.somethingHappened }}</div>
			<div v-if="error">{{ JSON.stringify(error) }}</div>
			<MkButton inline style="margin-top: 16px;" @click="retry"><i class="ti ti-reload"></i> {{ globalLocale.env.retry }}</MkButton>
		</slot>
	</div>
</div>
</template>

<script lang="ts" setup generic="T extends unknown">
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	p: () => Promise<T>;
}>();

const emit = defineEmits<{
	(ev: 'resolved', result: T): void;
}>();

const pending = ref(true);
const resolved = ref(false);
const rejected = ref(false);
const result = ref<T | null>(null);
const error = ref<any | null>(null);

const process = () => {
	const promise = props.p();
	pending.value = true;
	resolved.value = false;
	rejected.value = false;
	promise.then((_result) => {
		pending.value = false;
		resolved.value = true;
		result.value = _result;
		emit('resolved', _result);
	});
	promise.catch((_error) => {
		pending.value = false;
		rejected.value = true;
		error.value = _error;
	});
};

watch(() => props.p, () => {
	process();
}, {
	immediate: true,
});

const retry = () => {
	process();
};
</script>

<style lang="scss" module>
.error {
	padding: 16px;
	text-align: center;
}
</style>

<locale locale="ar-SA" lang="json">
{}
</locale>

<locale locale="ca-ES" lang="json">
{}
</locale>

<locale locale="cs-CZ" lang="json">
{}
</locale>

<locale locale="da-DK" lang="json">
{}
</locale>

<locale locale="de-DE" lang="json">
{}
</locale>

<locale locale="en-US" lang="json">
{}
</locale>

<locale locale="es-ES" lang="json">
{}
</locale>

<locale locale="fr-FR" lang="json">
{}
</locale>

<locale locale="id-ID" lang="json">
{}
</locale>

<locale locale="it-IT" lang="json">
{}
</locale>

<locale locale="ja-JP" lang="json">
{}
</locale>

<locale locale="ja-KS" lang="json">
{}
</locale>

<locale locale="kab-KAB" lang="json">
{}
</locale>

<locale locale="kn-IN" lang="json">
{}
</locale>

<locale locale="ko-KR" lang="json">
{}
</locale>

<locale locale="nl-NL" lang="json">
{}
</locale>

<locale locale="no-NO" lang="json">
{}
</locale>

<locale locale="pl-PL" lang="json">
{}
</locale>

<locale locale="pt-PT" lang="json">
{}
</locale>

<locale locale="ru-RU" lang="json">
{}
</locale>

<locale locale="sk-SK" lang="json">
{}
</locale>

<locale locale="th-TH" lang="json">
{}
</locale>

<locale locale="tr-TR" lang="json">
{}
</locale>

<locale locale="ug-CN" lang="json">
{}
</locale>

<locale locale="uk-UA" lang="json">
{}
</locale>

<locale locale="vi-VN" lang="json">
{}
</locale>

<locale locale="zh-CN" lang="json">
{}
</locale>

<locale locale="zh-TW" lang="json">
{}
</locale>
