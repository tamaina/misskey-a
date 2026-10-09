<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center;">{{ $locale.sfc.followUsers }}</div>

	<MkFolder :defaultOpen="true">
		<template #label>{{ $locale.sfc.recommended }}</template>

		<MkPagination :paginator="pinnedUsersPaginator">
			<template #default="{ items }">
				<div :class="$style.users">
					<XUser v-for="item in items" :key="item.id" :user="item"/>
				</div>
			</template>
		</MkPagination>
	</MkFolder>

	<MkFolder :defaultOpen="true">
		<template #label>{{ $locale.sfc.popularUsers }}</template>

		<MkPagination :paginator="popularUsersPaginator">
			<template #default="{ items }">
				<div :class="$style.users">
					<XUser v-for="item in items" :key="item.id" :user="item"/>
				</div>
			</template>
		</MkPagination>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import XUser from '@features/users/frontend/components/MkUserSetupDialog.User.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const pinnedUsersPaginator = markRaw(new Paginator('pinned-users', {
	noPaging: true,
	limit: 10,
}));

const popularUsersPaginator = markRaw(new Paginator('users', {
	limit: 10,
	noPaging: true,
	params: {
		state: 'alive',
		origin: 'local',
		sort: '+follower',
	},
}));
</script>

<style lang="scss" module>
.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
	grid-gap: var(--MI-margin);
	justify-content: center;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "مقترح",
  "popularUsers": "المستخدمون الرائدون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "followUsers": "Prova de seguir usuaris que t'interessin per construir la teva línia de temps.",
  "recommended": "Recomanat",
  "popularUsers": "Usuaris populars"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "followUsers": "Zkuste sledovat některé uživatele, kteří vás zajímají pro vystavění časový osy.",
  "recommended": "Doporučeno",
  "popularUsers": "Populární uživatelé"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommended",
  "popularUsers": "Popular users"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "followUsers": "Folge zuerst ein paar Nutzern, um deine Chronik zu füllen.",
  "recommended": "Empfehlung",
  "popularUsers": "Beliebte Benutzer"
}
</locale>

<locale locale="en-US" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommended",
  "popularUsers": "Popular users"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "followUsers": "Comienza a seguir a usuarios que te interesen para construir tu línea de tiempo.",
  "recommended": "Recomendado",
  "popularUsers": "Usuarios populares"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommandé",
  "popularUsers": "Utilisateur·rice·s populaires"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "followUsers": "Coba ikuti beberapa pengguna yang menarik bagimu untuk membangun lini masa akunmu.",
  "recommended": "Disarankan",
  "popularUsers": "Pengguna populer"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "followUsers": "Per comporre la tua Timeline Home (personale) segui i profili delle persone che ti interessano.",
  "recommended": "Consigliato",
  "popularUsers": "Profili popolari"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "followUsers": "タイムラインを構築するため、気になるユーザーをフォローしてみましょう。",
  "recommended": "推奨",
  "popularUsers": "人気のユーザー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "followUsers": "タイムラインを構築するために、気になるユーザーをフォローしてみ。",
  "recommended": "推奨",
  "popularUsers": "人気のユーザー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommended",
  "popularUsers": "Popular users"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommended",
  "popularUsers": "Popular users"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "followUsers": "관심사가 맞는 유저를 팔로우하여 타임라인을 가꾸어 봅시다.",
  "recommended": "추천",
  "popularUsers": "인기 유저"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommended",
  "popularUsers": "Populaire gebruikers"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Anbefalt",
  "popularUsers": "Populære brukere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Zalecane",
  "popularUsers": "Popularni użytkownicy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "followUsers": "Siga usuários que lhe interessam para criar a sua linha do tempo.",
  "recommended": "Recomendado",
  "popularUsers": "Utilizadores populares"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "followUsers": "Попробуйте подписаться на людей которые вас интересуют, что бы составить вашу ленту.",
  "recommended": "Рекомендуем",
  "popularUsers": "Популярные пользователи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Odporúčané",
  "popularUsers": "Populárni používatelia"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "followUsers": "ลองติดตามผู้ใช้ที่สนใจเพื่อสร้างไทม์ไลน์ดูสิ",
  "recommended": "แนะนำ",
  "popularUsers": "ผู้ใช้ที่เป็นที่นิยม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "followUsers": "İlgilendiğiniz bazı kullanıcıları takip ederek zaman akışını oluşturmaya çalış.",
  "recommended": "Önerilen",
  "popularUsers": "Popüler kullanıcılar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "followUsers": "Try following some users that interest you to build up your timeline.",
  "recommended": "Recommended",
  "popularUsers": "Popular users"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "followUsers": "Спробуйте підписатися на інших користувачів, щоб створити свою хронологію.",
  "recommended": "Рекомендоване",
  "popularUsers": "Популярні користувачі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "followUsers": "Thử theo dõi một vài người mà bạn có thể thích để xây dựng dòng thời gian của mình.",
  "recommended": "Được đề xuất",
  "popularUsers": "Những người nổi tiếng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "followUsers": "为了建立属于你自己的时间线，试着去关注你感兴趣的用户吧。",
  "recommended": "推荐",
  "popularUsers": "热门用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "followUsers": "為了構築時間軸，試著追隨您感興趣的使用者吧。",
  "recommended": "推薦",
  "popularUsers": "熱門使用者"
}
</locale>
