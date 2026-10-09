<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_pageScrollable">
	<div class="_spacer" :class="$style.main">
		<MkButton v-if="read" :class="$style.button" rounded @click="read = false"><i class="ti ti-qrcode"></i> {{ $locale.sfc.showTabTitle }}</MkButton>
		<MkButton v-else :class="$style.button" rounded @click="read = true"><i class="ti ti-scan"></i> {{ $locale.sfc.readTabTitle }}</MkButton>

		<MkQrRead v-if="read"/>
		<MkQrShow v-else/>
	</div>
	<MkPolkadots v-if="!read" accented revered :height="200" style="position: sticky; bottom: 0; margin-top: -200px;"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, shallowRef } from 'vue';
import MkQrShow from './qr.show.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { ensureSignin } from '@features/auth/frontend/i';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkPolkadots from '@features/ui/frontend/components/MkPolkadots.vue';

// router definitionでloginRequiredが設定されているためエラーハンドリングしない
const $i = ensureSignin();

const read = ref(false);

const MkQrRead = defineAsyncComponent(() => import('./qr.read.vue'));

definePage(() => ({
	title: $locale.value.sfc.qr,
	icon: 'ti ti-qrcode',
}));
</script>

<style lang="scss" module>
.root {
	height: 100%;
}

.main {
	min-height: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
	z-index: 1;
}

.button {
	margin: 0 auto 16px auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"showTabTitle": "المظهر",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"showTabTitle": "Veure",
	"readTabTitle": "Escanejar ",
	"qr": "Codi QR"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"showTabTitle": "Zobrazit",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"showTabTitle": "Display",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"showTabTitle": "Anzeigeart",
	"readTabTitle": "Auslesen",
	"qr": "QR-Code"
}
</locale>

<locale locale="en-US" lang="json">
{
	"showTabTitle": "Display",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"showTabTitle": "Apariencia",
	"readTabTitle": "Escanear",
	"qr": "Código QR"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"showTabTitle": "Affichage",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"showTabTitle": "Tampilkan",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"showTabTitle": "Visualizza",
	"readTabTitle": "Leggere",
	"qr": "QR Code"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"showTabTitle": "表示",
	"readTabTitle": "読み取る",
	"qr": "二次元コード"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"showTabTitle": "表示",
	"readTabTitle": "読み取る",
	"qr": "二次元コード"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"showTabTitle": "Display",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"showTabTitle": "Display",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"showTabTitle": "보기",
	"readTabTitle": "읽어들이기",
	"qr": "QR 코드"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"showTabTitle": "Weergave",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"showTabTitle": "Display",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"showTabTitle": "Wyświetlanie",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"showTabTitle": "Visualizar",
	"readTabTitle": "Escanear",
	"qr": "Código QR"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"showTabTitle": "Отображение",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"showTabTitle": "Zobraziť",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"showTabTitle": "แสดงผล",
	"readTabTitle": "แสกน",
	"qr": "QR โค้ด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"showTabTitle": "Ekran",
	"readTabTitle": "Okumak",
	"qr": "2 boyutlu kod"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"showTabTitle": "Display",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"showTabTitle": "Відображення",
	"readTabTitle": "Scan",
	"qr": "QR-код"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"showTabTitle": "Hiển thị",
	"readTabTitle": "Scan",
	"qr": "QR Code"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"showTabTitle": "显示",
	"readTabTitle": "扫描",
	"qr": "二维码"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"showTabTitle": "檢視",
	"readTabTitle": "讀取",
	"qr": "二維條碼"
}
</locale>
