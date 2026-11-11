<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="true"
	:okButtonDisabled="false"
	@ok="ok()"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.notificationSetting }}</template>

	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div class="_gaps_m">
			<MkInfo>{{ $locale.sfc.notificationSettingDesc }}</MkInfo>
			<div class="_buttons">
				<MkButton inline @click="disableAll">{{ globalLocale.env.disableAll }}</MkButton>
				<MkButton inline @click="enableAll">{{ globalLocale.env.enableAll }}</MkButton>
			</div>
			<MkSwitch v-for="ntype in notificationTypes" :key="ntype" v-model="typesMap[ntype].value">{{ copyLocaleDictionary(globalLocale.env._notification._types)[ntype] }}</MkSwitch>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, useTemplateRef } from 'vue';
import { notificationTypes } from 'misskey-js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import type { Ref } from 'vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

type TypesMap = Record<typeof notificationTypes[number], Ref<boolean>>;

const emit = defineEmits<{
	(ev: 'done', v: { excludeTypes: typeof notificationTypes[number][] }): void,
	(ev: 'closed'): void,
}>();

const props = withDefaults(defineProps<{
	excludeTypes?: typeof notificationTypes[number][];
}>(), {
	excludeTypes: () => [],
});

const dialog = useTemplateRef('dialog');

const typesMap = notificationTypes.reduce((p, t) => ({ ...p, [t]: ref<boolean>(!props.excludeTypes.includes(t)) }), {} as TypesMap);

function ok() {
	emit('done', {
		excludeTypes: (Object.keys(typesMap) as typeof notificationTypes[number][])
			.filter(type => !typesMap[type].value),
	});

	if (dialog.value) dialog.value.close();
}

function disableAll() {
	for (const type of notificationTypes) {
		typesMap[type].value = false;
	}
}

function enableAll() {
	for (const type of notificationTypes) {
		typesMap[type].value = true;
	}
}
</script>

<locale lang="json" locale="ar-SA">
{
	"notificationSetting": "إعدادات التنبيهات",
	"notificationSettingDesc": "اختر نوع التنبيهات المراد عرضها"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"notificationSetting": "Paràmetres de notificacions",
	"notificationSettingDesc": "Selecciona els tipus de notificacions que es mostraran"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"notificationSetting": "Nastavení oznámení",
	"notificationSettingDesc": "Vyberte typy oznámení k zobrazení."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"notificationSetting": "Benachrichtigungseinstellungen",
	"notificationSettingDesc": "Wähle die Art der anzuzeigenden Benachrichtigungen."
}
</locale>

<locale lang="json" locale="en-US">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"notificationSetting": "Ajustes de Notificaciones",
	"notificationSettingDesc": "Por favor elige el tipo de notificación a mostrar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"notificationSetting": "Paramètres des notifications ",
	"notificationSettingDesc": "Sélectionnez le type de notification à afficher"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"notificationSetting": "Pengaturan Notifikasi",
	"notificationSettingDesc": "Pilih tipe notifikasi untuk ditampilkan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"notificationSetting": "Impostazioni notifiche",
	"notificationSettingDesc": "Scegli quali notifiche mostrare."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"notificationSetting": "通知設定",
	"notificationSettingDesc": "表示する通知の種別を選択してください。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"notificationSetting": "通知設定",
	"notificationSettingDesc": "出す通知の種類えらんでや。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"notificationSetting": "알림 설정",
	"notificationSettingDesc": "표시할 알림의 종류를 선택해 주세요."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"notificationSetting": "Instellingen meldingen",
	"notificationSettingDesc": "Selecteer het type meldingen dat moet worden weergegeven."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"notificationSetting": "Varslingsinnstillinger",
	"notificationSettingDesc": "Select the types of notification to display."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"notificationSetting": "Ustawienia powiadomień",
	"notificationSettingDesc": "Wybierz rodzaj powiadomień do wyświetlania"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"notificationSetting": "Configurações de notificação",
	"notificationSettingDesc": "Selecione o tipo de notificação a ser exibido."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"notificationSetting": "Настройки уведомлений",
	"notificationSettingDesc": "Выберите тип уведомлений для отображения"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"notificationSetting": "Nastavenia oznámení",
	"notificationSettingDesc": "Vyberte typ oznámení na zobrazenie"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"notificationSetting": "ตั้งค่าการแจ้งเตือน",
	"notificationSettingDesc": "เลือกประเภทการแจ้งเตือนที่ต้องการจะแสดง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"notificationSetting": "Bildirim ayarları",
	"notificationSettingDesc": "Görüntülemek istediğiniz bildirim türlerini seçin."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"notificationSetting": "Notification settings",
	"notificationSettingDesc": "Select the types of notification to display."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"notificationSetting": "Параметри сповіщень",
	"notificationSettingDesc": "Виберіть типи сповіщень для відображення"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"notificationSetting": "Cài đặt thông báo",
	"notificationSettingDesc": "Chọn loại thông báo bạn muốn hiển thị."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"notificationSetting": "通知设置",
	"notificationSettingDesc": "选择要显示的通知类型。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"notificationSetting": "通知設定",
	"notificationSettingDesc": "選擇顯示通知的類型"
}
</locale>
