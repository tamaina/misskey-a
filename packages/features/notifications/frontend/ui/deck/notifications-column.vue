<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :menu="menu" :refresher="async () => { await notificationsComponent?.reload() }">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name || $locale.sfc.notifications }}</template>

	<MkStreamingNotificationsTimeline ref="notificationsComponent" :excludeTypes="props.column.excludeTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, useTemplateRef } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotificationsTimeline from '@features/notifications/frontend/components/MkStreamingNotificationsTimeline.vue';
import * as os from '@features/ui/frontend/os.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const notificationsComponent = useTemplateRef('notificationsComponent');

async function func() {
	const { dispose } = await os.popupAsyncWithDialog(import('@features/notifications/frontend/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: props.column.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			updateColumn(props.column.id, {
				excludeTypes: excludeTypes,
			});
		},
		closed: () => dispose(),
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: $locale.value.sfc.notificationSetting,
	action: func,
}];
</script>

<locale locale="ar-SA" lang="json">
{
	"notifications": "الإشعارات",
	"notificationSetting": "إعدادات التنبيهات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"notifications": "Notificacions",
	"notificationSetting": "Paràmetres de notificacions"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"notifications": "Oznámení",
	"notificationSetting": "Nastavení oznámení"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"notifications": "Notifications",
	"notificationSetting": "Notification settings"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"notifications": "Benachrichtigungen",
	"notificationSetting": "Benachrichtigungseinstellungen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"notifications": "Notifications",
	"notificationSetting": "Notification settings"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"notifications": "Notificaciones",
	"notificationSetting": "Ajustes de Notificaciones"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"notifications": "Notifications",
	"notificationSetting": "Paramètres des notifications "
}
</locale>

<locale locale="id-ID" lang="json">
{
	"notifications": "Notifikasi",
	"notificationSetting": "Pengaturan Notifikasi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"notifications": "Notifiche",
	"notificationSetting": "Impostazioni notifiche"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"notifications": "通知",
	"notificationSetting": "通知設定"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"notifications": "通知",
	"notificationSetting": "通知設定"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"notifications": "Ilɣuyen",
	"notificationSetting": "Notification settings"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"notifications": "ಅಧಿಸೂಚನೆಗಳು",
	"notificationSetting": "Notification settings"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"notifications": "알림",
	"notificationSetting": "알림 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"notifications": "Meldingen",
	"notificationSetting": "Instellingen meldingen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"notifications": "Varsler",
	"notificationSetting": "Varslingsinnstillinger"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"notifications": "Powiadomienia",
	"notificationSetting": "Ustawienia powiadomień"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"notifications": "Notificações",
	"notificationSetting": "Configurações de notificação"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"notifications": "Уведомления",
	"notificationSetting": "Настройки уведомлений"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"notifications": "Oznámenia",
	"notificationSetting": "Nastavenia oznámení"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"notifications": "การเเจ้งเตือน",
	"notificationSetting": "ตั้งค่าการแจ้งเตือน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"notifications": "Bildirimler",
	"notificationSetting": "Bildirim ayarları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"notifications": "Notifications",
	"notificationSetting": "Notification settings"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"notifications": "Сповіщення",
	"notificationSetting": "Параметри сповіщень"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"notifications": "Thông báo",
	"notificationSetting": "Cài đặt thông báo"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"notifications": "通知",
	"notificationSetting": "通知设置"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"notifications": "通知",
	"notificationSetting": "通知設定"
}
</locale>
