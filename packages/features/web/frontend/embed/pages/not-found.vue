<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div class="_fullinfo">
		<div>{{ $locale.sfc.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject, computed } from 'vue';
import { DI } from '@features/boot/frontend/embed/di.js';

const serverMetadata = inject(DI.serverMetadata)!;
</script>

<locale lang="json" locale="ar-SA">
{
	"notFoundDescription": "تعذر العثور على صفحة يقود إليها هذا الرابط."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"notFoundDescription": "No es troba cap pàgina que correspongui a aquesta adreça"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"notFoundDescription": "Nebyla nalezená žádná stránka korespondující se zadanou URL."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"notFoundDescription": "No page corresponding to this URL could be found."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"notFoundDescription": "Es konnte keine Seite unter dieser URL gefunden werden."
}
</locale>

<locale lang="json" locale="en-US">
{
	"notFoundDescription": "No page corresponding to this URL could be found."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"notFoundDescription": "No se encontró la página correspondiente a la URL elegida"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"notFoundDescription": "Aucune page ne correspond à l’URL spécifiée."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"notFoundDescription": "Tidak ada halaman sesuai dengan URL yang ditentukan."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"notFoundDescription": "Nessuna pagina corrisponde all'URL indicata."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"notFoundDescription": "指定されたURLに該当するページはありませんでした。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"notFoundDescription": "言われたURLのページはなかったで。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"notFoundDescription": "No page corresponding to this URL could be found."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"notFoundDescription": "No page corresponding to this URL could be found."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"notFoundDescription": "지정한 URL에 해당하는 페이지가 존재하지 않습니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"notFoundDescription": "Er is geen pagina gevonden onder deze URL."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"notFoundDescription": "No page corresponding to this URL could be found."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"notFoundDescription": "Nie ma strony odpowiadającej określonemu adresowi URL."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"notFoundDescription": "Não havia página correspondente ao URL especificado."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"notFoundDescription": "Страница по указанной ссылке не найдена"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"notFoundDescription": "Nenašla sa žiadna stránka na zadanej URL."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"notFoundDescription": "ไม่พบหน้าตาม URL ที่ระบุ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"notFoundDescription": "Bu URL'ye karşılık gelen sayfa bulunamadı."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"notFoundDescription": "No page corresponding to this URL could be found."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"notFoundDescription": "Сторінка за вказаною адресою не знайдена."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"notFoundDescription": "Không tìm thấy trang nào tương ứng với URL này."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"notFoundDescription": "没有与指定 URL 对应的页面。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"notFoundDescription": "查無此頁"
}
</locale>
