<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="tab === 'note'" class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="notesSearchAvailable || ignoreNotesSearchAvailable">
			<XNote v-bind="props"/>
		</div>
		<div v-else>
			<MkInfo warn>{{ $locale.sfc.notesSearchNotAvailable }}</MkInfo>
		</div>
	</div>

	<div v-else-if="tab === 'user'" class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="usersSearchAvailable">
			<XUser v-bind="props"/>
		</div>
		<div v-else>
			<MkInfo warn>{{ $locale.sfc.usersSearchNotAvailable }}</MkInfo>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, defineAsyncComponent, ref, toRef } from 'vue';
import { $i } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { notesSearchAvailable, usersSearchAvailable } from '@features/roles/frontend/utility/check-permissions.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	query?: string,
	userId?: string,
	username?: string,
	host?: string | null,
	type?: 'note' | 'user',
	origin?: 'combined' | 'local' | 'remote',
	// For storybook only
	ignoreNotesSearchAvailable?: boolean,
}>(), {
	query: '',
	userId: undefined,
	username: undefined,
	host: undefined,
	type: 'note',
	origin: 'combined',
	ignoreNotesSearchAvailable: false,
});

const XNote = defineAsyncComponent(() => import('@features/note-search/frontend/pages/search.note.vue'));
const XUser = defineAsyncComponent(() => import('@features/discovery/frontend/pages/search.user.vue'));

const tab = ref(toRef(props, 'type').value);

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'note',
	title: globalLocale.value.env.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'user',
	title: globalLocale.value.env.users,
	icon: 'ti ti-users',
}]);

definePage(() => ({
	title: globalLocale.value.env.search,
	icon: 'ti ti-search',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"notesSearchNotAvailable": "La cerca de notes no es troba disponible.",
	"usersSearchNotAvailable": "La cerca d'usuaris no està disponible."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"notesSearchNotAvailable": "Vyhledávání poznámek je nedostupné.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"notesSearchNotAvailable": "Die Notizsuche ist nicht verfügbar.",
	"usersSearchNotAvailable": "Die Benutzersuche ist nicht verfügbar."
}
</locale>

<locale locale="en-US" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"notesSearchNotAvailable": "No se puede buscar una nota",
	"usersSearchNotAvailable": "La búsqueda de usuarios no está disponible."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"notesSearchNotAvailable": "La recherche de notes n'est pas disponible.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"notesSearchNotAvailable": "Pencarian catatan tidak tersedia.",
	"usersSearchNotAvailable": "Pencarian pengguna tidak tersedia."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"notesSearchNotAvailable": "Non è possibile cercare tra le Note.",
	"usersSearchNotAvailable": "La ricerca profili non è disponibile."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"notesSearchNotAvailable": "ノート検索は利用できません。",
	"usersSearchNotAvailable": "ユーザー検索は利用できません。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"notesSearchNotAvailable": "なんかノート探せへん。",
	"usersSearchNotAvailable": "ユーザーを探すことはできへんみたいや。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"notesSearchNotAvailable": "노트 검색을 이용하실 수 없습니다.",
	"usersSearchNotAvailable": "유저 검색을 이용하실 수 없습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"notesSearchNotAvailable": "A pesquisa de notas está indisponível.",
	"usersSearchNotAvailable": "Pesquisa de usuário está indisponível."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"notesSearchNotAvailable": "Поиск заметок недоступен",
	"usersSearchNotAvailable": "Функция \"поиска пользователей\" отключена"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"notesSearchNotAvailable": "การค้นหาโน้ตไม่พร้อมใช้งาน",
	"usersSearchNotAvailable": "การค้นหาผู้ใช้ไม่พร้อมใช้งาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"notesSearchNotAvailable": "Not arama özelliği kullanılamıyor.",
	"usersSearchNotAvailable": "Kullanıcı araması mevcut değildir."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"notesSearchNotAvailable": "Note search is unavailable.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"notesSearchNotAvailable": "Пошук нотаток недоступний.",
	"usersSearchNotAvailable": "Пошук користувачів недоступний."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"notesSearchNotAvailable": "Tìm kiếm bài đăng hiện không khả dụng.",
	"usersSearchNotAvailable": "User search is not available."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"notesSearchNotAvailable": "帖子检索不可用",
	"usersSearchNotAvailable": "用户检索不可用"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"notesSearchNotAvailable": "無法使用搜尋貼文功能。",
	"usersSearchNotAvailable": "無法使用使用者搜尋功能。"
}
</locale>
