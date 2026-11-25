<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div>
			<MkResult v-if="antennas.length === 0" type="empty"/>

			<MkButton type="routerLink" to="/my/antennas/create" primary :class="$style.add"><i class="ti ti-plus"></i> {{ globalLocale.env.add }}</MkButton>

			<div v-if="antennas.length > 0" class="_gaps">
				<MkA v-for="antenna in antennas" :key="antenna.id" :class="$style.antenna" :to="`/timeline/antenna/${antenna.id}`">
					<div class="name">{{ antenna.name }}</div>
				</MkA>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { onActivated, computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const antennas = computed(() => antennasCache.value.value ?? []);

function _fetch_() {
	antennasCache.fetch();
}

_fetch_();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: globalLocale.value.env.reload,
	handler: () => {
		antennasCache.delete();
		_fetch_();
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.manageAntennas,
	icon: 'ti ti-antenna',
}));

onActivated(() => {
	antennasCache.fetch();
});
</script>

<style lang="scss" module>
.add {
	margin: 0 auto 16px auto;
}

.antenna {
	display: block;
	padding: 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;

	&:hover {
		border: solid 1px var(--MI_THEME-accent);
		text-decoration: none;
	}
}

.name {
	font-weight: bold;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"manageAntennas": "إدارة الهوائيات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"manageAntennas": "Gestiona les antenes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"manageAntennas": "Spravovat Antény"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"manageAntennas": "Antennen verwalten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"manageAntennas": "Administrar antenas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"manageAntennas": "Gestion des antennes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"manageAntennas": "Pengelola Antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"manageAntennas": "Gestore delle antenne"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"manageAntennas": "アンテナの管理"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"manageAntennas": "アンテナいじる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"manageAntennas": "안테나 관리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"manageAntennas": "Antennes beheren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"manageAntennas": "Zarządzaj Antenami"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"manageAntennas": "Gestão de antena"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"manageAntennas": "Настройки антенн"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"manageAntennas": "Spravovať antény"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"manageAntennas": "จัดการเสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"manageAntennas": "Antenleri Yönet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"manageAntennas": "Налаштування антен"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"manageAntennas": "Quản lý trạm phát sóng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"manageAntennas": "天线管理"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"manageAntennas": "管理天線"
}
</locale>
