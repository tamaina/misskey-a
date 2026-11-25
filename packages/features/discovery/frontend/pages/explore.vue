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
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, watch, ref, useTemplateRef } from 'vue';
import XFeatured from '@features/discovery/frontend/pages/explore.featured.vue';
import XUsers from '@features/discovery/frontend/pages/explore.users.vue';
import XRoles from '@features/roles/frontend/pages/explore.roles.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	title: globalLocale.value.env.users,
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
	"roles": "الأدوار",
	"explore": "استكشاف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"featured": "Destacat",
	"roles": "Rols",
	"explore": "Explora"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"featured": "Oblíbené poznámky",
	"roles": "Role",
	"explore": "Objevovat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"featured": "Featured",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"featured": "Beliebt",
	"roles": "Rollen",
	"explore": "Erkunden"
}
</locale>

<locale locale="en-US" lang="json">
{
	"featured": "Featured",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"featured": "Destacados",
	"roles": "Roles",
	"explore": "Explorar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"featured": "Tendances",
	"roles": "Rôles",
	"explore": "Découvrir"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"featured": "Sorotan",
	"roles": "Peran",
	"explore": "Jelajahi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"featured": "In evidenza",
	"roles": "Ruoli",
	"explore": "Esplora"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"featured": "ハイライト",
	"roles": "ロール",
	"explore": "みつける"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"featured": "ハイライト",
	"roles": "ロール",
	"explore": "みつける"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"featured": "Featured",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"featured": "Featured",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"featured": "유행",
	"roles": "역할",
	"explore": "둘러보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"featured": "Uitgelicht",
	"roles": "Roles",
	"explore": "Verkennen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"featured": "Featured",
	"roles": "Roller",
	"explore": "Utforsk"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"featured": "Wyróżnione",
	"roles": "Role",
	"explore": "Eksploruj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"featured": "Destaques",
	"roles": "Cargos",
	"explore": "Explorar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"featured": "Горячее",
	"roles": "Роли",
	"explore": "Обзор"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"featured": "Obľúbené poznámky",
	"roles": "Roles",
	"explore": "Objavovať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"featured": "ไฮไลท์",
	"roles": "บทบาท",
	"explore": "สำรวจ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"featured": "Öne çıkan",
	"roles": "Roller",
	"explore": "Keşfet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"featured": "Featured",
	"roles": "Roles",
	"explore": "Explore"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"featured": "Популярні",
	"roles": "Ролі",
	"explore": "Огляд"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"featured": "Nổi bật",
	"roles": "Vai trò",
	"explore": "Khám phá"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"featured": "热门",
	"roles": "角色",
	"explore": "发现"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"featured": "精選",
	"roles": "角色",
	"explore": "探索"
}
</locale>
