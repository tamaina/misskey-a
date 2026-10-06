<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="user" :class="$style.root">
	<i class="ti ti-plane-departure" style="margin-right: 8px;"></i>
	{{ $locale.sfc.accountMoved }}
	<MkMention :class="$style.link" :username="user.username" :host="user.host ?? localHost"/>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkMention from '@features/users/frontend/components/MkMention.vue';
import { host as localHost } from '@@/js/config.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const user = ref<Misskey.entities.UserLite>();

const props = defineProps<{
	movedTo: string; // user id
}>();

misskeyApi('users/show', { userId: props.movedTo }).then(u => user.value = u);
</script>

<style lang="scss" module>
.root {
	padding: 16px;
	font-size: 90%;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-error);
	border-radius: var(--MI-radius);
}

.link {
	margin-left: 4px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "accountMoved": "نقل هذا المستخدم حسابه:"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "accountMoved": "Aquest usuari té un compte nou:"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "accountMoved": "Tenhle uživatel se přesunul na nový účet:"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "accountMoved": "Dieser Benutzer ist zu einem neuen Konto migriert:"
}
</locale>

<locale locale="en-US" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "accountMoved": "Este usuario se movió a una nueva cuenta:"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "accountMoved": "Cet·te utilisateur·rice a migré son compte vers :"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "accountMoved": "Pengguna ini telah berpindah ke akun baru:"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "accountMoved": "Questo profilo ha migrato altrove:"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "accountMoved": "このユーザーは新しいアカウントに移行しました："
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "accountMoved": "このユーザーはさらのアカウントに引っ越したで："
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "accountMoved": "이 유저는 다음 계정으로 이사했습니다:"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "accountMoved": "Esse usuário moveu-se para uma nova conta:"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "accountMoved": "Учётная запись перенесена"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "accountMoved": "ผู้ใช้รายนี้ได้ย้ายไปยังบัญชีใหม่แล้ว:"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "accountMoved": "Bu kullanıcı yeni bir hesaba taşındı:"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "accountMoved": "This user has moved to a new account:"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "accountMoved": "Цей користувач перейшов на новий акаунт:"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "accountMoved": "Người dùng này đã chuyển sang một tài khoản mới:"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "accountMoved": "此用户已迁移账户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "accountMoved": "這個使用者已遷移至新的帳戶："
}
</locale>
