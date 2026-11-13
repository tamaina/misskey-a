<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition :name="prefer.s.animation ? '_transition_zoom' : ''" appear>
	<div :class="$style.root" class="_gaps">
		<img v-if="type === 'empty' && instance.infoImageUrl" :src="instance.infoImageUrl" draggable="false" :class="$style.img"/>
		<MkSystemIcon v-else-if="type === 'empty'" type="info" :class="$style.icon"/>
		<img v-if="type === 'notFound' && instance.notFoundImageUrl" :src="instance.notFoundImageUrl" draggable="false" :class="$style.img"/>
		<MkSystemIcon v-else-if="type === 'notFound'" type="question" :class="$style.icon"/>
		<img v-if="type === 'error' && instance.serverErrorImageUrl" :src="instance.serverErrorImageUrl" draggable="false" :class="$style.img"/>
		<MkSystemIcon v-else-if="type === 'error'" type="error" :class="$style.icon"/>

		<div style="opacity: 0.7;">{{ props.text ?? (type === 'empty' ? $locale.sfc.nothing : type === 'notFound' ? $locale.sfc.notFound : type === 'error' ? globalLocale.env.somethingHappened : null) }}</div>
		<slot></slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import type { Locale } from 'i18n';
import { useLocale } from 'virtual:vite-vue-internationalization';
import {} from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	type: 'empty' | 'notFound' | 'error';
	text?: string;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
	text-align: center;
	padding: 32px;
}

.img {
	vertical-align: bottom;
	height: 128px;
	margin: auto auto 16px;
	border-radius: 16px;
}

.icon {
	width: 65px;
	height: 65px;
	margin: 0 auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"nothing": "لا يوجد شيء هنا",
	"notFound": "غير موجود"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"nothing": "No hi ha res per veure aquí ",
	"notFound": "No s'ha trobat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"nothing": "Nic nebylo nalezeno",
	"notFound": "Nenalezeno"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"nothing": "Hier gibt es nichts zu sehen",
	"notFound": "Nicht gefunden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"nothing": "No hay nada que ver aqui",
	"notFound": "No se encuentra"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"nothing": "Il n'y a rien à voir ici",
	"notFound": "Non trouvé"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"nothing": "Tidak ada sama sekali disini",
	"notFound": "Tidak dapat ditemukan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"nothing": "Niente da visualizzare",
	"notFound": "Non trovato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"nothing": "ありません",
	"notFound": "見つかりません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"nothing": "あらへん",
	"notFound": "見つからへんね"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"nothing": "아무것도 없습니다",
	"notFound": "찾을 수 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"nothing": "Niets te zien hier",
	"notFound": "Niet gevonden"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"nothing": "Ingenting",
	"notFound": "Ikke funnet"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"nothing": "Nie ma tu niczego",
	"notFound": "Nie znaleziono"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"nothing": "Não há nada aqui",
	"notFound": "Não encontrado"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"nothing": "Ничего нет",
	"notFound": "Не найдено"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"nothing": "Nič tu nie je",
	"notFound": "Nenájdené"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"nothing": "ไม่พบผลลัพธ์",
	"notFound": "ไม่พบหน้าที่ต้องการ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"nothing": "Burada görülecek bir şey yok.",
	"notFound": "Bulunamadı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"nothing": "Тут нічого немає",
	"notFound": "Не знайдено"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"nothing": "Không có gì ở đây",
	"notFound": "Không tìm thấy"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"nothing": "无",
	"notFound": "未找到"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"nothing": "查無項目",
	"notFound": "查無項目"
}
</locale>
