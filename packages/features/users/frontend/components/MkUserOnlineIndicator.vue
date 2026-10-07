<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-tooltip="text"
	:class="[$style.root, {
		[$style.status_online]: user.onlineStatus === 'online',
		[$style.status_active]: user.onlineStatus === 'active',
		[$style.status_offline]: user.onlineStatus === 'offline',
		[$style.status_unknown]: user.onlineStatus === 'unknown',
	}]"
></div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';

const props = defineProps<{
	user: Misskey.entities.User;
}>();

const text = computed(() => {
	switch (props.user.onlineStatus) {
		case 'online': return $locale.value.sfc.online;
		case 'active': return $locale.value.sfc.active;
		case 'offline': return $locale.value.sfc.offline;
		case 'unknown': return $locale.value.sfc.unknown;
	}
});
</script>

<style lang="scss" module>
.root {
	box-shadow: 0 0 0 3px var(--MI_THEME-panel);
	border-radius: 120%; // Blinkのバグか知らんけど、100%ぴったりにすると何故か若干楕円でレンダリングされる

	&.status_online {
		background: #58d4c9;
	}

	&.status_active {
		background: #e4bc48;
	}

	&.status_offline {
		background: #ea5353;
	}

	&.status_unknown {
		background: #888;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"online": "متصل",
	"active": "نشط",
	"offline": "غير متصل",
	"unknown": "مجهول"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"online": "Connectat",
	"active": "Actiu",
	"offline": "Desconnectat",
	"unknown": "Desconegut"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"online": "Online",
	"active": "Aktivní",
	"offline": "Offline",
	"unknown": "Neznámý"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"online": "Online",
	"active": "Active",
	"offline": "Offline",
	"unknown": "Unknown"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"online": "Online",
	"active": "Aktiv",
	"offline": "Offline",
	"unknown": "Unbekannt"
}
</locale>

<locale locale="en-US" lang="json">
{
	"online": "Online",
	"active": "Active",
	"offline": "Offline",
	"unknown": "Unknown"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"online": "En línea",
	"active": "Activo",
	"offline": "Sin conexión",
	"unknown": "Desconocido"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"online": "En ligne",
	"active": "Actif·ve",
	"offline": "Hors ligne",
	"unknown": "Inconnu"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"online": "Daring",
	"active": "Aktif",
	"offline": "Luring",
	"unknown": "Tidak diketahui"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"online": "Online",
	"active": "Attivo",
	"offline": "Offline",
	"unknown": "Sconosciuto"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"online": "オンライン",
	"active": "アクティブ",
	"offline": "オフライン",
	"unknown": "不明"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"online": "オンライン",
	"active": "アクティブ",
	"offline": "オフライン",
	"unknown": "不明"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"online": "Online",
	"active": "Active",
	"offline": "Offline",
	"unknown": "Unknown"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"online": "Online",
	"active": "Active",
	"offline": "Offline",
	"unknown": "Unknown"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"online": "온라인",
	"active": "최근에 활동함",
	"offline": "오프라인",
	"unknown": "알 수 없음"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"online": "Online",
	"active": "Actief",
	"offline": "Offline",
	"unknown": "Onbekend"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"online": "Online",
	"active": "Active",
	"offline": "Offline",
	"unknown": "Ukjent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"online": "Online",
	"active": "Aktywny",
	"offline": "Offline",
	"unknown": "Nieznane"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"online": "Online",
	"active": "Ativo",
	"offline": "Inativo",
	"unknown": "Desconhecido"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"online": "В сети",
	"active": "Действует",
	"offline": "Не в сети",
	"unknown": "Неизвестно"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"online": "Online",
	"active": "Aktívny",
	"offline": "Offline",
	"unknown": "Neznáme"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"online": "ออนไลน์",
	"active": "ใช้งานอยู่",
	"offline": "ออฟไลน์",
	"unknown": "ไม่ทราบสถานะ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"online": "Online",
	"active": "Aktif",
	"offline": "Offline",
	"unknown": "Bilinmiyor"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"online": "Online",
	"active": "Active",
	"offline": "Offline",
	"unknown": "Unknown"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"online": "Онлайн",
	"active": "Активовано",
	"offline": "Офлайн",
	"unknown": "Невідомо"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"online": "Online",
	"active": "Hoạt động",
	"offline": "Ngoại tuyến",
	"unknown": "Chưa biết"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"online": "在线",
	"active": "活动",
	"offline": "离线",
	"unknown": "未知"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"online": "線上",
	"active": "最近活躍",
	"offline": "離線",
	"unknown": "未知"
}
</locale>
