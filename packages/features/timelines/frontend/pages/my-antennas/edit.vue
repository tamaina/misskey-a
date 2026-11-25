<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<MkAntennaEditor v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();

const antenna = ref<Misskey.entities.Antenna | null>(null);

const props = defineProps<{
	antennaId: string
}>();

function onAntennaUpdated() {
	antennasCache.delete();
	router.push('/my/antennas');
}

misskeyApi('antennas/show', { antennaId: props.antennaId }).then((antennaResponse) => {
	antenna.value = antennaResponse;
});

const headerActions = computed(() => antenna.value ? [{
	icon: 'ti ti-timeline',
	text: globalLocale.value.env.timeline,
	handler: () => {
		router.push('/timeline/antenna/:antennaId', {
			params: {
				antennaId: antenna.value!.id,
			},
		});
	},
}] : []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.editAntenna,
	icon: 'ti ti-antenna',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"editAntenna": "عدّل الهوائي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"editAntenna": "Modificar antena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"editAntenna": "Upravit anténu"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"editAntenna": "Antenne bearbeiten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"editAntenna": "Editar antena"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"editAntenna": "Modifier l'antenne"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"editAntenna": "Sunting antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"editAntenna": "Modifica Antenna"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"editAntenna": "アンテナを編集"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"editAntenna": "アンテナいじる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"editAntenna": "안테나 편집"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"editAntenna": "Antenne bewerken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"editAntenna": "Edytuj antenę"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"editAntenna": "Editar antena"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"editAntenna": "Редактировать антенну"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"editAntenna": "แก้ไขเสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"editAntenna": "Anteni düzenle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"editAntenna": "Редагувати антену"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"editAntenna": "Chỉnh sửa Ăngten"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"editAntenna": "编辑天线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"editAntenna": "編輯天線"
}
</locale>
