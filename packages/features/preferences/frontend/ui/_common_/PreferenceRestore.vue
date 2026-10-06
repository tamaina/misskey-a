<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<span :class="$style.icon">
		<i class="ti ti-info-circle"></i>
	</span>
	<span :class="$style.title">{{ $locale.sfc.backupFound }}</span>
	<span :class="$style.body"><button class="_textButton" @click="restore">{{ $locale.sfc.restore }}</button> | <button class="_textButton" @click="skip">{{ $locale.sfc.skip }}</button></span>
</div>
</template>

<script lang="ts" setup>
import { $i } from '@/i.js';
import { hideRestoreBackupSuggestion, restoreFromCloudBackup } from '@features/preferences/frontend/state/utility.js';

function restore() {
	restoreFromCloudBackup();
}

function skip() {
	hideRestoreBackupSuggestion();
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
	background: var(--MI_THEME-panel);
}

.icon {
	margin-left: 10px;
}

.title {
	padding: 0 10px;
	font-weight: bold;
}

.body {
	min-width: 0;
	flex: 1;
	overflow: clip;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "backupFound": "Còpia de seguretat de la configuració trobada",
  "restore": "Restaurar ",
  "skip": "Ometre "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "backupFound": "Konfigurationssicherung gefunden.",
  "restore": "Wiederherstellen",
  "skip": "Überspringen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "backupFound": "Copia de seguridad de los ajustes encontrada ",
  "restore": "Restaurar",
  "skip": "Saltar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Kembalikan",
  "skip": "Lewati"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "backupFound": "Esiste il Backup delle preferenze",
  "restore": "Ripristina",
  "skip": "Salta"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "backupFound": "設定のバックアップが見つかりました",
  "restore": "復元",
  "skip": "スキップ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "backupFound": "設定のバックアップがあるみたいやわ",
  "restore": "復元",
  "skip": "スキップ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "backupFound": "설정 백업이 발견되었습니다",
  "restore": "복원",
  "skip": "건너뛰기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "backupFound": "Backup de configurações encontrado",
  "restore": "Redefinir",
  "skip": "Pular"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Восстановить",
  "skip": "Пропустить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "backupFound": "พบข้อมูลสำรองของการตั้งค่าแล้ว",
  "restore": "กู้คืน",
  "skip": "ข้าม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "backupFound": "Ayarların yedeği bulundu",
  "restore": "Geri yükle",
  "skip": "Atla"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "backupFound": "Резервну копію налаштувань знайдено",
  "restore": "Відновити",
  "skip": "Пропустити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "backupFound": "Settings backup is found",
  "restore": "Restore",
  "skip": "Skip"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "backupFound": "已找到备份",
  "restore": "恢复",
  "skip": "跳过"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "backupFound": "找到設定的備份",
  "restore": "還原",
  "skip": "跳過"
}
</locale>
