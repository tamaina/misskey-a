<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="list" class="_gaps">
			<MkFolder>
				<template #label>{{ globalLocale.env.settings }}</template>

				<div class="_gaps">
					<MkInput v-model="name">
						<template #label>{{ globalLocale.env.name }}</template>
					</MkInput>
					<MkSwitch v-model="isPublic">{{ globalLocale.env.public }}</MkSwitch>
					<div class="_buttons">
						<MkButton rounded primary @click="updateSettings">{{ globalLocale.env.save }}</MkButton>
						<MkButton rounded danger @click="deleteList()">{{ globalLocale.env.delete }}</MkButton>
					</div>
				</div>
			</MkFolder>

			<MkFolder defaultOpen>
				<template #label>{{ $locale.sfc.members }}</template>
				<template #caption>{{ interpolateLocaleParameters($locale.sfc.nUsers, { n: `${list.userIds!.length}/${$i.policies['userEachUserListsLimit']}` }) }}</template>

				<div class="_gaps">
					<MkButton rounded primary style="margin: 0 auto;" @click="addUser()"><i class="ti ti-plus"></i> {{ $locale.sfc.addUser }}</MkButton>

					<MkPagination :paginator="membershipsPaginator">
						<template #default="{ items }">
							<div class="_gaps_s">
								<div v-for="item in items" :key="item.id">
									<div :class="$style.userItem">
										<MkA :class="$style.userItemBody" :to="`${userPage(item.user)}`">
											<MkUserCardMini :user="item.user"/>
										</MkA>
										<button class="_button" :class="$style.menu" @click="showMembershipMenu(item, $event)"><i class="ti ti-dots"></i></button>
										<button class="_button" :class="$style.remove" @click="removeUser(item, $event)"><i class="ti ti-x"></i></button>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</div>
			</MkFolder>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, markRaw, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { userPage } from '@features/users/frontend/shared/user.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { userListsCache } from '@features/runtime/frontend/cache.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const $i = ensureSignin();

const router = useRouter();

const props = defineProps<{
	listId: string;
}>();

const list = ref<Misskey.entities.UserList | null>(null);
const isPublic = ref(false);
const name = ref('');
const membershipsPaginator = markRaw(new Paginator('users/lists/get-memberships', {
	limit: 30,
	computedParams: computed(() => ({
		listId: props.listId,
	})),
}));

function fetchList() {
	misskeyApi('users/lists/show', {
		listId: props.listId,
	}).then(_list => {
		list.value = _list;
		name.value = list.value.name;
		isPublic.value = list.value.isPublic;
	});
}

function addUser() {
	os.selectUser({ includeSelf: true }).then(user => {
		if (!list.value) return;
		const listId = list.value.id;
		os.apiWithDialog('users/lists/push', {
			listId,
			userId: user.id,
		}).then(() => {
			if (list.value?.id === listId && !list.value.userIds?.includes(user.id)) {
				list.value.userIds?.push(user.id);
			}
			membershipsPaginator.reload();
			userListsCache.delete();
		});
	});
}

async function removeUser(item: Misskey.entities.UsersListsGetMembershipsResponse[number], ev: PointerEvent) {
	os.popupMenu([{
		text: globalLocale.value.env.remove,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			if (!list.value) return;
			const listId = list.value.id;
			misskeyApi('users/lists/pull', {
				listId,
				userId: item.userId,
			}).then(() => {
				if (list.value?.id === listId) {
					const index = list.value.userIds?.indexOf(item.userId) ?? -1;
					if (index !== -1) list.value.userIds?.splice(index, 1);
				}
				membershipsPaginator.removeItem(item.id);
				userListsCache.delete();
			});
		},
	}], ev.currentTarget ?? ev.target);
}

async function showMembershipMenu(item: Misskey.entities.UsersListsGetMembershipsResponse[number], ev: PointerEvent) {
	const withRepliesRef = ref(item.withReplies);

	os.popupMenu([{
		type: 'switch',
		text: globalLocale.value.env.showRepliesToOthersInTimeline,
		icon: 'ti ti-messages',
		ref: withRepliesRef,
	}], ev.currentTarget ?? ev.target);

	watch(withRepliesRef, withReplies => {
		misskeyApi('users/lists/update-membership', {
			listId: list.value!.id,
			userId: item.userId,
			withReplies,
		}).then(() => {
			membershipsPaginator.updateItem(item.id, (old) => ({
				...old,
				withReplies,
			}));
		});
	});
}

