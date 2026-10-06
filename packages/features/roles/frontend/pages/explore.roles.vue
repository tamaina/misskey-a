<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 700px;">
	<div v-if="roles != null && roles.length > 0" class="_gaps_s">
		<MkRolePreview v-for="role in roles" :key="role.id" :role="role" :forModeration="false"/>
	</div>
	<MkLoading v-else-if="loading" />
	<MkResult v-else type="empty" :text="$locale.sfc.noRole"/>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const roles = ref<Misskey.entities.Role[] | null>(null);
const loading = ref(true);

misskeyApi('roles/list').then(res => {
	roles.value = res.filter(x => x.target === 'manual').sort((a, b) => b.displayOrder - a.displayOrder);
}).finally(() => {
	loading.value = false;
});
</script>

<locale locale="ar-SA" lang="json">
{
  "noRole": "لم يُعثر على دور"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "noRole": "No s'han trobat rols"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "noRole": "Role nenalezena"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "noRole": "Rolle nicht gefunden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "noRole": "Rol no encontrado"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "noRole": "Aucun rôle"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "noRole": "Peran tidak temukan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "noRole": "Ruolo non trovato"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "noRole": "ロールはありません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "noRole": "ロールはありまへん"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "noRole": "역할이 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "noRole": "Rola nie znaleziona"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "noRole": "Nenhum cargo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "noRole": "Нет роли"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "noRole": "ไม่พบบทบาท"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "noRole": "Rol bulunamadı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "noRole": "Role not found"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "noRole": "Роль не знайдено"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "noRole": "Bạn chưa được cấp quyền."
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "noRole": "角色不存在"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "noRole": "沒有角色"
}
</locale>
