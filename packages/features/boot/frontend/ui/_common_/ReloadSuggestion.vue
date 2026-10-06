<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<span :class="$style.icon">
		<i class="ti ti-info-circle"></i>
	</span>
	<span :class="$style.title">{{ $locale.sfc.reloadRequiredToApplySettings }}</span>
	<span :class="$style.body"><button class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" @click="reload">{{ $locale.sfc.reload }}</button> | <button class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" @click="skip">{{ $locale.sfc.skip }}</button></span>
</div>
</template>

<script lang="ts" setup>
import { shouldSuggestReload } from '@features/boot/frontend/utility/reload-suggest.js';
import { unisonReload } from '@features/runtime/frontend/utility/unison-reload.js';

function reload() {
	unisonReload();
}

function skip() {
	shouldSuggestReload.value = false;
}
</script>

<style lang="scss" module>
.root {
	--height: 24px;
	font-size: 0.85em;
	display: flex;
	vertical-align: bottom;
	width: 100%;
	line-height: var(--height);
	height: var(--height);
	overflow: clip;
	contain: strict;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
}

.icon {
	margin-left: 10px;
	animation: blink 2s infinite;
}

.title {
	padding: 0 10px;
	font-weight: bold;
	animation: blink 2s infinite;
}

.body {
	min-width: 0;
	flex: 1;
	overflow: clip;
	white-space: nowrap;
	text-overflow: ellipsis;
}

@keyframes blink {
	0% { opacity: 1; }
	10% { opacity: 1; }
	50% { opacity: 0; }
	90% { opacity: 1; }
	100% { opacity: 1; }
}
</style>

<locale locale="ar-SA" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "انعش",
  "skip": "Skip"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "reloadRequiredToApplySettings": "És necessari recarregar la pàgina per aplicar els canvis.",
  "reload": "Actualitzar",
  "skip": "Ometre "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Aktualizovat",
  "skip": "Skip"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Refresh",
  "skip": "Skip"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "reloadRequiredToApplySettings": "Eine Aktualisierung ist erforderlich, um die Einstellungen zu übernehmen.",
  "reload": "Aktualisieren",
  "skip": "Überspringen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Refresh",
  "skip": "Skip"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "reloadRequiredToApplySettings": "Es necesario recargar para que se aplique la configuración.",
  "reload": "Recargar",
  "skip": "Saltar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "reloadRequiredToApplySettings": "Le rafraîchissement est nécessaire pour que les paramètres prennent effet.",
  "reload": "Rafraîchir",
  "skip": "Skip"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "reloadRequiredToApplySettings": "Muat ulang diperlukan untuk menerapkan pengaturan.",
  "reload": "Muat ulang",
  "skip": "Lewati"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "reloadRequiredToApplySettings": "Per applicare le impostazioni, occorre ricaricare.",
  "reload": "Ricarica",
  "skip": "Salta"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "reloadRequiredToApplySettings": "設定の反映にはリロードが必要です。",
  "reload": "リロード",
  "skip": "スキップ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "reloadRequiredToApplySettings": "設定を見るんにはリロードが必要やで。",
  "reload": "リロード",
  "skip": "スキップ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Refresh",
  "skip": "Skip"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Refresh",
  "skip": "Skip"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "reloadRequiredToApplySettings": "설정을 적용하려면 새로고침을 해야 합니다.",
  "reload": "새로고침",
  "skip": "건너뛰기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Verversen",
  "skip": "Skip"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Refresh",
  "skip": "Skip"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Odśwież",
  "skip": "Skip"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "reloadRequiredToApplySettings": "É necessário reiniciar para aplicar as configurações.",
  "reload": "Recarregar",
  "skip": "Pular"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "reloadRequiredToApplySettings": "Для применения настроек необходима обновить страницу.",
  "reload": "Перезагрузить",
  "skip": "Пропустить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Obnoviť",
  "skip": "Skip"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "reloadRequiredToApplySettings": "จำเป็นต้องมีการโหลดซ้ำเพื่อให้การตั้งค่ามีผล",
  "reload": "รีโหลด",
  "skip": "ข้าม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "reloadRequiredToApplySettings": "Ayarları uygulamak için yeniden yükleme gereklidir.",
  "reload": "Yenile",
  "skip": "Atla"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Refresh",
  "skip": "Skip"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "reloadRequiredToApplySettings": "Щоб застосувати налаштування, потрібно перезавантажити сторінку.",
  "reload": "Оновити",
  "skip": "Пропустити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
  "reload": "Tải lại",
  "skip": "Skip"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "reloadRequiredToApplySettings": "需要重新载入来使设置生效",
  "reload": "刷新",
  "skip": "跳过"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "reloadRequiredToApplySettings": "需要重新載入頁面設定才能生效。",
  "reload": "重新整理",
  "skip": "跳過"
}
</locale>
