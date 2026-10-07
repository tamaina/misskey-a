<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div>
			<MkResult v-if="antennas.length === 0" type="empty"/>

			<MkButton type="routerLink" to="/my/antennas/create" primary :class="$style.add"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>

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
import { onActivated, computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';

const antennas = computed(() => antennasCache.value.value ?? []);

function _fetch_() {
	antennasCache.fetch();
}

_fetch_();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: $locale.value.sfc.reload,
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
	"add": "إضافة",
	"reload": "انعش",
	"manageAntennas": "إدارة الهوائيات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"add": "Afegir",
	"reload": "Actualitzar",
	"manageAntennas": "Gestiona les antenes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"add": "Přidat",
	"reload": "Aktualizovat",
	"manageAntennas": "Spravovat Antény"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"add": "Add",
	"reload": "Refresh",
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"add": "Hinzufügen",
	"reload": "Aktualisieren",
	"manageAntennas": "Antennen verwalten"
}
</locale>

<locale locale="en-US" lang="json">
{
	"add": "Add",
	"reload": "Refresh",
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"add": "Agregar",
	"reload": "Recargar",
	"manageAntennas": "Administrar antenas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"add": "Ajouter",
	"reload": "Rafraîchir",
	"manageAntennas": "Gestion des antennes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"add": "Tambahkan",
	"reload": "Muat ulang",
	"manageAntennas": "Pengelola Antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"add": "Aggiungi",
	"reload": "Ricarica",
	"manageAntennas": "Gestore delle antenne"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"add": "追加",
	"reload": "リロード",
	"manageAntennas": "アンテナの管理"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"add": "増やす",
	"reload": "リロード",
	"manageAntennas": "アンテナいじる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"add": "Add",
	"reload": "Refresh",
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"add": "Add",
	"reload": "Refresh",
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"add": "추가",
	"reload": "새로고침",
	"manageAntennas": "안테나 관리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"add": "Toevoegen",
	"reload": "Verversen",
	"manageAntennas": "Antennes beheren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"add": "Legg til",
	"reload": "Refresh",
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"add": "Dodaj",
	"reload": "Odśwież",
	"manageAntennas": "Zarządzaj Antenami"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"add": "Adicionar",
	"reload": "Recarregar",
	"manageAntennas": "Gestão de antena"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"add": "Добавить",
	"reload": "Перезагрузить",
	"manageAntennas": "Настройки антенн"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"add": "Pridať",
	"reload": "Obnoviť",
	"manageAntennas": "Spravovať antény"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"add": "เพิ่ม",
	"reload": "รีโหลด",
	"manageAntennas": "จัดการเสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"add": "Ekle",
	"reload": "Yenile",
	"manageAntennas": "Antenleri Yönet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"add": "Add",
	"reload": "Refresh",
	"manageAntennas": "Manage Antennas"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"add": "Додати",
	"reload": "Оновити",
	"manageAntennas": "Налаштування антен"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"add": "Thêm",
	"reload": "Tải lại",
	"manageAntennas": "Quản lý trạm phát sóng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"add": "添加",
	"reload": "刷新",
	"manageAntennas": "天线管理"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"add": "新增",
	"reload": "重新整理",
	"manageAntennas": "管理天線"
}
</locale>
