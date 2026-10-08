<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<p :class="$style.text"><i class="ti ti-alert-triangle"></i> {{ $locale.sfc.somethingHappened }}</p>
	<button class="_buttonGray _buttonRounded" :class="$style.button" @click="() => emit('retry')">{{ $locale.sfc.retry }}</button>
</div>
</template>

<script lang="ts" setup>

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
{
	"somethingHappened": "حدث خطأ",
	"retry": "حاول مجددًا"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"somethingHappened": "S'ha produït un error",
	"retry": "Torna-ho a provar"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"retry": "Opakovat"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"somethingHappened": "An error has occurred",
	"retry": "Retry"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"retry": "Wiederholen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"somethingHappened": "An error has occurred",
	"retry": "Retry"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"somethingHappened": "Ocurrió un error",
	"retry": "Reintentar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"somethingHappened": "Une erreur est survenue",
	"retry": "Réessayer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"somethingHappened": "Terjadi kesalahan",
	"retry": "Coba lagi"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"somethingHappened": "Si è verificato un problema",
	"retry": "Riprova"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"somethingHappened": "問題が発生しました",
	"retry": "再試行"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"somethingHappened": "なんかあかんわ",
	"retry": "もっぺんやる？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"somethingHappened": "An error has occurred",
	"retry": "Retry"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"somethingHappened": "An error has occurred",
	"retry": "Retry"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"somethingHappened": "오류가 발생했습니다",
	"retry": "다시 시도"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"somethingHappened": "Er is iets misgegaan.",
	"retry": "Probeer opnieuw"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"somethingHappened": "En feil har oppstått",
	"retry": "Prøv igjen"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"somethingHappened": "Coś poszło nie tak",
	"retry": "Spróbuj ponownie"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"somethingHappened": "Ocorreu um erro",
	"retry": "Tente novamente"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"somethingHappened": "Что-то пошло не так",
	"retry": "Повторить попытку"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"retry": "Opakovať"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"retry": "ลองใหม่อีกครั้ง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"somethingHappened": "Bir hata oluştu",
	"retry": "Tekrar dene"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"somethingHappened": "An error has occurred",
	"retry": "Retry"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"somethingHappened": "Щось пішло не так",
	"retry": "Спробувати знову"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"somethingHappened": "Xảy ra lỗi",
	"retry": "Thử lại"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"somethingHappened": "出错了",
	"retry": "重试"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"somethingHappened": "發生錯誤",
	"retry": "重試"
}
</locale>
