<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 500px;">
		<div v-if="instance.ads.length > 0" class="_gaps">
			<MkAd v-for="ad in instance.ads" :key="ad.id" :specify="ad"/>
		</div>
		<MkResult v-else type="empty"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { definePage } from '@features/navigation/frontend/page.js';
import { instance } from '@features/instance/frontend/instance.js';

definePage(() => ({
	title: $locale.value.sfc.ads,
	icon: 'ti ti-ad',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"ads": "الإعلانات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"ads": "Publicitat "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"ads": "Reklamy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"ads": "Advertisements"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"ads": "Werbung"
}
</locale>

<locale locale="en-US" lang="json">
{
	"ads": "Advertisements"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"ads": "Anuncios"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"ads": "Publicité"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"ads": "Iklan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"ads": "Banner"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"ads": "広告"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"ads": "広告"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"ads": "Advertisements"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"ads": "Advertisements"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"ads": "광고"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"ads": "Advertenties"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"ads": "Annonser"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"ads": "Reklamy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"ads": "Anúncios"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"ads": "Реклама"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"ads": "Reklamy"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"ads": "โฆษณา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"ads": "Reklamlar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"ads": "Advertisements"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"ads": "Реклама"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"ads": "Quảng cáo"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"ads": "广告"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"ads": "廣告"
}
</locale>
