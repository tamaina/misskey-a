<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkFolder v-for="x in statusbars" :key="x.id">
		<template #label>{{ x.type ?? $locale.sfc.notSet }}</template>
		<template #suffix>{{ x.name }}</template>
		<XStatusbar :_id="x.id" :userLists="userLists"/>
	</MkFolder>
	<MkButton primary @click="add">{{ globalLocale.env.add }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { onMounted, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import XStatusbar from '@features/preferences/frontend/pages/settings/statusbar.statusbar.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const statusbars = prefer.r.statusbars;

const userLists = ref<Misskey.entities.UserList[] | null>(null);

onMounted(() => {
	misskeyApi('users/lists/list').then(res => {
		userLists.value = res;
	});
});

async function add() {
	prefer.commit('statusbars', [...statusbars.value, {
		id: genId(),
		name: null,
		type: null,
		black: false,
		size: 'medium',
		props: {},
	}]);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.statusbar,
	icon: 'ti ti-list',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"notSet": "لم يعيّن",
	"statusbar": "شريط الحالة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"notSet": "Sense definir",
	"statusbar": "Barra d'estat"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"notSet": "Není nastaveno",
	"statusbar": "Stavový řádek"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"notSet": "Not set",
	"statusbar": "Status bar"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"notSet": "Nicht konfiguriert",
	"statusbar": "Statusleiste"
}
</locale>

<locale locale="en-US" lang="json">
{
	"notSet": "Not set",
	"statusbar": "Status bar"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"notSet": "Sin especificar",
	"statusbar": "Barra de estado"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"notSet": "Non défini",
	"statusbar": "Barre d’état"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"notSet": "Tidak disetel",
	"statusbar": "Bilah status"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"notSet": "Non impostato",
	"statusbar": "Barra di stato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"notSet": "未設定",
	"statusbar": "ステータスバー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"notSet": "未設定",
	"statusbar": "ステータスバー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"notSet": "Not set",
	"statusbar": "Status bar"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"notSet": "Not set",
	"statusbar": "Status bar"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"notSet": "설정되지 않음",
	"statusbar": "상태바"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"notSet": "Niet geconfigureerd",
	"statusbar": "Status bar"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"notSet": "Not set",
	"statusbar": "Status bar"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"notSet": "Nie ustawiono",
	"statusbar": "Pasek stanu"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"notSet": "Não definido",
	"statusbar": "Barra de status"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"notSet": "Не настроено",
	"statusbar": "Статусбар"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"notSet": "Nenastavené",
	"statusbar": "Stavový riadok"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"notSet": "ไม่ได้ตั้งค่า",
	"statusbar": "แถบสถานะ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"notSet": "Ayarlı değil",
	"statusbar": "Durum çubuğu"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"notSet": "Not set",
	"statusbar": "Status bar"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"notSet": "Не налаштовано",
	"statusbar": "Рядок стану"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"notSet": "Chưa đặt",
	"statusbar": "Thanh trạng thái"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"notSet": "未设置",
	"statusbar": "状态栏"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"notSet": "未設定",
	"statusbar": "狀態列"
}
</locale>
