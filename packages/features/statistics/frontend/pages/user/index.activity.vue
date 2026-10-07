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
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkChart from '@features/statistics/frontend/components/MkChart.vue';
import * as os from '@features/ui/frontend/os.js';

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	limit?: number;
}>(), {
	limit: 50,
});

const chartSrc = ref<'per-user-notes' | 'per-user-pv'>('per-user-notes');

function showMenu(ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.notes,
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
		text: $locale.value.sfc.following,
		action: () => {
			chartSrc = 'per-user-following';
		}
	}, {
		text: $locale.value.sfc.followers,
		action: () => {
			chartSrc = 'per-user-followers';
		}
	}*/], ev.currentTarget ?? ev.target);
}
</script>

<locale locale="ar-SA" lang="json">
{
	"activity": "النشاط",
	"notes": "الملاحظات",
	"numberOfProfileView": "مشاهدات الملف الشخصي",
	"following": "المتابَعون",
	"followers": "المتابِعون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"activity": "Activitat",
	"notes": "Notes",
	"numberOfProfileView": "Visualitzacions del perfil",
	"following": "Segueixes ",
	"followers": "Seguidors"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"activity": "Aktivita",
	"notes": "Poznámky",
	"numberOfProfileView": "Počet zobrazení profilu",
	"following": "Sledovaní",
	"followers": "Sledující"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"activity": "Activity",
	"notes": "Notes",
	"numberOfProfileView": "Profile views",
	"following": "Following",
	"followers": "Followers"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"activity": "Aktivität",
	"notes": "Notizen",
	"numberOfProfileView": "Profilaufrufe",
	"following": "Folgt",
	"followers": "Gefolgt von"
}
</locale>

<locale locale="en-US" lang="json">
{
	"activity": "Activity",
	"notes": "Notes",
	"numberOfProfileView": "Profile views",
	"following": "Following",
	"followers": "Followers"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"activity": "Actividad",
	"notes": "Notas",
	"numberOfProfileView": "Número de vistas de perfil",
	"following": "Siguiendo",
	"followers": "Seguidores"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"activity": "Activité",
	"notes": "Notes",
	"numberOfProfileView": "Nombre de vues du profil",
	"following": "Abonnements",
	"followers": "Abonné·e·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"activity": "Aktivitas",
	"notes": "Catatan",
	"numberOfProfileView": "tayang profil",
	"following": "Ikuti",
	"followers": "Pengikut"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"activity": "Attività",
	"notes": "Note",
	"numberOfProfileView": "Visualizzazioni profilo",
	"following": "Following",
	"followers": "Follower"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"activity": "アクティビティ",
	"notes": "ノート",
	"numberOfProfileView": "プロフィール表示回数",
	"following": "フォロー",
	"followers": "フォロワー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"activity": "アクティビティ",
	"notes": "ノート",
	"numberOfProfileView": "プロフィール表示回数",
	"following": "フォロー",
	"followers": "フォロワー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"activity": "Activity",
	"notes": "Notes",
	"numberOfProfileView": "Profile views",
	"following": "Ig ṭṭafaṛ",
	"followers": "Imeḍfaṛen"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"activity": "Activity",
	"notes": "Notes",
	"numberOfProfileView": "Profile views",
	"following": "Following",
	"followers": "Followers"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"activity": "활동",
	"notes": "노트",
	"numberOfProfileView": "프로필 뷰 수",
	"following": "팔로잉",
	"followers": "팔로워"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"activity": "Activiteit",
	"notes": "Notities",
	"numberOfProfileView": "Profile views",
	"following": "Volgend",
	"followers": "Volgers"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"activity": "Aktivitet",
	"notes": "Notes",
	"numberOfProfileView": "Profile views",
	"following": "Følger",
	"followers": "Følgere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"activity": "Aktywność",
	"notes": "Wpisy",
	"numberOfProfileView": "Wyświetlenia profilu",
	"following": "Obserwowani",
	"followers": "Obserwujący"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"activity": "atividade",
	"notes": "Posts",
	"numberOfProfileView": "Visualizações do perfil",
	"following": "Seguindo",
	"followers": "Seguidores"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"activity": "Активность",
	"notes": "Заметки",
	"numberOfProfileView": "Количество профилей для просмотра",
	"following": "Подписки",
	"followers": "Подписчики"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"activity": "Aktivita",
	"notes": "Poznámky",
	"numberOfProfileView": "Profile views",
	"following": "Sledujete",
	"followers": "Sledujúci"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"activity": "กิจกรรม",
	"notes": " โน้ต",
	"numberOfProfileView": "มุมมองโปรไฟล์",
	"following": "กำลังติดตาม",
	"followers": "ผู้ติดตาม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"activity": "Etkinlik",
	"notes": "Notlar",
	"numberOfProfileView": "Profil görüntülemeleri",
	"following": "Takip",
	"followers": "Takipçi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"activity": "Activity",
	"notes": "Notes",
	"numberOfProfileView": "Profile views",
	"following": "Following",
	"followers": "Followers"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"activity": "Активність",
	"notes": "Записи",
	"numberOfProfileView": "Перегляди профілю",
	"following": "Підписки",
	"followers": "Підписники"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"activity": "Hoạt động",
	"notes": "Bài Viết",
	"numberOfProfileView": "Số lần mở hồ sơ",
	"following": "Đang theo dõi",
	"followers": "Người theo dõi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"activity": "活动",
	"notes": "帖子",
	"numberOfProfileView": "个人资料展示次数",
	"following": "关注中",
	"followers": "关注者"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"activity": "動態",
	"notes": "貼文",
	"numberOfProfileView": "個人檔案檢視次數",
	"following": "追隨中",
	"followers": "追隨者"
}
</locale>
