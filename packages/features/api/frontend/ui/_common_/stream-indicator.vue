<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="hasDisconnected && prefer.s.serverDisconnectedBehavior === 'quiet'" :class="$style.root" class="_panel _shadow" @click="resetDisconnected">
	<div><i class="ti ti-alert-triangle"></i> {{ $locale.sfc.disconnectedFromServer }}</div>
	<div :class="$style.command" class="_buttons">
		<MkButton small primary @click="reload">{{ $locale.sfc.reload }}</MkButton>
		<MkButton small>{{ $locale.sfc.doNothing }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import { useStream } from '@features/api/frontend/stream.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { store } from '@features/preferences/frontend/store.js';

const zIndex = os.claimZIndex('high');

const hasDisconnected = ref(false);

function onDisconnected() {
	hasDisconnected.value = true;
}

function resetDisconnected() {
	hasDisconnected.value = false;
}

function reload() {
	window.location.reload();
}

if (store.s.realtimeMode) {
	useStream().on('_disconnected_', onDisconnected);

	onUnmounted(() => {
		useStream().off('_disconnected_', onDisconnected);
	});
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: calc(var(--MI-minBottomSpacing) + var(--MI-margin));
	right: var(--MI-margin);
	margin: 0;
	padding: 12px;
	font-size: 0.9em;
	max-width: 320px;
}

.command {
	margin-top: 8px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "disconnectedFromServer": "قُطِع الإتصال بالخادم",
  "reload": "انعش",
  "doNothing": "تجاهل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "disconnectedFromServer": "Desconnectat pel servidor",
  "reload": "Actualitzar",
  "doNothing": "Ignora"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "disconnectedFromServer": "Spojení bylo přerušeno",
  "reload": "Aktualizovat",
  "doNothing": "Ignorovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "disconnectedFromServer": "Connection to server has been lost",
  "reload": "Refresh",
  "doNothing": "Ignore"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "disconnectedFromServer": "Die Verbindung zum Server wurde getrennt",
  "reload": "Aktualisieren",
  "doNothing": "Ignorieren"
}
</locale>

<locale locale="en-US" lang="json">
{
  "disconnectedFromServer": "Connection to server has been lost",
  "reload": "Refresh",
  "doNothing": "Ignore"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "disconnectedFromServer": "Desconectado del servidor",
  "reload": "Recargar",
  "doNothing": "No hacer nada"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "disconnectedFromServer": "Déconnecté·e du serveur",
  "reload": "Rafraîchir",
  "doNothing": "Ignorer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "disconnectedFromServer": "Terputus koneksi dari peladen",
  "reload": "Muat ulang",
  "doNothing": "Abaikan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "disconnectedFromServer": "Connessione persa",
  "reload": "Ricarica",
  "doNothing": "Ignora"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "disconnectedFromServer": "サーバーから切断されました",
  "reload": "リロード",
  "doNothing": "なにもしない"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "disconnectedFromServer": "サーバーが機嫌悪いねん",
  "reload": "リロード",
  "doNothing": "何もせんとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "disconnectedFromServer": "Connection to server has been lost",
  "reload": "Refresh",
  "doNothing": "Ignore"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "disconnectedFromServer": "Connection to server has been lost",
  "reload": "Refresh",
  "doNothing": "Ignore"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "disconnectedFromServer": "서버와의 연결이 끊어졌습니다",
  "reload": "새로고침",
  "doNothing": "무시하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "disconnectedFromServer": "Verbinding met de server onderbroken.",
  "reload": "Verversen",
  "doNothing": "Negeren"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "disconnectedFromServer": "Connection to server has been lost",
  "reload": "Refresh",
  "doNothing": "Ignorer"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "disconnectedFromServer": "Utracono połączenie z serwerem.",
  "reload": "Odśwież",
  "doNothing": "Ignoruj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "disconnectedFromServer": "Desconectado do servidor",
  "reload": "Recarregar",
  "doNothing": "Nenhuma ação adicional"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "disconnectedFromServer": "Разорвано соединение с сервером",
  "reload": "Перезагрузить",
  "doNothing": "Ничего не делать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "disconnectedFromServer": "Spojenie so serverom bolo prerušené",
  "reload": "Obnoviť",
  "doNothing": "Ignorovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "disconnectedFromServer": "การเชื่อมต่อเซิร์ฟเวอร์ถูกตัด",
  "reload": "รีโหลด",
  "doNothing": "ช่างมัน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "disconnectedFromServer": "Sunucu bağlantısı kesildi",
  "reload": "Yenile",
  "doNothing": "Yoksay"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "disconnectedFromServer": "Connection to server has been lost",
  "reload": "Refresh",
  "doNothing": "Ignore"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "disconnectedFromServer": "Зв’язок із сервером було перервано",
  "reload": "Оновити",
  "doNothing": "Нічого не робити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "disconnectedFromServer": "Mất kết nối tới máy chủ",
  "reload": "Tải lại",
  "doNothing": "Bỏ qua"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "disconnectedFromServer": "已和服务器断开连接",
  "reload": "刷新",
  "doNothing": "关闭"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "disconnectedFromServer": "與伺服器中斷連線",
  "reload": "重新整理",
  "doNothing": "無視"
}
</locale>
