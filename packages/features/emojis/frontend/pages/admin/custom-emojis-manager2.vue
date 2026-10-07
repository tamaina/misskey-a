<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="headerTab" :tabs="headerTabs">
	<XGridLocalComponent v-if="headerTab === 'local'" :class="$style.local"/>
	<XGridRemoteComponent v-else-if="headerTab === 'remote'"/>
	<XRegisterComponent v-else-if="headerTab === 'register'"/>
</PageWithHeader>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { definePage } from '@features/navigation/frontend/page.js';
import XGridLocalComponent from '@features/emojis/frontend/pages/admin/custom-emojis-manager.local.list.vue';
import XGridRemoteComponent from '@features/emojis/frontend/pages/admin/custom-emojis-manager.remote.vue';
import XRegisterComponent from '@features/emojis/frontend/pages/admin/custom-emojis-manager.register.vue';

type PageMode = 'local' | 'remote';

const headerTab = ref<PageMode>('local');

const headerTabs = computed(() => [{
	key: 'local',
	title: $locale.value.sfc.local,
}, {
	key: 'remote',
	title: $locale.value.sfc.remote,
}, {
	key: 'register',
	title: $locale.value.sfc.tabTitleRegister,
}]);

definePage(computed(() => ({
	title: $locale.value.sfc.customEmojis,
	icon: 'ti ti-icons',
	needWideArea: true,
})));
</script>

<style lang="css" module>
.local {
	height: calc(100dvh - var(--MI-stickyTop) - var(--MI-stickyBottom));
	overflow: clip;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"local": "المحلي",
	"remote": "بُعدي",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "إيموجي مخصص"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"local": "Local",
	"remote": "Remot",
	"tabTitleRegister": "Registre d'Emojis",
	"customEmojis": "Emojis personalitzats"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"local": "Lokální",
	"remote": "Vzdálené",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Vlastní emoji"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"local": "Local",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Custom Emoji"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"local": "Lokal",
	"remote": "Fremd",
	"tabTitleRegister": "Emojis hinzufügen",
	"customEmojis": "Benutzerdefinierte Emojis"
}
</locale>

<locale locale="en-US" lang="json">
{
	"local": "Local",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Custom Emoji"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"local": "Local",
	"remote": "Remoto",
	"tabTitleRegister": "Registro de Emojis",
	"customEmojis": "Emojis personalizados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"local": "Local",
	"remote": "Distant",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Émojis personnalisés"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"local": "Lokal",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Emoji kustom"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"local": "Locale",
	"remote": "Remota",
	"tabTitleRegister": "Registrazione emoji",
	"customEmojis": "Emoji personalizzate"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"local": "ローカル",
	"remote": "リモート",
	"tabTitleRegister": "絵文字の登録",
	"customEmojis": "カスタム絵文字"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"local": "ローカル",
	"remote": "リモート",
	"tabTitleRegister": "絵文字の登録",
	"customEmojis": "カスタム絵文字"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"local": "Local",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Custom Emoji"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"local": "Local",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Custom Emoji"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"local": "로컬",
	"remote": "리모트",
	"tabTitleRegister": "이모지 등록",
	"customEmojis": "커스텀 이모지"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"local": "Lokaal",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Eigen emoji"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"local": "Local",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Custom Emoji"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"local": "Lokalne",
	"remote": "Zdalny",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Niestandardowe emoji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"local": "Local",
	"remote": "Remoto",
	"tabTitleRegister": "Registro de Emoji",
	"customEmojis": "Emoji personalizado"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"local": "С этого сайта",
	"remote": "С других сайтов",
	"tabTitleRegister": "Регистрация эмодзи",
	"customEmojis": "Собственные эмодзи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"local": "Lokálne",
	"remote": "Vzdialené",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Vlastné emoji"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"local": "ท้องถิ่น",
	"remote": "ระยะไกล",
	"tabTitleRegister": "ลงทะเบียนเอโมจิ",
	"customEmojis": "เอโมจิที่กำหนดเอง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"local": "Yerel",
	"remote": "Uzak",
	"tabTitleRegister": "Emoji kaydı",
	"customEmojis": "Özel Emoji"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"local": "Local",
	"remote": "Remote",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Custom Emoji"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"local": "Локальні",
	"remote": "Віддалені",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Кастомні емоджі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"local": "Máy chủ này",
	"remote": "Máy chủ khác",
	"tabTitleRegister": "Emoji registration",
	"customEmojis": "Tùy chỉnh emoji"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"local": "本地",
	"remote": "远程",
	"tabTitleRegister": "注册表情符号",
	"customEmojis": "自定义表情符号"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"local": "本地",
	"remote": "遠端",
	"tabTitleRegister": "登錄表情符號",
	"customEmojis": "自訂表情符號"
}
</locale>
