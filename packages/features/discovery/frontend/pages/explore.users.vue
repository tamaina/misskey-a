<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1200px;">
	<MkTab
		v-if="instance.federation !== 'none'"
		v-model="origin"
		:tabs="[
			{ key: 'local', label: $locale.sfc.local },
			{ key: 'remote', label: $locale.sfc.remote },
		]"
		style="margin-bottom: var(--MI-margin);"
	>
	</MkTab>
	<div v-if="origin === 'local'">
		<template v-if="tag == null">
			<MkFoldableSection class="_margin" persistKey="explore-pinned-users">
				<template #header><i class="ti ti-bookmark ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.pinnedUsers }}</template>
				<MkUserList :paginator="pinnedUsersPaginator"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persistKey="explore-popular-users">
				<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.popularUsers }}</template>
				<MkUserList :paginator="popularUsersPaginator"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persistKey="explore-recently-updated-users">
				<template #header><i class="ti ti-message ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.recentlyUpdatedUsers }}</template>
				<MkUserList :paginator="recentlyUpdatedUsersPaginator"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persistKey="explore-recently-registered-users">
				<template #header><i class="ti ti-plus ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.recentlyRegisteredUsers }}</template>
				<MkUserList :paginator="recentlyRegisteredUsersPaginator"/>
			</MkFoldableSection>
		</template>
	</div>
	<div v-else>
		<MkFoldableSection :foldable="true" :expanded="false" class="_margin">
			<template #header><i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.popularTags }}</template>

			<div>
				<MkA v-for="tag in tagsLocal" :key="'local:' + tag.tag" :to="`/user-tags/${tag.tag}`" style="margin-right: 16px; font-weight: bold;">{{ tag.tag }}</MkA>
				<MkA v-for="tag in tagsRemote" :key="'remote:' + tag.tag" :to="`/user-tags/${tag.tag}`" style="margin-right: 16px;">{{ tag.tag }}</MkA>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-if="tagUsersPaginator != null" :key="`${tag}`" class="_margin">
			<template #header><i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>{{ tag }}</template>
			<MkUserList :paginator="tagUsersPaginator"/>
		</MkFoldableSection>

		<template v-if="tag == null">
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.popularUsers }}</template>
				<MkUserList :paginator="popularUsersFPaginator"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-message ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.recentlyUpdatedUsers }}</template>
				<MkUserList :paginator="recentlyUpdatedUsersFPaginator"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-rocket ti-fw" style="margin-right: 0.5em;"></i>{{ $locale.sfc.recentlyDiscoveredUsers }}</template>
				<MkUserList :paginator="recentlyRegisteredUsersFPaginator"/>
			</MkFoldableSection>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, useTemplateRef, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkUserList from '@features/relationships/frontend/components/MkUserList.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import MkTab from '@features/ui/frontend/components/MkTab.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { instance } from '@features/instance/frontend/instance.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const props = defineProps<{
	tag?: string;
}>();

const origin = ref<'local' | 'remote'>('local');
const tagsLocal = ref<Misskey.entities.Hashtag[]>([]);
const tagsRemote = ref<Misskey.entities.Hashtag[]>([]);

const tagUsersPaginator = props.tag != null ? markRaw(new Paginator('hashtags/users', {
	limit: 30,
	params: {
		tag: props.tag,
		origin: 'combined',
		sort: '+follower',
	},
})) : null;

