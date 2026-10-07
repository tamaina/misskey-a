<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :tabs="headerTabs">
	<div v-if="error != null" class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkResult type="error" :text="error"/>
	</div>
	<div v-else-if="tab === 'users'" class="_spacer" style="--MI_SPACER-w: 1200px;">
		<div class="_gaps_s">
			<div v-if="role">{{ role.description }}</div>
			<MkUserList v-if="visible" :paginator="usersPaginator" :extractor="(item) => item.user"/>
			<MkResult v-else-if="!visible" type="empty" :text="$locale.sfc.nothing"/>
		</div>
	</div>
	<div v-else-if="tab === 'timeline'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<MkStreamingNotesTimeline v-if="visible" ref="timeline" src="role" :role="props.roleId"/>
		<MkResult v-else-if="!visible" type="empty" :text="$locale.sfc.nothing"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkUserList from '@features/relationships/frontend/components/MkUserList.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const props = withDefaults(defineProps<{
	roleId: string;
	initialTab?: string;
}>(), {
	initialTab: 'users',
});

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const tab = ref(props.initialTab);
const role = ref<Misskey.entities.Role | null>(null);
const error = ref<string | null>(null);
const visible = ref(false);

watch(() => props.roleId, () => {
	misskeyApi('roles/show', {
		roleId: props.roleId,
	}).then(res => {
		role.value = res;
		error.value = null;
		visible.value = res.isExplorable && res.isPublic;
	}).catch((err) => {
		if (err.code === 'NO_SUCH_ROLE') {
			error.value = $locale.value.sfc.noRole;
		} else {
			error.value = $locale.value.sfc.somethingHappened;
		}
	});
}, { immediate: true });

const usersPaginator = markRaw(new Paginator('roles/users', {
	limit: 30,
	computedParams: computed(() => ({
		roleId: props.roleId,
	})),
}));

const headerTabs = computed(() => [{
	key: 'users',
	icon: 'ti ti-users',
	title: $locale.value.sfc.users,
}, {
	key: 'timeline',
	icon: 'ti ti-pencil',
	title: $locale.value.sfc.timeline,
}]);

