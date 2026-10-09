<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:withOkButton="true"
	:okButtonDisabled="selected == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.selectUser }}</template>
	<div>
		<div :class="$style.form">
			<MkInput v-if="computedLocalOnly" v-model="username" :autofocus="true" @update:modelValue="search">
				<template #label>{{ $locale.sfc.username }}</template>
				<template #prefix>@</template>
			</MkInput>
			<FormSplit v-else :minWidth="170">
				<MkInput v-model="username" :autofocus="true" @update:modelValue="search">
					<template #label>{{ $locale.sfc.username }}</template>
					<template #prefix>@</template>
				</MkInput>
				<MkInput v-model="host" :datalist="[hostname]" @update:modelValue="search">
					<template #label>{{ $locale.sfc.host }}</template>
					<template #prefix>@</template>
				</MkInput>
			</FormSplit>
		</div>
		<div v-if="username != '' || host != ''" :class="[$style.result, { [$style.hit]: users.length > 0 }]">
			<div v-if="users.length > 0" :class="$style.users">
				<div v-for="user in users" :key="user.id" class="_button" :class="[$style.user, { [$style.selected]: selected && selected.id === user.id }]" @click="selected = user" @dblclick="ok()">
					<MkAvatar :user="user" :class="$style.avatar" indicator/>
					<div :class="$style.userBody">
						<MkUserName :user="user" :class="$style.userName"/>
						<MkAcct :user="user" :class="$style.userAcct"/>
					</div>
				</div>
			</div>
			<div v-else :class="$style.empty">
				<span>{{ $locale.sfc.noUsers }}</span>
			</div>
		</div>
		<div v-if="username == '' && host == ''" :class="$style.recent">
			<div :class="$style.users">
				<div v-for="user in recentUsers" :key="user.id" class="_button" :class="[$style.user, { [$style.selected]: selected && selected.id === user.id }]" @click="selected = user" @dblclick="ok()">
					<MkAvatar :user="user" :class="$style.avatar" indicator/>
					<div :class="$style.userBody">
						<MkUserName :user="user" :class="$style.userName"/>
						<MkAcct :user="user" :class="$style.userAcct"/>
					</div>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { host as currentHost, hostname } from '@features/boot/frontend/shared/config.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { store } from '@features/preferences/frontend/store.js';
import { $i } from '@features/auth/frontend/i.js';
import { instance } from '@features/instance/frontend/instance.js';

const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = withDefaults(defineProps<{
	includeSelf?: boolean;
	localOnly?: boolean;
}>(), {
	includeSelf: false,
	localOnly: false,
});

const computedLocalOnly = computed(() => props.localOnly || instance.federation === 'none');

const username = ref('');
const host = ref('');
const users = ref<Misskey.entities.UserLite[]>([]);
const recentUsers = ref<Misskey.entities.UserDetailed[]>([]);
const selected = ref<Misskey.entities.UserLite | null>(null);
const dialogEl = useTemplateRef('dialogEl');

function search() {
	if (username.value === '' && host.value === '') {
		users.value = [];
		return;
	}
	misskeyApi('users/search-by-username-and-host', {
		username: username.value,
		host: computedLocalOnly.value ? '.' : host.value,
		limit: 10,
		detail: false,
	}).then(_users => {
		users.value = _users.filter((u) => {
			if (props.includeSelf) {
				return true;
			} else {
				return u.id !== $i?.id;
			}
		});
	});
}

async function ok() {
	if (selected.value == null) return;

	const user = await misskeyApi('users/show', {
		userId: selected.value.id,
	});
	emit('ok', user);

	dialogEl.value?.close();

	// 最近使ったユーザー更新
	let recents = store.s.recentlyUsedUsers;
	recents = recents.filter(x => x !== selected.value?.id);
	recents.unshift(selected.value.id);
	store.set('recentlyUsedUsers', recents.splice(0, 16));
}

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

onMounted(() => {
	misskeyApi('users/show', {
		userIds: store.s.recentlyUsedUsers,
	}).then(foundUsers => {
		let _users = foundUsers;
		_users = _users.filter((u) => {
			if (computedLocalOnly.value) {
				return u.host == null;
			} else {
				return true;
			}
		});
		_users = _users.filter((u) => {
			if (props.includeSelf) {
				return true;
			} else {
				return u.id !== $i?.id;
			}
		});
		recentUsers.value = _users;
	});
});
</script>

<style lang="scss" module>

.form {
	padding: calc(var(--root-margin) / 2) var(--root-margin);
}

.result,
.recent {
	display: flex;
	flex-direction: column;
	overflow: auto;
	height: 100%;

	&.result.hit {
		padding: 0;
	}

	&.recent {
		padding: 0;
	}
}

.users {
	flex: 1;
	overflow: auto;
	padding: 8px 0;
}

