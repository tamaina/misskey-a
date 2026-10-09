<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div :class="$style.tl">
			<MkStreamingNotesTimeline
				ref="tlEl" :key="listId"
				src="list"
				:list="listId"
				:sound="true"
			/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const props = defineProps<{
	listId: string;
}>();

const list = ref<Misskey.entities.UserList | null>(null);

watch(() => props.listId, async () => {
	list.value = await misskeyApi('users/lists/show', {
		listId: props.listId,
	});
}, { immediate: true });

function settings() {
	router.push('/my/lists/:listId', {
		params: {
			listId: props.listId,
		}
	});
}

const headerActions = computed(() => list.value ? [{
	icon: 'ti ti-settings',
	text: $locale.value.sfc.settings,
	handler: settings,
}] : []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: list.value ? list.value.name : $locale.value.sfc.lists,
	icon: 'ti ti-list',
}));
</script>

<style lang="scss" module>
.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"settings": "الاعدادات",
	"lists": "القوائم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"settings": "Preferències",
	"lists": "Llistes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"settings": "Nastavení",
	"lists": "Seznamy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"settings": "Settings",
	"lists": "Lists"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"settings": "Einstellungen",
	"lists": "Listen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"settings": "Settings",
	"lists": "Lists"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"settings": "Configuración",
	"lists": "Listas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"settings": "Paramètres",
	"lists": "Listes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"settings": "Pengaturan",
	"lists": "Daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"settings": "Impostazioni",
	"lists": "Liste"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"settings": "設定",
	"lists": "リスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"settings": "設定",
	"lists": "リスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"settings": "Iɣewwaṛen",
	"lists": "Tibdarin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"lists": "Lists"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"settings": "설정",
	"lists": "리스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"settings": "Instellingen",
	"lists": "Lijsten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"settings": "Innstillinger",
	"lists": "Lister"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"settings": "Ustawienia",
	"lists": "Listy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"settings": "Configurações",
	"lists": "Listas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"settings": "Настройки",
	"lists": "Списки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"settings": "Nastavenia",
	"lists": "Zoznamy"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"settings": "การตั้งค่า",
	"lists": "รายชื่อ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"settings": "Ayarlar",
	"lists": "Listeler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"settings": "Settings",
	"lists": "Lists"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"settings": "Налаштування",
	"lists": "Списки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"settings": "Cài đặt",
	"lists": "Danh sách"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"settings": "设置",
	"lists": "列表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"settings": "設定",
	"lists": "清單"
}
</locale>
