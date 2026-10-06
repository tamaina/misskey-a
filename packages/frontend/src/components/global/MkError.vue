<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkResult type="error">
	<MkButton :class="$style.button" rounded @click="() => emit('retry')">{{ $locale.sfc.retry }}</MkButton>
</MkResult>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';

const emit = defineEmits<{
	(ev: 'retry'): void;
}>();
</script>

<style lang="scss" module>
.button {
	margin: 0 auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"retry": "حاول مجددًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"retry": "Torna-ho a provar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"retry": "Opakovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"retry": "Retry"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"retry": "Wiederholen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"retry": "Retry"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"retry": "Reintentar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"retry": "Réessayer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"retry": "Coba lagi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"retry": "Riprova"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"retry": "再試行"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"retry": "もっぺんやる？"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"retry": "Retry"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"retry": "Retry"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"retry": "다시 시도"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"retry": "Probeer opnieuw"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"retry": "Prøv igjen"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"retry": "Spróbuj ponownie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"retry": "Tente novamente"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"retry": "Повторить попытку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"retry": "Opakovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"retry": "ลองใหม่อีกครั้ง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"retry": "Tekrar dene"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"retry": "Retry"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"retry": "Спробувати знову"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"retry": "Thử lại"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"retry": "重试"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"retry": "重試"
}
</locale>