.user {
	display: flex;
	align-items: center;
	padding: 8px var(--root-margin);
	font-size: 14px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}

	&.selected {
		background: var(--MI_THEME-accent);
		color: #fff;
	}
}

.userBody {
	padding: 0 8px;
	min-width: 0;
}

.avatar {
	width: 45px;
	height: 45px;
}

.userName {
	display: block;
	font-weight: bold;
}

.userAcct {
	opacity: 0.5;
}

.empty {
	opacity: 0.7;
	text-align: center;
	padding: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "selectUser": "حدّد مستخدمًا",
  "username": "اسم المستخدم",
  "host": "المضيف",
  "noUsers": "ليس هناك مستخدمون"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "selectUser": "Selecciona usuari/a",
  "username": "Nom d'usuari",
  "host": "Amfitrió",
  "noUsers": "No hi ha usuaris"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "selectUser": "Vyberte uživatele",
  "username": "Uživatelské jméno",
  "host": "Hostitel",
  "noUsers": "Žádní uživatelé"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "selectUser": "Select a user",
  "username": "Username",
  "host": "Host",
  "noUsers": "There are no users"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "selectUser": "Benutzer auswählen",
  "username": "Benutzername",
  "host": "Hostname",
  "noUsers": "Keine Benutzer gefunden"
}
</locale>

<locale locale="en-US" lang="json">
{
  "selectUser": "Select a user",
  "username": "Username",
  "host": "Host",
  "noUsers": "There are no users"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "selectUser": "Elegir usuario",
  "username": "Nombre de usuario",
  "host": "Instancia",
  "noUsers": "No hay usuarios"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "selectUser": "Sélectionner un·e utilisateur·rice",
  "username": "Nom d’utilisateur·rice",
  "host": "Serveur distant",
  "noUsers": "Il n’y a pas d’utilisateur·rice·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "selectUser": "Pilih pengguna",
  "username": "Nama Pengguna",
  "host": "Host",
  "noUsers": "Tidak ada pengguna"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "selectUser": "Seleziona profilo",
  "username": "Nome utente",
  "host": "Host",
  "noUsers": "Non ci sono profili"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "selectUser": "ユーザーを選択",
  "username": "ユーザー名",
  "host": "ホスト",
  "noUsers": "ユーザーはいません"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "selectUser": "ユーザーを選ぶ",
  "username": "ユーザー名",
  "host": "ホスト",
  "noUsers": "ユーザーはおらん"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "selectUser": "Select a user",
  "username": "Isem n umseqdac",
  "host": "Host",
  "noUsers": "There are no users"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "selectUser": "Select a user",
  "username": "ಬಳಕೆಹೆಸರು",
  "host": "Host",
  "noUsers": "There are no users"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "selectUser": "유저 선택",
  "username": "유저명",
  "host": "호스트",
  "noUsers": "아무도 없습니다"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "selectUser": "Kies een gebruiker",
  "username": "Gebruikersnaam",
  "host": "Server",
  "noUsers": "Er zijn geen gebruikers."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "selectUser": "Velg en bruker",
  "username": "Brukernavn",
  "host": "Vert",
  "noUsers": "Det er ingen brukere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "selectUser": "Wybierz użytkownika",
  "username": "Nazwa użytkownika",
  "host": "Host",
  "noUsers": "Brak użytkowników"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "selectUser": "Selecionar usuário",
  "username": "Nome de usuário",
  "host": "Host",
  "noUsers": "Sem usuários"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "selectUser": "Выберите пользователя",
  "username": "Имя пользователя",
  "host": "Хост",
  "noUsers": "Нет ни одного пользователя"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "selectUser": "Vyberte používateľa",
  "username": "Meno používateľa",
  "host": "Host",
  "noUsers": "Žiadni používatelia"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "selectUser": "เลือกผู้ใช้งาน",
  "username": "ชื่อผู้ใช้",
  "host": "โฮสต์",
  "noUsers": "ไม่พบผู้ใช้งาน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "selectUser": "Kullanıcı seç",
  "username": "Kullanıcı Adı",
  "host": "Host",
  "noUsers": "Kullanıcı yok"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "selectUser": "Select a user",
  "username": "Username",
  "host": "Host",
  "noUsers": "There are no users"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "selectUser": "Виберіть користувача",
  "username": "Ім'я користувача",
  "host": "Хост",
  "noUsers": "Немає користувачів"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "selectUser": "Chọn người dùng",
  "username": "Tên người dùng",
  "host": "Host",
  "noUsers": "Chưa có ai"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "selectUser": "选择用户",
  "username": "用户名",
  "host": "主机名",
  "noUsers": "无用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "selectUser": "選取使用者",
  "username": "使用者名稱",
  "host": "主機",
  "noUsers": "沒有任何使用者"
}
</locale>
