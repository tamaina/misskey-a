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
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import { useRouter } from '@features/navigation/frontend/router.js';

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
	text: $locale.value.sfc.timeline,
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
	"timeline": "الخيط الزمني",
	"editAntenna": "عدّل الهوائي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"timeline": "Línia de temps",
	"editAntenna": "Modificar antena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"timeline": "Časová osa",
	"editAntenna": "Upravit anténu"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"timeline": "Timeline",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"timeline": "Chronik",
	"editAntenna": "Antenne bearbeiten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"timeline": "Timeline",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"timeline": "Línea de tiempo",
	"editAntenna": "Editar antena"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"timeline": "Fil",
	"editAntenna": "Modifier l'antenne"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"timeline": "Lini masa",
	"editAntenna": "Sunting antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"timeline": "Timeline",
	"editAntenna": "Modifica Antenna"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"timeline": "タイムライン",
	"editAntenna": "アンテナを編集"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"timeline": "タイムライン",
	"editAntenna": "アンテナいじる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"timeline": "Timeline",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"timeline": "ಸಮಯಸಾಲು",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"timeline": "타임라인",
	"editAntenna": "안테나 편집"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"timeline": "Tijdlijn",
	"editAntenna": "Antenne bewerken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"timeline": "Tidslinje",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"timeline": "Oś czasu",
	"editAntenna": "Edytuj antenę"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"timeline": "Linha do tempo",
	"editAntenna": "Editar antena"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"timeline": "Лента",
	"editAntenna": "Редактировать антенну"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"timeline": "Časová os",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"timeline": "ไทม์ไลน์",
	"editAntenna": "แก้ไขเสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"timeline": "Pano",
	"editAntenna": "Anteni düzenle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"timeline": "Timeline",
	"editAntenna": "Edit antenna"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"timeline": "Стрічка",
	"editAntenna": "Редагувати антену"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"timeline": "Bảng tin",
	"editAntenna": "Chỉnh sửa Ăngten"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"timeline": "时间线",
	"editAntenna": "编辑天线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"timeline": "時間軸",
	"editAntenna": "編輯天線"
}
</locale>