const pinnedUsersPaginator = markRaw(new Paginator('pinned-users', {
	noPaging: true,
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

const recentlyUpdatedUsersPaginator = markRaw(new Paginator('users', {
	limit: 10,
	noPaging: true,
	params: {
		origin: 'local',
		sort: '+updatedAt',
	},
}));

const recentlyRegisteredUsersPaginator = markRaw(new Paginator('users', {
	limit: 10,
	noPaging: true,
	params: {
		origin: 'local',
		state: 'alive',
		sort: '+createdAt',
	},
}));

const popularUsersFPaginator = markRaw(new Paginator('users', {
	limit: 10,
	noPaging: true,
	params: {
		state: 'alive',
		origin: 'remote',
		sort: '+follower',
	},
}));

const recentlyUpdatedUsersFPaginator = markRaw(new Paginator('users', {
	limit: 10,
	noPaging: true,
	params: {
		origin: 'combined',
		sort: '+updatedAt',
	},
}));

const recentlyRegisteredUsersFPaginator = markRaw(new Paginator('users', {
	limit: 10,
	noPaging: true,
	params: {
		origin: 'combined',
		sort: '+createdAt',
	},
}));

misskeyApi('hashtags/list', {
	sort: '+attachedLocalUsers',
	attachedToLocalUserOnly: true,
	limit: 30,
}).then(tags => {
	tagsLocal.value = tags;
});
misskeyApi('hashtags/list', {
	sort: '+attachedRemoteUsers',
	attachedToRemoteUserOnly: true,
	limit: 30,
}).then(tags => {
	tagsRemote.value = tags;
});
</script>

<locale locale="ar-SA" lang="json">
{
  "local": "المحلي",
  "remote": "بُعدي",
  "pinnedUsers": "المستخدمون المثبتون",
  "popularUsers": "المستخدمون الرائدون",
  "recentlyUpdatedUsers": "أصحاب النشاطات الأخيرة",
  "recentlyRegisteredUsers": "المستخدمون المنضمون حديثًا",
  "popularTags": "الوسوم الرائجة",
  "recentlyDiscoveredUsers": "المستخدمون المكتشفون حديثًا"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "local": "Local",
  "remote": "Remot",
  "pinnedUsers": "Usuaris fixats",
  "popularUsers": "Usuaris populars",
  "recentlyUpdatedUsers": "Usuaris actius fa poc",
  "recentlyRegisteredUsers": "Usuaris nous",
  "popularTags": "Etiquetes populars",
  "recentlyDiscoveredUsers": "Usuaris descoberts fa poc"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "local": "Lokální",
  "remote": "Vzdálené",
  "pinnedUsers": "Připnutí uživatelé",
  "popularUsers": "Populární uživatelé",
  "recentlyUpdatedUsers": "Nedávno aktívni uživatelé",
  "recentlyRegisteredUsers": "Nově připojený uživatelé",
  "popularTags": "Populární tagy",
  "recentlyDiscoveredUsers": "Nově objevený uživatelé"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "local": "Local",
  "remote": "Remote",
  "pinnedUsers": "Pinned users",
  "popularUsers": "Popular users",
  "recentlyUpdatedUsers": "Recently active users",
  "recentlyRegisteredUsers": "Newly joined users",
  "popularTags": "Popular tags",
  "recentlyDiscoveredUsers": "Newly discovered users"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "local": "Lokal",
  "remote": "Fremd",
  "pinnedUsers": "Angeheftete Benutzer",
  "popularUsers": "Beliebte Benutzer",
  "recentlyUpdatedUsers": "Vor kurzem aktive Benutzer",
  "recentlyRegisteredUsers": "Vor kurzem registrierte Benutzer",
  "popularTags": "Beliebte Schlagwörter",
  "recentlyDiscoveredUsers": "Vor kurzem gefundene Benutzer"
}
</locale>

<locale locale="en-US" lang="json">
{
  "local": "Local",
  "remote": "Remote",
  "pinnedUsers": "Pinned users",
  "popularUsers": "Popular users",
  "recentlyUpdatedUsers": "Recently active users",
  "recentlyRegisteredUsers": "Newly joined users",
  "popularTags": "Popular tags",
  "recentlyDiscoveredUsers": "Newly discovered users"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "local": "Local",
  "remote": "Remoto",
  "pinnedUsers": "Usuarios fijados",
  "popularUsers": "Usuarios populares",
  "recentlyUpdatedUsers": "Usuarios activos recientemente",
  "recentlyRegisteredUsers": "Usuarios registrados recientemente",
  "popularTags": "Etiquetas populares",
  "recentlyDiscoveredUsers": "Usuarios descubiertos recientemente"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "local": "Local",
  "remote": "Distant",
  "pinnedUsers": "Utilisateur·rice épinglé·e",
  "popularUsers": "Utilisateur·rice·s populaires",
  "recentlyUpdatedUsers": "Utilisateur·rice·s actif·ve·s récemment",
  "recentlyRegisteredUsers": "Utilisateur·rice·s récemment inscrit·e·s",
  "popularTags": "Mots-clés populaires",
  "recentlyDiscoveredUsers": "Utilisateur·rice·s récemment découvert·e·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "local": "Lokal",
  "remote": "Remote",
  "pinnedUsers": "Pengguna yang disematkan",
  "popularUsers": "Pengguna populer",
  "recentlyUpdatedUsers": "Pengguna dengan aktivitas terkini",
  "recentlyRegisteredUsers": "Pengguna baru saja bergabung",
  "popularTags": "Tag populer",
  "recentlyDiscoveredUsers": "Pengguna baru saja dilihat"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "local": "Locale",
  "remote": "Remota",
  "pinnedUsers": "Profili in evidenza",
  "popularUsers": "Profili popolari",
  "recentlyUpdatedUsers": "Utenti attivi di recente",
  "recentlyRegisteredUsers": "Profili iscritti di recente",
  "popularTags": "Hashtag popolari",
  "recentlyDiscoveredUsers": "Profili scoperti di recente"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "local": "ローカル",
  "remote": "リモート",
  "pinnedUsers": "ピン留めユーザー",
  "popularUsers": "人気のユーザー",
  "recentlyUpdatedUsers": "最近投稿したユーザー",
  "recentlyRegisteredUsers": "最近登録したユーザー",
  "popularTags": "人気のタグ",
  "recentlyDiscoveredUsers": "最近発見されたユーザー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "local": "ローカル",
  "remote": "リモート",
  "pinnedUsers": "ピン留めしたユーザー",
  "popularUsers": "人気のユーザー",
  "recentlyUpdatedUsers": "ちょっと前に投稿したばっかりのユーザー",
  "recentlyRegisteredUsers": "ちょっと前に始めたばっかりのユーザー",
  "popularTags": "人気のタグ",
  "recentlyDiscoveredUsers": "最近見っけたユーザー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "local": "Local",
  "remote": "Remote",
  "pinnedUsers": "Pinned users",
  "popularUsers": "Popular users",
  "recentlyUpdatedUsers": "Recently active users",
  "recentlyRegisteredUsers": "Newly joined users",
  "popularTags": "Popular tags",
  "recentlyDiscoveredUsers": "Newly discovered users"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "local": "Local",
  "remote": "Remote",
  "pinnedUsers": "Pinned users",
  "popularUsers": "Popular users",
  "recentlyUpdatedUsers": "Recently active users",
  "recentlyRegisteredUsers": "Newly joined users",
  "popularTags": "Popular tags",
  "recentlyDiscoveredUsers": "Newly discovered users"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "local": "로컬",
  "remote": "리모트",
  "pinnedUsers": "고정한 유저",
  "popularUsers": "인기 유저",
  "recentlyUpdatedUsers": "최근에 활동한 유저",
  "recentlyRegisteredUsers": "최근에 가입한 유저",
  "popularTags": "인기 태그",
  "recentlyDiscoveredUsers": "최근에 발견한 유저"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "local": "Lokaal",
  "remote": "Remote",
  "pinnedUsers": "Vastgeprikte gebruikers",
  "popularUsers": "Populaire gebruikers",
  "recentlyUpdatedUsers": "Recent actieve gebruikers",
  "recentlyRegisteredUsers": "Recent geregistreerde gebruikers",
  "popularTags": "Populaire tags",
  "recentlyDiscoveredUsers": "Nieuw ontdekte gebruikers "
}
</locale>

<locale locale="no-NO" lang="json">
{
  "local": "Local",
  "remote": "Remote",
  "pinnedUsers": "Festede brukrere",
  "popularUsers": "Populære brukere",
  "recentlyUpdatedUsers": "Recently active users",
  "recentlyRegisteredUsers": "Newly joined users",
  "popularTags": "Popular tags",
  "recentlyDiscoveredUsers": "Newly discovered users"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "local": "Lokalne",
  "remote": "Zdalny",
  "pinnedUsers": "Przypięty użytkownik",
  "popularUsers": "Popularni użytkownicy",
  "recentlyUpdatedUsers": "Ostatnio aktywni użytkownicy",
  "recentlyRegisteredUsers": "Ostatnio zarejestrowani użytkownicy",
  "popularTags": "Tagi na czasie",
  "recentlyDiscoveredUsers": "Ostatnio odkryci użytkownicy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "local": "Local",
  "remote": "Remoto",
  "pinnedUsers": "Utilizador fixado",
  "popularUsers": "Utilizadores populares",
  "recentlyUpdatedUsers": "Utilizadores postados recentemente",
  "recentlyRegisteredUsers": "Utilizadores registrados recentemente",
  "popularTags": "Tags populares",
  "recentlyDiscoveredUsers": "Utilizadores descobertos recentemente"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "local": "С этого сайта",
  "remote": "С других сайтов",
  "pinnedUsers": "Прикреплённый пользователь",
  "popularUsers": "Популярные пользователи",
  "recentlyUpdatedUsers": "Активные последнее время",
  "recentlyRegisteredUsers": "Недавно зарегистрированные пользователи",
  "popularTags": "Популярные теги",
  "recentlyDiscoveredUsers": "Недавно обнаруженные пользователи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "local": "Lokálne",
  "remote": "Vzdialené",
  "pinnedUsers": "Pripnutí používatelia",
  "popularUsers": "Populárni používatelia",
  "recentlyUpdatedUsers": "Používatelia s najnovšou aktivitou",
  "recentlyRegisteredUsers": "Najnovší používatelia",
  "popularTags": "Populárne značky",
  "recentlyDiscoveredUsers": "Naposledy objavení používatelia"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "local": "ท้องถิ่น",
  "remote": "ระยะไกล",
  "pinnedUsers": "ผู้ใช้ที่ถูกปักหมุด",
  "popularUsers": "ผู้ใช้ที่เป็นที่นิยม",
  "recentlyUpdatedUsers": "ผู้ใช้ที่เพิ่งใช้งานล่าสุด",
  "recentlyRegisteredUsers": "ผู้ใช้ที่เข้าร่วมใหม่",
  "popularTags": "แท็กยอดนิยม",
  "recentlyDiscoveredUsers": "ผู้ใช้ที่เพิ่งค้นพบล่าสุด"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "local": "Yerel",
  "remote": "Uzak",
  "pinnedUsers": "Sabitlenmiş kullanıcılar",
  "popularUsers": "Popüler kullanıcılar",
  "recentlyUpdatedUsers": "Son zamanlarda aktif olan kullanıcılar",
  "recentlyRegisteredUsers": "Yeni katılan kullanıcılar",
  "popularTags": "Popüler etiketler",
  "recentlyDiscoveredUsers": "Yeni keşfedilen kullanıcılar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "local": "Local",
  "remote": "Remote",
  "pinnedUsers": "Pinned users",
  "popularUsers": "Popular users",
  "recentlyUpdatedUsers": "Recently active users",
  "recentlyRegisteredUsers": "Newly joined users",
  "popularTags": "Popular tags",
  "recentlyDiscoveredUsers": "Newly discovered users"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "local": "Локальні",
  "remote": "Віддалені",
  "pinnedUsers": "Закріплені користувачі",
  "popularUsers": "Популярні користувачі",
  "recentlyUpdatedUsers": "Нещодавно активні користувачі",
  "recentlyRegisteredUsers": "Нещодавно зареєстровані користувачі",
  "popularTags": "Популярні теги",
  "recentlyDiscoveredUsers": "Нещодавно знайдені користувачі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "local": "Máy chủ này",
  "remote": "Máy chủ khác",
  "pinnedUsers": "Những người thú vị",
  "popularUsers": "Những người nổi tiếng",
  "recentlyUpdatedUsers": "Hoạt động gần đây",
  "recentlyRegisteredUsers": "Mới tham gia",
  "popularTags": "Hashtag thông dụng",
  "recentlyDiscoveredUsers": "Mới khám phá"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "local": "本地",
  "remote": "远程",
  "pinnedUsers": "置顶用户",
  "popularUsers": "热门用户",
  "recentlyUpdatedUsers": "最近投稿的用户",
  "recentlyRegisteredUsers": "最近登录的用户",
  "popularTags": "热门标签",
  "recentlyDiscoveredUsers": "最近发现的用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "local": "本地",
  "remote": "遠端",
  "pinnedUsers": "置頂使用者",
  "popularUsers": "熱門使用者",
  "recentlyUpdatedUsers": "最近發文的使用者",
  "recentlyRegisteredUsers": "新加入使用者",
  "popularTags": "熱門標籤",
  "recentlyDiscoveredUsers": "最近發現的使用者"
}
</locale>
