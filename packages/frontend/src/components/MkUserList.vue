<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :paginator="paginator">
	<template #empty><MkResult type="empty" :text="$locale.sfc.noUsers"/></template>

	<template #default="{ items }">
		<div :class="$style.root">
			<MkUserInfo v-for="item in items" :key="item.id" :user="extractor(item)"/>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="P extends IPaginator">
import * as Misskey from 'misskey-js';
import type { IPaginator, ExtractorFunction } from '@features/ui/frontend/utility/paginator.js';
import MkUserInfo from '@features/users/frontend/components/MkUserInfo.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';

const props = withDefaults(defineProps<{
	paginator: P;
	noGap?: boolean;
	extractor?: ExtractorFunction<P, Misskey.entities.UserDetailed>;
}>(), {
	extractor: (item: any) => item as Misskey.entities.UserDetailed,
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "noUsers": "ليس هناك مستخدمون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "noUsers": "No hi ha usuaris"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "noUsers": "Žádní uživatelé"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "noUsers": "There are no users"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "noUsers": "Keine Benutzer gefunden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "noUsers": "There are no users"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "noUsers": "No hay usuarios"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "noUsers": "Il n’y a pas d’utilisateur·rice·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "noUsers": "Tidak ada pengguna"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "noUsers": "Non ci sono profili"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "noUsers": "ユーザーはいません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "noUsers": "ユーザーはおらん"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "noUsers": "There are no users"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "noUsers": "There are no users"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "noUsers": "아무도 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "noUsers": "Er zijn geen gebruikers."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "noUsers": "Det er ingen brukere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "noUsers": "Brak użytkowników"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "noUsers": "Sem usuários"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "noUsers": "Нет ни одного пользователя"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "noUsers": "Žiadni používatelia"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "noUsers": "ไม่พบผู้ใช้งาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "noUsers": "Kullanıcı yok"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "noUsers": "There are no users"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "noUsers": "Немає користувачів"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "noUsers": "Chưa có ai"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "noUsers": "无用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "noUsers": "沒有任何使用者"
}
</locale>
