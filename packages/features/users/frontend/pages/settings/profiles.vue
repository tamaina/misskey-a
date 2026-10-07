<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/profiles" :label="$locale.sfc.manageProfiles" :keywords="['profile', 'settings', 'preferences', 'manage']" icon="ti ti-settings-cog">
	<div class="_gaps">
		<MkFolder v-for="backup in backups">
			<template #label>{{ backup.name }}</template>
			<MkButton danger @click="del(backup)">{{ $locale.sfc.delete }}</MkButton>
		</MkFolder>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { deleteCloudBackup, listCloudBackups } from '@features/preferences/frontend/state/utility.js';

const backups = await listCloudBackups();

function del(backup: { name: string }): void {
	deleteCloudBackup(backup.name);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.manageProfiles,
	icon: 'ti ti-settings-cog',
}));
</script>

<style lang="scss" module>
</style>

<locale locale="ar-SA" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"manageProfiles": "Gestionar perfils",
	"delete": "Elimina"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"manageProfiles": "Profile verwalten",
	"delete": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"manageProfiles": "Administrar perfiles",
	"delete": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"manageProfiles": "Kelola Profil",
	"delete": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"manageProfiles": "Gestione profili",
	"delete": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"manageProfiles": "プロファイルの管理",
	"delete": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"manageProfiles": "プロファイルの管理",
	"delete": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"manageProfiles": "프로파일 관리",
	"delete": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"manageProfiles": "Gerenciar Perfis",
	"delete": "Excluir"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"manageProfiles": "จัดการโปรไฟล์",
	"delete": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"manageProfiles": "Profilleri Yönet",
	"delete": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"manageProfiles": "Керувати профілями",
	"delete": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"manageProfiles": "Manage Profiles",
	"delete": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"manageProfiles": "管理配置文件",
	"delete": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"manageProfiles": "管理個人檔案",
	"delete": "刪除"
}
</locale>