async function deleteList() {
	if (!list.value) return;
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters(globalLocale.value.env.removeAreYouSure, { x: list.value.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('users/lists/delete', {
		listId: list.value.id,
	});
	userListsCache.delete();
	router.push('/my/lists');
}

async function updateSettings() {
	if (!list.value) return;
	await os.apiWithDialog('users/lists/update', {
		listId: list.value.id,
		name: name.value,
		isPublic: isPublic.value,
	});

	userListsCache.delete();

	list.value.name = name.value;
	list.value.isPublic = isPublic.value;
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = computed(() => list.value ? [{
	icon: 'ti ti-timeline',
	text: globalLocale.value.env.timeline,
	handler: () => {
		router.push('/timeline/list/:listId', {
			params: {
				listId: list.value!.id,
			},
		});
	},
}] : []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: list.value ? list.value.name : globalLocale.value.env.lists,
	icon: 'ti ti-list',
}));
</script>

<style lang="scss" module>
.userItem {
	display: flex;
}

.userItemBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}

.remove {
	width: 32px;
	height: 32px;
	align-self: center;
}

.menu {
	width: 32px;
	height: 32px;
	align-self: center;
}

.more {
	margin-left: auto;
	margin-right: auto;
}

.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"members": "الأعضاء",
	"nUsers": "{n} مستخدم",
	"addUser": "اضافة مستخدم"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"members": "Membres",
	"nUsers": "{n} Usuaris",
	"addUser": "Afegir un usuari"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"members": "Členové",
	"nUsers": "{n} užívatelů",
	"addUser": "Přidat uživatele"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"members": "Mitglieder",
	"nUsers": "{n} Benutzer",
	"addUser": "Benutzer hinzufügen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"members": "Miembros",
	"nUsers": "{n} Usuarios",
	"addUser": "Agregar usuario"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"members": "Membres",
	"nUsers": "{n} utilisateur·rice·s",
	"addUser": "Ajouter un·e utilisateur·rice"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"members": "Anggota",
	"nUsers": "{n} Pengguna",
	"addUser": "Tambah pengguna"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"members": "Membri",
	"nUsers": "{n} profili",
	"addUser": "Aggiungi profilo"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"members": "メンバー",
	"nUsers": "{n}ユーザー",
	"addUser": "ユーザーを追加"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"members": "メンバーはん",
	"nUsers": "{n}ユーザー",
	"addUser": "ユーザーを追加や"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"members": "멤버",
	"nUsers": "{n} 유저",
	"addUser": "유저 추가"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"members": "Leden",
	"nUsers": "{n} Gebruikers",
	"addUser": "Toevoegen gebruiker"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"members": "Medlemmer",
	"nUsers": "{n} Users",
	"addUser": "Legg til bruker"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"members": "Członkowie",
	"nUsers": "{n} użytkowników",
	"addUser": "Dodaj użytkownika"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"members": "Membros",
	"nUsers": "{n} Usuários",
	"addUser": "Adicionar usuário"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"members": "Участники",
	"nUsers": "Пользователей: {n}",
	"addUser": "Добавить пользователя"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"members": "Členovia",
	"nUsers": "{n} používateľov",
	"addUser": "Pridať používateľa"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"members": "สมาชิก",
	"nUsers": "{n} ผู้ใช้งาน",
	"addUser": "เพิ่มผู้ใช้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"members": "Üyeler",
	"nUsers": "{n} Kullanıcı",
	"addUser": "Kullanıcı ekle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"members": "Учасники",
	"nUsers": "{n} Користувачів",
	"addUser": "Додати користувача"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"members": "Thành viên",
	"nUsers": "{n} Người",
	"addUser": "Thêm người dùng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"members": "成员",
	"nUsers": "{n} 位用户",
	"addUser": "添加用户"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"members": "成員",
	"nUsers": "{n} 使用者",
	"addUser": "新增使用者"
}
</locale>
