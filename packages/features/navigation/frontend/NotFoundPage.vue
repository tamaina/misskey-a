<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="align-content: center; height: 100cqh;">
	<MkResult type="notFound" :text="$locale.sfc.description"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { definePage } from '@/page.js';
import { pleaseLogin } from '@features/auth/frontend/utility/please-login.js';

const props = defineProps<{
	showLoginPopup?: boolean;
}>();

if (props.showLoginPopup) {
	pleaseLogin({ path: '/' });
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.title,
	icon: 'ti ti-alert-triangle',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"title": "غير موجود",
	"description": "تعذر العثور على صفحة يقود إليها هذا الرابط."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"title": "No s'ha trobat",
	"description": "No es troba cap pàgina que correspongui a aquesta adreça"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"title": "Nenalezeno",
	"description": "Nebyla nalezená žádná stránka korespondující se zadanou URL."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"title": "Not found",
	"description": "No page corresponding to this URL could be found."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"title": "Nicht gefunden",
	"description": "Es konnte keine Seite unter dieser URL gefunden werden."
}
</locale>

<locale locale="en-US" lang="json">
{
	"title": "Not found",
	"description": "No page corresponding to this URL could be found."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"title": "No se encuentra",
	"description": "No se encontró la página correspondiente a la URL elegida"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"title": "Non trouvé",
	"description": "Aucune page ne correspond à l’URL spécifiée."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"title": "Tidak dapat ditemukan",
	"description": "Tidak ada halaman sesuai dengan URL yang ditentukan."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"title": "Non trovato",
	"description": "Nessuna pagina corrisponde all'URL indicata."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"title": "見つかりません",
	"description": "指定されたURLに該当するページはありませんでした。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"title": "見つからへんね",
	"description": "言われたURLのページはなかったで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"title": "Not found",
	"description": "No page corresponding to this URL could be found."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"title": "Not found",
	"description": "No page corresponding to this URL could be found."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"title": "찾을 수 없습니다",
	"description": "지정한 URL에 해당하는 페이지가 존재하지 않습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"title": "Niet gevonden",
	"description": "Er is geen pagina gevonden onder deze URL."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"title": "Ikke funnet",
	"description": "No page corresponding to this URL could be found."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"title": "Nie znaleziono",
	"description": "Nie ma strony odpowiadającej określonemu adresowi URL."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"title": "Não encontrado",
	"description": "Não havia página correspondente ao URL especificado."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"title": "Не найдено",
	"description": "Страница по указанной ссылке не найдена"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"title": "Nenájdené",
	"description": "Nenašla sa žiadna stránka na zadanej URL."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"title": "ไม่พบหน้าที่ต้องการ",
	"description": "ไม่พบหน้าตาม URL ที่ระบุ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"title": "Bulunamadı",
	"description": "Bu URL'ye karşılık gelen sayfa bulunamadı."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"title": "Not found",
	"description": "No page corresponding to this URL could be found."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"title": "Не знайдено",
	"description": "Сторінка за вказаною адресою не знайдена."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"title": "Không tìm thấy",
	"description": "Không tìm thấy trang nào tương ứng với URL này."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"title": "未找到",
	"description": "没有与指定 URL 对应的页面。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"title": "查無項目",
	"description": "查無此頁"
}
</locale>
