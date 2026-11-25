<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer>
	<template #icon><i class="ti ti-chart-line"></i></template>
	<template #header>{{ $locale.sfc.activity }}</template>
	<template #func="{ buttonStyleClass }">
		<button class="_button" :class="buttonStyleClass" @click="showMenu">
			<i class="ti ti-dots"></i>
		</button>
	</template>

	<div style="padding: 8px;">
		<MkChart :src="chartSrc" :args="{ user, withoutAll: true }" span="day" :limit="limit" :bar="true" :stacked="true" :detailed="false" :aspectRatio="5"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkChart from '@features/statistics/frontend/components/MkChart.vue';
import * as os from '@features/ui/frontend/os.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	limit?: number;
}>(), {
	limit: 50,
});

const chartSrc = ref<'per-user-notes' | 'per-user-pv'>('per-user-notes');

function showMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: globalLocale.value.env.notes,
		active: chartSrc.value === 'per-user-notes',
		action: () => {
			chartSrc.value = 'per-user-notes';
		},
	}, {
		text: $locale.value.sfc.numberOfProfileView,
		active: chartSrc.value === 'per-user-pv',
		action: () => {
			chartSrc.value = 'per-user-pv';
		},
	}, /*, {
		text: globalLocale.value.env.following,
		action: () => {
			chartSrc = 'per-user-following';
		}
	}, {
		text: globalLocale.value.env.followers,
		action: () => {
			chartSrc = 'per-user-followers';
		}
	}*/], ev.currentTarget ?? ev.target);
}
</script>

<locale locale="ar-SA" lang="json">
{
	"activity": "النشاط",
	"numberOfProfileView": "مشاهدات الملف الشخصي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"activity": "Activitat",
	"numberOfProfileView": "Visualitzacions del perfil"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"activity": "Aktivita",
	"numberOfProfileView": "Počet zobrazení profilu"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"activity": "Activity",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"activity": "Aktivität",
	"numberOfProfileView": "Profilaufrufe"
}
</locale>

<locale locale="en-US" lang="json">
{
	"activity": "Activity",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"activity": "Actividad",
	"numberOfProfileView": "Número de vistas de perfil"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"activity": "Activité",
	"numberOfProfileView": "Nombre de vues du profil"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"activity": "Aktivitas",
	"numberOfProfileView": "tayang profil"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"activity": "Attività",
	"numberOfProfileView": "Visualizzazioni profilo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"activity": "アクティビティ",
	"numberOfProfileView": "プロフィール表示回数"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"activity": "アクティビティ",
	"numberOfProfileView": "プロフィール表示回数"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"activity": "Activity",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"activity": "Activity",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"activity": "활동",
	"numberOfProfileView": "프로필 뷰 수"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"activity": "Activiteit",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"activity": "Aktivitet",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"activity": "Aktywność",
	"numberOfProfileView": "Wyświetlenia profilu"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"activity": "atividade",
	"numberOfProfileView": "Visualizações do perfil"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"activity": "Активность",
	"numberOfProfileView": "Количество профилей для просмотра"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"activity": "Aktivita",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"activity": "กิจกรรม",
	"numberOfProfileView": "มุมมองโปรไฟล์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"activity": "Etkinlik",
	"numberOfProfileView": "Profil görüntülemeleri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"activity": "Activity",
	"numberOfProfileView": "Profile views"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"activity": "Активність",
	"numberOfProfileView": "Перегляди профілю"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"activity": "Hoạt động",
	"numberOfProfileView": "Số lần mở hồ sơ"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"activity": "活动",
	"numberOfProfileView": "个人资料展示次数"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"activity": "動態",
	"numberOfProfileView": "個人檔案檢視次數"
}
</locale>