definePage(() => ({
	title: role.value ? role.value.name : (error.value ?? $locale.value.sfc.role),
	icon: 'ti ti-badge',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"nothing": "لا يوجد شيء هنا",
	"noRole": "لم يُعثر على دور",
	"somethingHappened": "حدث خطأ",
	"users": "المستخدمون",
	"timeline": "الخيط الزمني",
	"role": "الدور"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"nothing": "No hi ha res per veure aquí ",
	"noRole": "No s'han trobat rols",
	"somethingHappened": "S'ha produït un error",
	"users": "Usuaris",
	"timeline": "Línia de temps",
	"role": "Rols"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"nothing": "Nic nebylo nalezeno",
	"noRole": "Role nenalezena",
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"users": "Uživatelé",
	"timeline": "Časová osa",
	"role": "Role"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"nothing": "There's nothing to see here",
	"noRole": "Role not found",
	"somethingHappened": "An error has occurred",
	"users": "Users",
	"timeline": "Timeline",
	"role": "Role"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"nothing": "Hier gibt es nichts zu sehen",
	"noRole": "Rolle nicht gefunden",
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"users": "Benutzer",
	"timeline": "Chronik",
	"role": "Rolle"
}
</locale>

<locale locale="en-US" lang="json">
{
	"nothing": "There's nothing to see here",
	"noRole": "Role not found",
	"somethingHappened": "An error has occurred",
	"users": "Users",
	"timeline": "Timeline",
	"role": "Role"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"nothing": "No hay nada que ver aqui",
	"noRole": "Rol no encontrado",
	"somethingHappened": "Ocurrió un error",
	"users": "Usuarios",
	"timeline": "Línea de tiempo",
	"role": "Rol"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"nothing": "Il n'y a rien à voir ici",
	"noRole": "Aucun rôle",
	"somethingHappened": "Une erreur est survenue",
	"users": "Utilisateur·rice·s",
	"timeline": "Fil",
	"role": "Rôles"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"nothing": "Tidak ada sama sekali disini",
	"noRole": "Peran tidak temukan",
	"somethingHappened": "Terjadi kesalahan",
	"users": "Pengguna",
	"timeline": "Lini masa",
	"role": "Peran"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"nothing": "Niente da visualizzare",
	"noRole": "Ruolo non trovato",
	"somethingHappened": "Si è verificato un problema",
	"users": "Profili",
	"timeline": "Timeline",
	"role": "Ruolo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"nothing": "ありません",
	"noRole": "ロールはありません",
	"somethingHappened": "問題が発生しました",
	"users": "ユーザー",
	"timeline": "タイムライン",
	"role": "ロール"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"nothing": "あらへん",
	"noRole": "ロールはありまへん",
	"somethingHappened": "なんかあかんわ",
	"users": "ユーザー",
	"timeline": "タイムライン",
	"role": "ロール"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"nothing": "There's nothing to see here",
	"noRole": "Role not found",
	"somethingHappened": "An error has occurred",
	"users": "Users",
	"timeline": "Timeline",
	"role": "Role"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"nothing": "There's nothing to see here",
	"noRole": "Role not found",
	"somethingHappened": "An error has occurred",
	"users": "ಬಳಕೆದಾರ",
	"timeline": "ಸಮಯಸಾಲು",
	"role": "Role"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"nothing": "아무것도 없습니다",
	"noRole": "역할이 없습니다",
	"somethingHappened": "오류가 발생했습니다",
	"users": "유저",
	"timeline": "타임라인",
	"role": "역할"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"nothing": "Niets te zien hier",
	"noRole": "Role not found",
	"somethingHappened": "Er is iets misgegaan.",
	"users": "Gebruikers",
	"timeline": "Tijdlijn",
	"role": "Role"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"nothing": "Ingenting",
	"noRole": "Role not found",
	"somethingHappened": "En feil har oppstått",
	"users": "Brukere",
	"timeline": "Tidslinje",
	"role": "Rolle"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"nothing": "Nie ma tu niczego",
	"noRole": "Rola nie znaleziona",
	"somethingHappened": "Coś poszło nie tak",
	"users": "Użytkownicy",
	"timeline": "Oś czasu",
	"role": "Rola"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"nothing": "Não há nada aqui",
	"noRole": "Nenhum cargo",
	"somethingHappened": "Ocorreu um erro",
	"users": "Usuários",
	"timeline": "Linha do tempo",
	"role": "Cargo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"nothing": "Ничего нет",
	"noRole": "Нет роли",
	"somethingHappened": "Что-то пошло не так",
	"users": "Пользователи",
	"timeline": "Лента",
	"role": "Роль"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"nothing": "Nič tu nie je",
	"noRole": "Role not found",
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"users": "Používatelia",
	"timeline": "Časová os",
	"role": "Role"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"nothing": "ไม่พบผลลัพธ์",
	"noRole": "ไม่พบบทบาท",
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"users": "ผู้ใช้",
	"timeline": "ไทม์ไลน์",
	"role": "บทบาท"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"nothing": "Burada görülecek bir şey yok.",
	"noRole": "Rol bulunamadı",
	"somethingHappened": "Bir hata oluştu",
	"users": "Kullanıcılar",
	"timeline": "Pano",
	"role": "Rol"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"nothing": "There's nothing to see here",
	"noRole": "Role not found",
	"somethingHappened": "An error has occurred",
	"users": "Users",
	"timeline": "Timeline",
	"role": "Role"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"nothing": "Тут нічого немає",
	"noRole": "Роль не знайдено",
	"somethingHappened": "Щось пішло не так",
	"users": "Користувачі",
	"timeline": "Стрічка",
	"role": "Роль"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"nothing": "Không có gì ở đây",
	"noRole": "Bạn chưa được cấp quyền.",
	"somethingHappened": "Xảy ra lỗi",
	"users": "Người dùng",
	"timeline": "Bảng tin",
	"role": "Vai trò"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"nothing": "无",
	"noRole": "角色不存在",
	"somethingHappened": "出错了",
	"users": "用户",
	"timeline": "时间线",
	"role": "角色"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"nothing": "查無項目",
	"noRole": "沒有角色",
	"somethingHappened": "發生錯誤",
	"users": "使用者",
	"timeline": "時間軸",
	"role": "角色"
}
</locale>
