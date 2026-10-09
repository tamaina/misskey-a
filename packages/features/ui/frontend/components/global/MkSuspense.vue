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
			<div><i class="ti ti-alert-triangle"></i> {{ $locale.sfc.somethingHappened }}</div>
			<div v-if="error">{{ JSON.stringify(error) }}</div>
			<MkButton inline style="margin-top: 16px;" @click="retry"><i class="ti ti-reload"></i> {{ $locale.sfc.retry }}</MkButton>
		</slot>
	</div>
</div>
</template>

<script lang="ts" setup generic="T extends unknown">
import { ref, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

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
{
  "somethingHappened": "حدث خطأ",
  "retry": "حاول مجددًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "somethingHappened": "S'ha produït un error",
  "retry": "Torna-ho a provar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "somethingHappened": "Jejda. Něco se nepovedlo.",
  "retry": "Opakovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "somethingHappened": "An error has occurred",
  "retry": "Retry"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "somethingHappened": "Ein Fehler ist aufgetreten",
  "retry": "Wiederholen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "somethingHappened": "An error has occurred",
  "retry": "Retry"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "somethingHappened": "Ocurrió un error",
  "retry": "Reintentar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "somethingHappened": "Une erreur est survenue",
  "retry": "Réessayer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "somethingHappened": "Terjadi kesalahan",
  "retry": "Coba lagi"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "somethingHappened": "Si è verificato un problema",
  "retry": "Riprova"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "somethingHappened": "問題が発生しました",
  "retry": "再試行"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "somethingHappened": "なんかあかんわ",
  "retry": "もっぺんやる？"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "somethingHappened": "An error has occurred",
  "retry": "Retry"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "somethingHappened": "An error has occurred",
  "retry": "Retry"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "somethingHappened": "오류가 발생했습니다",
  "retry": "다시 시도"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "somethingHappened": "Er is iets misgegaan.",
  "retry": "Probeer opnieuw"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "somethingHappened": "En feil har oppstått",
  "retry": "Prøv igjen"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "somethingHappened": "Coś poszło nie tak",
  "retry": "Spróbuj ponownie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "somethingHappened": "Ocorreu um erro",
  "retry": "Tente novamente"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "somethingHappened": "Что-то пошло не так",
  "retry": "Повторить попытку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "somethingHappened": "Ups. Niečo sa nepodarilo.",
  "retry": "Opakovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
  "retry": "ลองใหม่อีกครั้ง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "somethingHappened": "Bir hata oluştu",
  "retry": "Tekrar dene"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "somethingHappened": "An error has occurred",
  "retry": "Retry"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "somethingHappened": "Щось пішло не так",
  "retry": "Спробувати знову"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "somethingHappened": "Xảy ra lỗi",
  "retry": "Thử lại"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "somethingHappened": "出错了",
  "retry": "重试"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "somethingHappened": "發生錯誤",
  "retry": "重試"
}
</locale>
