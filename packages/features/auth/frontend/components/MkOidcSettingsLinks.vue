<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_s">
	<MkA class="_link" to="/settings/oidc">{{ $locale.sfc.identities }}</MkA>
	<MkA v-if="iAmAdmin" class="_link" to="/admin/oidc">{{ $locale.sfc.providers }}</MkA>
</div>
</template>
<script lang="ts" setup>
import { iAmAdmin } from '../i.js';
</script>
<locale locale="ja-JP" lang="json">
{ "identities": "外部ログインの連携", "providers": "外部ログインのプロバイダー設定" }
</locale>
