<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="tab === 'featured'">
		<XFeatured/>
	</div>
	<div v-else-if="tab === 'users'">
		<XUsers/>
	</div>
	<div v-else-if="tab === 'roles'">
		<XRoles/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef } from 'vue';
import XFeatured from '@features/discovery/frontend/pages/explore.featured.vue';
import XUsers from '@features/discovery/frontend/pages/explore.users.vue';
import XRoles from '@features/roles/frontend/pages/explore.roles.vue';
import { definePage } from '@features/navigation/frontend/page.js';

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'featured',
});

const tab = ref(props.initialTab);

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'featured',
	icon: 'ti ti-bolt',
	title: $locale.value.sfc.featured,
}, {
	key: 'users',
	icon: 'ti ti-users',
	title: $locale.value.sfc.users,
}, {
	key: 'roles',
	icon: 'ti ti-badges',
	title: $locale.value.sfc.roles,
}]);

definePage(() => ({
	title: $locale.value.sfc.explore,
	icon: 'ti ti-hash',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"featured": "المتداولة",
	"users": "المستخدمون",
	"roles": "الأدوار",
	"explore": "استكشاف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"featured": "Destacat",
	"users": "Usuaris",
	"roles": "Rols",
	"explore": "Explora"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"featured": "Oblíbené poznámky",
	"users": "Uživatelé",
	"roles": "Role",
	"explore": "Objevovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"featured": "Featured",
	"users": "Users",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"featured": "Beliebt",
	"users": "Benutzer",
	"roles": "Rollen",
	"explore": "Erkunden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"featured": "Featured",
	"users": "Users",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"featured": "Destacados",
	"users": "Usuarios",
	"roles": "Roles",
	"explore": "Explorar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"featured": "Tendances",
	"users": "Utilisateur·rice·s",
	"roles": "Rôles",
	"explore": "Découvrir"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"featured": "Sorotan",
	"users": "Pengguna",
	"roles": "Peran",
	"explore": "Jelajahi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"featured": "In evidenza",
	"users": "Profili",
	"roles": "Ruoli",
	"explore": "Esplora"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"featured": "ハイライト",
	"users": "ユーザー",
	"roles": "ロール",
	"explore": "みつける"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"featured": "ハイライト",
	"users": "ユーザー",
	"roles": "ロール",
	"explore": "みつける"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"featured": "Featured",
	"users": "Users",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"featured": "Featured",
	"users": "ಬಳಕೆದಾರ",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"featured": "유행",
	"users": "유저",
	"roles": "역할",
	"explore": "둘러보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"featured": "Uitgelicht",
	"users": "Gebruikers",
	"roles": "Roles",
	"explore": "Verkennen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"featured": "Featured",
	"users": "Brukere",
	"roles": "Roller",
	"explore": "Utforsk"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"featured": "Wyróżnione",
	"users": "Użytkownicy",
	"roles": "Role",
	"explore": "Eksploruj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"featured": "Destaques",
	"users": "Usuários",
	"roles": "Cargos",
	"explore": "Explorar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"featured": "Горячее",
	"users": "Пользователи",
	"roles": "Роли",
	"explore": "Обзор"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"featured": "Obľúbené poznámky",
	"users": "Používatelia",
	"roles": "Roles",
	"explore": "Objavovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"featured": "ไฮไลท์",
	"users": "ผู้ใช้",
	"roles": "บทบาท",
	"explore": "สำรวจ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"featured": "Öne çıkan",
	"users": "Kullanıcılar",
	"roles": "Roller",
	"explore": "Keşfet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"featured": "Featured",
	"users": "Users",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"featured": "Популярні",
	"users": "Користувачі",
	"roles": "Ролі",
	"explore": "Огляд"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"featured": "Nổi bật",
	"users": "Người dùng",
	"roles": "Vai trò",
	"explore": "Khám phá"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"featured": "热门",
	"users": "用户",
	"roles": "角色",
	"explore": "发现"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"featured": "精選",
	"users": "使用者",
	"roles": "角色",
	"explore": "探索"
}
</locale>
