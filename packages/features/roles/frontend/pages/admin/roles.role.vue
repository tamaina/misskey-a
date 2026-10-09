<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<div class="_buttons">
				<MkButton primary rounded @click="edit"><i class="ti ti-pencil"></i> {{ $locale.sfc.edit }}</MkButton>
				<MkButton danger rounded @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</div>
			<MkFolder>
				<template #icon><i class="ti ti-info-circle"></i></template>
				<template #label>{{ $locale.sfc.info }}</template>
				<XEditor :modelValue="role" readonly/>
			</MkFolder>
			<MkFolder v-if="role.target === 'manual'" defaultOpen>
				<template #icon><i class="ti ti-users"></i></template>
				<template #label>{{ $locale.sfc.users }}</template>
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
										<div v-else>Period: {{ $locale.sfc.indefinitely }}</div>
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
		text: interpolateLocaleParameters($locale.value.sfc.deleteAreYouSure, { x: role.name }),
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
		title: $locale.value.sfc.period + ': ' + role.name,
		items: [{
			value: 'indefinitely', label: $locale.value.sfc.indefinitely,
		}, {
			value: 'oneHour', label: $locale.value.sfc.oneHour,
		}, {
			value: 'oneDay', label: $locale.value.sfc.oneDay,
		}, {
			value: 'oneWeek', label: $locale.value.sfc.oneWeek,
		}, {
			value: 'oneMonth', label: $locale.value.sfc.oneMonth,
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
	"edit": "التعديل",
	"delete": "حذف",
	"info": "عن",
	"users": "المستخدمون",
	"assign": "أسند",
	"noUsers": "ليس هناك مستخدمون",
	"indefinitely": "أبدًا",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"period": "ينتهي استطلاع الرأي في",
	"oneHour": "ساعة",
	"oneDay": "يوم",
	"oneWeek": "أسبوع",
	"oneMonth": "شهر",
	"unassign": "ألغ الإسناد",
	"role": "الدور"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"edit": "Editar",
	"delete": "Elimina",
	"info": "Informació",
	"users": "Usuaris",
	"assign": "Assignar ",
	"noUsers": "No hi ha usuaris",
	"indefinitely": "Permanent",
	"roleIsConditionalRole": "Aquest és un rol condicional",
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?",
	"period": "Límit de temps",
	"oneHour": "1 hora",
	"oneDay": "Un dia",
	"oneWeek": "Una setmana",
	"oneMonth": "Un mes",
	"unassign": "Treure",
	"role": "Rols"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"edit": "Upravit",
	"delete": "Smazat",
	"info": "Informace",
	"users": "Uživatelé",
	"assign": "Přiřadit",
	"noUsers": "Žádní uživatelé",
	"indefinitely": "Navždy",
	"roleIsConditionalRole": "Tato role je podmíněná.",
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"period": "Časový limit",
	"oneHour": "1 hodina",
	"oneDay": "1 den",
	"oneWeek": "1 týden",
	"oneMonth": "1 měsíc",
	"unassign": "Zrušit přirazení",
	"role": "Role"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"edit": "Edit",
	"delete": "Delete",
	"info": "About",
	"users": "Users",
	"assign": "Assign",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"period": "Time limit",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"edit": "Bearbeiten",
	"delete": "Löschen",
	"info": "Über",
	"users": "Benutzer",
	"assign": "Zuweisen",
	"noUsers": "Keine Benutzer gefunden",
	"indefinitely": "Dauerhaft",
	"roleIsConditionalRole": "Dies ist eine konditionale Rolle.",
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?",
	"period": "Zeitlimit",
	"oneHour": "Eine Stunde",
	"oneDay": "Einen Tag",
	"oneWeek": "Eine Woche",
	"oneMonth": "1 Monat",
	"unassign": "Entfernen",
	"role": "Rolle"
}
</locale>

<locale lang="json" locale="en-US">
{
	"edit": "Edit",
	"delete": "Delete",
	"info": "About",
	"users": "Users",
	"assign": "Assign",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"period": "Time limit",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"edit": "Editar",
	"delete": "Borrar",
	"info": "Información",
	"users": "Usuarios",
	"assign": "Asignar",
	"noUsers": "No hay usuarios",
	"indefinitely": "Sin límite de tiempo",
	"roleIsConditionalRole": "Esto es un rol condicional",
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?",
	"period": "Termina el",
	"oneHour": "1 hora",
	"oneDay": "1 día",
	"oneWeek": "1 semana",
	"oneMonth": "1 mes",
	"unassign": "Quitar",
	"role": "Rol"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"edit": "Editer",
	"delete": "Supprimer",
	"info": "Informations",
	"users": "Utilisateur·rice·s",
	"assign": "Attribuer",
	"noUsers": "Il n’y a pas d’utilisateur·rice·s",
	"indefinitely": "Illimité",
	"roleIsConditionalRole": "Ceci est un rôle conditionnel.",
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?",
	"period": "Fin du sondage",
	"oneHour": "1 heure",
	"oneDay": "1 jour",
	"oneWeek": "1 semaine",
	"oneMonth": "Un mois",
	"unassign": "Retirer",
	"role": "Rôles"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"edit": "Sunting",
	"delete": "Hapus",
	"info": "Informasi",
	"users": "Pengguna",
	"assign": "Tetapkan\n",
	"noUsers": "Tidak ada pengguna",
	"indefinitely": "Selamanya",
	"roleIsConditionalRole": "Ini adalah peran kondisional",
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"period": "Batas akhir",
	"oneHour": "1 Jam",
	"oneDay": "1 Hari",
	"oneWeek": "1 Bulan",
	"oneMonth": "satu bulan",
	"unassign": "Batalkan penetapan",
	"role": "Peran"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"edit": "Modifica",
	"delete": "Elimina",
	"info": "Informazioni",
	"users": "Profili",
	"assign": "Assegna",
	"noUsers": "Non ci sono profili",
	"indefinitely": "Non scade",
	"roleIsConditionalRole": "Questo è un ruolo condizionato",
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"period": "Scadenza",
	"oneHour": "1 ora",
	"oneDay": "1 giorno",
	"oneWeek": "1 settimana",
	"oneMonth": "Un mese",
	"unassign": "Disassegna",
	"role": "Ruolo"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"edit": "編集",
	"delete": "削除",
	"info": "情報",
	"users": "ユーザー",
	"assign": "アサイン",
	"noUsers": "ユーザーはいません",
	"indefinitely": "無期限",
	"roleIsConditionalRole": "これはコンディショナルロールです。",
	"deleteAreYouSure": "「{x}」を削除しますか？",
	"period": "期限",
	"oneHour": "1時間",
	"oneDay": "1日",
	"oneWeek": "1週間",
	"oneMonth": "1ヶ月",
	"unassign": "アサインを解除",
	"role": "ロール"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"edit": "編集",
	"delete": "ほかす",
	"info": "情報",
	"users": "ユーザー",
	"assign": "アサイン",
	"noUsers": "ユーザーはおらん",
	"indefinitely": "無期限",
	"roleIsConditionalRole": "これはコンディショナルロールやで",
	"deleteAreYouSure": "「{x}」はほかしてええか？",
	"period": "期限",
	"oneHour": "1時間",
	"oneDay": "1日",
	"oneWeek": "1週間",
	"oneMonth": "1ヶ月",
	"unassign": "アサインやめる",
	"role": "ロール"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"edit": "Edit",
	"delete": "Kkes",
	"info": "About",
	"users": "Users",
	"assign": "Assign",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"period": "Time limit",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"edit": "Edit",
	"delete": "ಅಳಿಸು",
	"info": "About",
	"users": "ಬಳಕೆದಾರ",
	"assign": "Assign",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"period": "Time limit",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"edit": "편집",
	"delete": "삭제",
	"info": "정보",
	"users": "유저",
	"assign": "할당",
	"noUsers": "아무도 없습니다",
	"indefinitely": "무기한",
	"roleIsConditionalRole": "조건부 역할입니다.",
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"period": "기간",
	"oneHour": "1시간",
	"oneDay": "1일",
	"oneWeek": "일주일",
	"oneMonth": "1개월",
	"unassign": "할당 취소",
	"role": "역할"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"edit": "Bewerken",
	"delete": "Verwijderen",
	"info": "Over",
	"users": "Gebruikers",
	"assign": "Assign",
	"noUsers": "Er zijn geen gebruikers.",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"period": "Time limit",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"edit": "Rediger",
	"delete": "Slett",
	"info": "Infomasjon",
	"users": "Brukere",
	"assign": "Assign",
	"noUsers": "Det er ingen brukere",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?",
	"period": "Time limit",
	"oneHour": "1 time",
	"oneDay": "1 dag",
	"oneWeek": "1 uke",
	"oneMonth": "1 måned",
	"unassign": "Unassign",
	"role": "Rolle"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"edit": "Edytuj",
	"delete": "Usuń",
	"info": "Informacje",
	"users": "Użytkownicy",
	"assign": "Przydziel",
	"noUsers": "Brak użytkowników",
	"indefinitely": "Nigdy",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"period": "Ankieta kończy się",
	"oneHour": "1 godzina",
	"oneDay": "1 dzień",
	"oneWeek": "1 tydzień",
	"oneMonth": "jeden miesiąc",
	"unassign": "Cofnij przydzielenie",
	"role": "Rola"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"edit": "Editar",
	"delete": "Excluir",
	"info": "Informações",
	"users": "Usuários",
	"assign": "Atribuir",
	"noUsers": "Sem usuários",
	"indefinitely": "Indefinitivamente",
	"roleIsConditionalRole": "Este é um cargo condicional.",
	"deleteAreYouSure": "Deseja excluir \"{x}\"?",
	"period": "Data limite",
	"oneHour": "1 hora",
	"oneDay": "1 dia",
	"oneWeek": "1 semana",
	"oneMonth": "1 mês",
	"unassign": "Remover",
	"role": "Cargo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"edit": "Изменить",
	"delete": "Удалить",
	"info": "Описание",
	"users": "Пользователи",
	"assign": "Назначить",
	"noUsers": "Нет ни одного пользователя",
	"indefinitely": "вечно",
	"roleIsConditionalRole": "Эта роль выдаётся по условию.",
	"deleteAreYouSure": "Хотите удалить «{x}»?",
	"period": "Опрос длится",
	"oneHour": "1 час",
	"oneDay": "1 день",
	"oneWeek": "1 неделя",
	"oneMonth": "1 месяц",
	"unassign": "Отменить назначение",
	"role": "Роль"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"edit": "Upraviť",
	"delete": "Odstrániť",
	"info": "Informácie",
	"users": "Používatelia",
	"assign": "Assign",
	"noUsers": "Žiadni používatelia",
	"indefinitely": "Navždy",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"period": "Ukončiť hlasovanie",
	"oneHour": "1 hodina",
	"oneDay": "1 deň",
	"oneWeek": "1 týždeň",
	"oneMonth": "1 mesiac",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"edit": "แก้ไข",
	"delete": "ลบ",
	"info": "เกี่ยวกับ",
	"users": "ผู้ใช้",
	"assign": "มอบหมาย",
	"noUsers": "ไม่พบผู้ใช้งาน",
	"indefinitely": "ตลอดไป",
	"roleIsConditionalRole": "นี่คือบทบาทที่มีเงื่อนไข",
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"period": "ระยะเวลา",
	"oneHour": "1 ชั่วโมง",
	"oneDay": "1 วัน",
	"oneWeek": "1 สัปดาห์",
	"oneMonth": "หนึ่งเดือน",
	"unassign": "เลิกมอบหมาย",
	"role": "บทบาท"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"edit": "Düzenle",
	"delete": "Sil",
	"info": "Hakkında",
	"users": "Kullanıcılar",
	"assign": "Atama",
	"noUsers": "Kullanıcı yok",
	"indefinitely": "Kalıcı olarak",
	"roleIsConditionalRole": "Bu, koşullu bir roldür.",
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?",
	"period": "Zaman sınırı",
	"oneHour": "1 saat",
	"oneDay": "1 gün",
	"oneWeek": "1 hafta",
	"oneMonth": "1 ay",
	"unassign": "Atamayı kaldır",
	"role": "Rol"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"edit": "Edit",
	"delete": "ئۆچۈرۈش",
	"info": "About",
	"users": "Users",
	"assign": "Assign",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?",
	"period": "Time limit",
	"oneHour": "One hour",
	"oneDay": "One day",
	"oneWeek": "One week",
	"oneMonth": "One month",
	"unassign": "Unassign",
	"role": "Role"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"edit": "Редагувати",
	"delete": "Видалити",
	"info": "Інформація",
	"users": "Користувачі",
	"assign": "Призначити",
	"noUsers": "Немає користувачів",
	"indefinitely": "Ніколи",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"period": "Опитування закінчується",
	"oneHour": "1 година",
	"oneDay": "1 день",
	"oneWeek": "1 тиждень",
	"oneMonth": "1 місяць",
	"unassign": "Скасувати призначення",
	"role": "Роль"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"edit": "Sửa",
	"delete": "Xóa",
	"info": "Giới thiệu",
	"users": "Người dùng",
	"assign": "Phân công",
	"noUsers": "Chưa có ai",
	"indefinitely": "Vĩnh viễn",
	"roleIsConditionalRole": "This is a conditional role.",
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?",
	"period": "Thời hạn",
	"oneHour": "1 giờ",
	"oneDay": "1 ngày",
	"oneWeek": "1 tuần",
	"oneMonth": "1 tháng",
	"unassign": "Hủy phân công",
	"role": "Vai trò"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"edit": "编辑",
	"delete": "删除",
	"info": "关于",
	"users": "用户",
	"assign": "分配",
	"noUsers": "无用户",
	"indefinitely": "永久",
	"roleIsConditionalRole": "这是一个条件控制的角色。",
	"deleteAreYouSure": "要删掉「{x}」吗？",
	"period": "截止时间",
	"oneHour": "1 小时",
	"oneDay": "1天",
	"oneWeek": "1 周",
	"oneMonth": "1个月",
	"unassign": "取消分配",
	"role": "角色"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"edit": "編輯",
	"delete": "刪除",
	"info": "資訊",
	"users": "使用者",
	"assign": "指派",
	"noUsers": "沒有任何使用者",
	"indefinitely": "無期限",
	"roleIsConditionalRole": "這是條件角色。",
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？",
	"period": "期限",
	"oneHour": "一小時",
	"oneDay": "一天",
	"oneWeek": "一週",
	"oneMonth": "一個月",
	"unassign": "取消指派",
	"role": "角色"
}
</locale>
