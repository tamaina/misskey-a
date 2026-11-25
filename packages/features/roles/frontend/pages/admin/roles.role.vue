<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<div class="_buttons">
				<MkButton primary rounded @click="edit"><i class="ti ti-pencil"></i> {{ globalLocale.env.edit }}</MkButton>
				<MkButton danger rounded @click="del"><i class="ti ti-trash"></i> {{ globalLocale.env.delete }}</MkButton>
			</div>
			<MkFolder>
				<template #icon><i class="ti ti-info-circle"></i></template>
				<template #label>{{ globalLocale.env.info }}</template>
				<XEditor :modelValue="role" readonly/>
			</MkFolder>
			<MkFolder v-if="role.target === 'manual'" defaultOpen>
				<template #icon><i class="ti ti-users"></i></template>
				<template #label>{{ globalLocale.env.users }}</template>
				<template #suffix>{{ role.usersCount }}</template>
				<div class="_gaps">
					<MkButton primary rounded @click="assign"><i class="ti ti-plus"></i> {{ $locale.sfc.assign }}</MkButton>

					<MkPagination :paginator="usersPaginator">
						<template #empty><MkResult type="empty" :text="$locale.sfc.noUsers"/></template>

						<template #default="{ items }">
							<div class="_gaps_s">
								<div v-for="item in items" :key="item.user.id" :class="[$style.userItem, { [$style.userItemOpened]: expandedItemIds.includes(item.id) }]">
									<div :class="$style.userItemMain">
										<MkA :class="$style.userItemMainBody" :to="`/admin/user/${item.user.id}`">
											<MkUserCardMini :user="item.user"/>
										</MkA>
										<button class="_button" :class="$style.userToggle" @click="toggleItem(item.id)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
										<button class="_button" :class="$style.unassign" @click="unassign(item.user.id, $event)"><i class="ti ti-x"></i></button>
									</div>
									<div v-if="expandedItemIds.includes(item.id)" :class="$style.userItemSub">
										<div>Assigned: <MkTime :time="item.createdAt" mode="detail"/></div>
										<div v-if="item.expiresAt">Period: {{ new Date(item.expiresAt).toLocaleString() }}</div>
										<div v-else>Period: {{ globalLocale.env.indefinitely }}</div>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</div>
			</MkFolder>
			<MkInfo v-else>{{ $locale.sfc.roleIsConditionalRole }}</MkInfo>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, markRaw, reactive, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XEditor from '@features/roles/frontend/pages/admin/roles.editor.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const router = useRouter();

const props = defineProps<{
	id: string;
}>();

const usersPaginator = markRaw(new Paginator('admin/roles/users', {
	limit: 20,
	computedParams: computed(() => props.id ? ({
		roleId: props.id,
	}) : undefined),
}));

const expandedItemIds = ref<Misskey.entities.AdminRolesUsersResponse[number]['id'][]>([]);

const role = reactive(await misskeyApi('admin/roles/show', {
	roleId: props.id,
}));

function edit() {
	router.push('/admin/roles/:id/edit', {
		params: {
			id: role.id,
		},
	});
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters(globalLocale.value.env.deleteAreYouSure, { x: role.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('admin/roles/delete', {
		roleId: role.id,
	});

	router.push('/admin/roles');
}

async function assign() {
	const user = await os.selectUser({ includeSelf: true });

	const { canceled: canceled2, result: period } = await os.select({
		title: globalLocale.value.env.period + ': ' + role.name,
		items: [{
			value: 'indefinitely', label: globalLocale.value.env.indefinitely,
		}, {
			value: 'oneHour', label: globalLocale.value.env.oneHour,
		}, {
			value: 'oneDay', label: globalLocale.value.env.oneDay,
		}, {
			value: 'oneWeek', label: globalLocale.value.env.oneWeek,
		}, {
			value: 'oneMonth', label: globalLocale.value.env.oneMonth,
		}],
		default: 'indefinitely',
	});
	if (canceled2) return;

	const expiresAt = period === 'indefinitely' ? null
		: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
		: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
		: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
		: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
		: null;

	await os.apiWithDialog('admin/roles/assign', { roleId: role.id, userId: user.id, expiresAt });
	//role.users.push(user);
	usersPaginator.reload();
}

async function unassign(userId: Misskey.entities.User['id'], ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.unassign,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			await os.apiWithDialog('admin/roles/unassign', { roleId: role.id, userId: userId });
			//role.users = role.users.filter(u => u.id !== userId);
			usersPaginator.reload();
		},
	}], ev.currentTarget ?? ev.target);
}

