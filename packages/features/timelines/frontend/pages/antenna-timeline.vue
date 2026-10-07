<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div :class="$style.tl">
			<MkStreamingNotesTimeline
				ref="tlEl" :key="antennaId"
				src="antenna"
				:antenna="antennaId"
				:sound="true"
			/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef, provide } from 'vue';
import * as Misskey from 'misskey-js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const props = defineProps<{
	antennaId: string;
}>();

const antenna = ref<Misskey.entities.Antenna | null>(null);
const tlEl = useTemplateRef('tlEl');

provide('currentAntenna', antenna);

function settings() {
	router.push('/my/antennas/:antennaId', {
		params: {
			antennaId: props.antennaId,
		},
	});
}

watch(() => props.antennaId, async () => {
	antenna.value = await misskeyApi('antennas/show', {
		antennaId: props.antennaId,
	});
}, { immediate: true });

const headerActions = computed(() => antenna.value ? [{
	icon: 'ti ti-settings',
	text: $locale.value.sfc.settings,
	handler: settings,
}] : []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: antenna.value ? antenna.value.name : $locale.value.sfc.antennas,
	icon: 'ti ti-antenna',
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
	"antennas": "الهوائيات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"settings": "Preferències",
	"antennas": "Antena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"settings": "Nastavení",
	"antennas": "Antény"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"settings": "Settings",
	"antennas": "Antennas"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"settings": "Einstellungen",
	"antennas": "Antennen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"settings": "Settings",
	"antennas": "Antennas"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"settings": "Configuración",
	"antennas": "Antenas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"settings": "Paramètres",
	"antennas": "Antennes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"settings": "Pengaturan",
	"antennas": "Antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"settings": "Impostazioni",
	"antennas": "Antenne"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"settings": "設定",
	"antennas": "アンテナ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"settings": "設定",
	"antennas": "アンテナ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"settings": "Iɣewwaṛen",
	"antennas": "Antennas"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"antennas": "Antennas"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"settings": "설정",
	"antennas": "안테나"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"settings": "Instellingen",
	"antennas": "Antennes"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"settings": "Innstillinger",
	"antennas": "Antenner"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"settings": "Ustawienia",
	"antennas": "Anteny"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"settings": "Configurações",
	"antennas": "Antenas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"settings": "Настройки",
	"antennas": "Антенны"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"settings": "Nastavenia",
	"antennas": "Antény"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"settings": "การตั้งค่า",
	"antennas": "เสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"settings": "Ayarlar",
	"antennas": "Antenler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"settings": "Settings",
	"antennas": "Antennas"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"settings": "Налаштування",
	"antennas": "Антени"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"settings": "Cài đặt",
	"antennas": "Trạm phát sóng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"settings": "设置",
	"antennas": "天线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"settings": "設定",
	"antennas": "天線"
}
</locale>
