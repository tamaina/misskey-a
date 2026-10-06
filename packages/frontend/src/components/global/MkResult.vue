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

		<div style="opacity: 0.7;">{{ props.text ?? (type === 'empty' ? $locale.sfc.nothing : type === 'notFound' ? $locale.sfc.notFound : type === 'error' ? $locale.sfc.somethingHappened : null) }}</div>
		<slot></slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import {} from 'vue';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';

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
	"notFound": "غير موجود",
	"somethingHappened": "حدث خطأ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"nothing": "No hi ha res per veure aquí ",
	"notFound": "No s'ha trobat",
	"somethingHappened": "S'ha produït un error"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"nothing": "Nic nebylo nalezeno",
	"notFound": "Nenalezeno",
	"somethingHappened": "Jejda. Něco se nepovedlo."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"nothing": "Hier gibt es nichts zu sehen",
	"notFound": "Nicht gefunden",
	"somethingHappened": "Ein Fehler ist aufgetreten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"nothing": "No hay nada que ver aqui",
	"notFound": "No se encuentra",
	"somethingHappened": "Ocurrió un error"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"nothing": "Il n'y a rien à voir ici",
	"notFound": "Non trouvé",
	"somethingHappened": "Une erreur est survenue"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"nothing": "Tidak ada sama sekali disini",
	"notFound": "Tidak dapat ditemukan",
	"somethingHappened": "Terjadi kesalahan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"nothing": "Niente da visualizzare",
	"notFound": "Non trovato",
	"somethingHappened": "Si è verificato un problema"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"nothing": "ありません",
	"notFound": "見つかりません",
	"somethingHappened": "問題が発生しました"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"nothing": "あらへん",
	"notFound": "見つからへんね",
	"somethingHappened": "なんかあかんわ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"nothing": "아무것도 없습니다",
	"notFound": "찾을 수 없습니다",
	"somethingHappened": "오류가 발생했습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"nothing": "Niets te zien hier",
	"notFound": "Niet gevonden",
	"somethingHappened": "Er is iets misgegaan."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"nothing": "Ingenting",
	"notFound": "Ikke funnet",
	"somethingHappened": "En feil har oppstått"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"nothing": "Nie ma tu niczego",
	"notFound": "Nie znaleziono",
	"somethingHappened": "Coś poszło nie tak"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"nothing": "Não há nada aqui",
	"notFound": "Não encontrado",
	"somethingHappened": "Ocorreu um erro"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"nothing": "Ничего нет",
	"notFound": "Не найдено",
	"somethingHappened": "Что-то пошло не так"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"nothing": "Nič tu nie je",
	"notFound": "Nenájdené",
	"somethingHappened": "Ups. Niečo sa nepodarilo."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"nothing": "ไม่พบผลลัพธ์",
	"notFound": "ไม่พบหน้าที่ต้องการ",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"nothing": "Burada görülecek bir şey yok.",
	"notFound": "Bulunamadı",
	"somethingHappened": "Bir hata oluştu"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"nothing": "There's nothing to see here",
	"notFound": "Not found",
	"somethingHappened": "An error has occurred"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"nothing": "Тут нічого немає",
	"notFound": "Не знайдено",
	"somethingHappened": "Щось пішло не так"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"nothing": "Không có gì ở đây",
	"notFound": "Không tìm thấy",
	"somethingHappened": "Xảy ra lỗi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"nothing": "无",
	"notFound": "未找到",
	"somethingHappened": "出错了"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"nothing": "查無項目",
	"notFound": "查無項目",
	"somethingHappened": "發生錯誤"
}
</locale>