async function toggleItem(itemId: string) {
	if (expandedItemIds.value.includes(itemId)) {
		expandedItemIds.value = expandedItemIds.value.filter(x => x !== itemId);
	} else {
		expandedItemIds.value.push(itemId);
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: `${$locale.value.sfc.role}: ${role.name}`,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>
.userItemMain {
	display: flex;
}

.userItemSub {
	padding: 6px 12px;
	font-size: 85%;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.userItemMainBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}

.userToggle,
.unassign {
	width: 32px;
	height: 32px;
	align-self: center;
}

.chevron {
	display: block;
	transition: transform 0.1s ease-out;
}

.userItem.userItemOpened {
	.chevron {
		transform: rotateX(180deg);
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"assign": "أسند",
	"noUsers": "ليس هناك مستخدمون",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "ألغ الإسناد",
	"role": "الدور"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"assign": "Assignar ",
	"noUsers": "No hi ha usuaris",
	"roleIsConditionalRole": "Aquest és un rol condicional",
	"unassign": "Treure",
	"role": "Rols"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"assign": "Přiřadit",
	"noUsers": "Žádní uživatelé",
	"roleIsConditionalRole": "Tato role je podmíněná.",
	"unassign": "Zrušit přirazení",
	"role": "Role"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"assign": "Assign",
	"noUsers": "There are no users",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"assign": "Zuweisen",
	"noUsers": "Keine Benutzer gefunden",
	"roleIsConditionalRole": "Dies ist eine konditionale Rolle.",
	"unassign": "Entfernen",
	"role": "Rolle"
}
</locale>

<locale lang="json" locale="en-US">
{
	"assign": "Assign",
	"noUsers": "There are no users",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"assign": "Asignar",
	"noUsers": "No hay usuarios",
	"roleIsConditionalRole": "Esto es un rol condicional",
	"unassign": "Quitar",
	"role": "Rol"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"assign": "Attribuer",
	"noUsers": "Il n’y a pas d’utilisateur·rice·s",
	"roleIsConditionalRole": "Ceci est un rôle conditionnel.",
	"unassign": "Retirer",
	"role": "Rôles"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"assign": "Tetapkan\n",
	"noUsers": "Tidak ada pengguna",
	"roleIsConditionalRole": "Ini adalah peran kondisional",
	"unassign": "Batalkan penetapan",
	"role": "Peran"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"assign": "Assegna",
	"noUsers": "Non ci sono profili",
	"roleIsConditionalRole": "Questo è un ruolo condizionato",
	"unassign": "Disassegna",
	"role": "Ruolo"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"assign": "アサイン",
	"noUsers": "ユーザーはいません",
	"roleIsConditionalRole": "これはコンディショナルロールです。",
	"unassign": "アサインを解除",
	"role": "ロール"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"assign": "アサイン",
	"noUsers": "ユーザーはおらん",
	"roleIsConditionalRole": "これはコンディショナルロールやで",
	"unassign": "アサインやめる",
	"role": "ロール"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"assign": "Assign",
	"noUsers": "There are no users",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"assign": "Assign",
	"noUsers": "There are no users",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"assign": "할당",
	"noUsers": "아무도 없습니다",
	"roleIsConditionalRole": "조건부 역할입니다.",
	"unassign": "할당 취소",
	"role": "역할"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"assign": "Assign",
	"noUsers": "Er zijn geen gebruikers.",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"assign": "Assign",
	"noUsers": "Det er ingen brukere",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Rolle"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"assign": "Przydziel",
	"noUsers": "Brak użytkowników",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Cofnij przydzielenie",
	"role": "Rola"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"assign": "Atribuir",
	"noUsers": "Sem usuários",
	"roleIsConditionalRole": "Este é um cargo condicional.",
	"unassign": "Remover",
	"role": "Cargo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"assign": "Назначить",
	"noUsers": "Нет ни одного пользователя",
	"roleIsConditionalRole": "Эта роль выдаётся по условию.",
	"unassign": "Отменить назначение",
	"role": "Роль"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"assign": "Assign",
	"noUsers": "Žiadni používatelia",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"assign": "มอบหมาย",
	"noUsers": "ไม่พบผู้ใช้งาน",
	"roleIsConditionalRole": "นี่คือบทบาทที่มีเงื่อนไข",
	"unassign": "เลิกมอบหมาย",
	"role": "บทบาท"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"assign": "Atama",
	"noUsers": "Kullanıcı yok",
	"roleIsConditionalRole": "Bu, koşullu bir roldür.",
	"unassign": "Atamayı kaldır",
	"role": "Rol"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"assign": "Assign",
	"noUsers": "There are no users",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"assign": "Призначити",
	"noUsers": "Немає користувачів",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Скасувати призначення",
	"role": "Роль"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"assign": "Phân công",
	"noUsers": "Chưa có ai",
	"roleIsConditionalRole": "This is a conditional role.",
	"unassign": "Hủy phân công",
	"role": "Vai trò"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"assign": "分配",
	"noUsers": "无用户",
	"roleIsConditionalRole": "这是一个条件控制的角色。",
	"unassign": "取消分配",
	"role": "角色"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"assign": "指派",
	"noUsers": "沒有任何使用者",
	"roleIsConditionalRole": "這是條件角色。",
	"unassign": "取消指派",
	"role": "角色"
}
</locale>
