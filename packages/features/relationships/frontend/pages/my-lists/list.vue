<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="list" class="_gaps">
			<MkFolder>
				<template #label>{{ $locale.sfc.settings }}</template>

				<div class="_gaps">
					<MkInput v-model="name">
						<template #label>{{ $locale.sfc.name }}</template>
					</MkInput>
					<MkSwitch v-model="isPublic">{{ $locale.sfc.public }}</MkSwitch>
					<div class="_buttons">
						<MkButton rounded primary @click="updateSettings">{{ $locale.sfc.save }}</MkButton>
						<MkButton rounded danger @click="deleteList()">{{ $locale.sfc.delete }}</MkButton>
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
		text: $locale.value.sfc.remove,
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
		text: $locale.value.sfc.showRepliesToOthersInTimeline,
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
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: list.value.name }),
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
	text: $locale.value.sfc.timeline,
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
	title: list.value ? list.value.name : $locale.value.sfc.lists,
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
	"remove": "حذف",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"timeline": "الخيط الزمني",
	"lists": "القوائم",
	"settings": "الاعدادات",
	"name": "الإسم",
	"public": "علني",
	"save": "حفظ",
	"delete": "حذف",
	"members": "الأعضاء",
	"nUsers": "{n} مستخدم",
	"addUser": "اضافة مستخدم"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"remove": "Eliminar",
	"showRepliesToOthersInTimeline": "Mostrar les respostes a altres a la línia de temps",
	"removeAreYouSure": "Segur que vols esborrar «{x}»?",
	"timeline": "Línia de temps",
	"lists": "Llistes",
	"settings": "Preferències",
	"name": "Nom",
	"public": "Públic ",
	"save": "Desa",
	"delete": "Elimina",
	"members": "Membres",
	"nUsers": "{n} Usuaris",
	"addUser": "Afegir un usuari"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"remove": "Smazat",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"timeline": "Časová osa",
	"lists": "Seznamy",
	"settings": "Nastavení",
	"name": "Jméno",
	"public": "Veřejný",
	"save": "Uložit",
	"delete": "Smazat",
	"members": "Členové",
	"nUsers": "{n} užívatelů",
	"addUser": "Přidat uživatele"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"remove": "Delete",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"timeline": "Timeline",
	"lists": "Lists",
	"settings": "Settings",
	"name": "Name",
	"public": "Public",
	"save": "Save",
	"delete": "Delete",
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"remove": "Löschen",
	"showRepliesToOthersInTimeline": "Antworten in Chronik anzeigen",
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?",
	"timeline": "Chronik",
	"lists": "Listen",
	"settings": "Einstellungen",
	"name": "Name",
	"public": "Öffentlich",
	"save": "Speichern",
	"delete": "Löschen",
	"members": "Mitglieder",
	"nUsers": "{n} Benutzer",
	"addUser": "Benutzer hinzufügen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"remove": "Delete",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"timeline": "Timeline",
	"lists": "Lists",
	"settings": "Settings",
	"name": "Name",
	"public": "Public",
	"save": "Save",
	"delete": "Delete",
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"remove": "Borrar",
	"showRepliesToOthersInTimeline": "Mostrar respuestas a otros en la línea de tiempo",
	"removeAreYouSure": "¿Desea borrar \"{x}\"?",
	"timeline": "Línea de tiempo",
	"lists": "Listas",
	"settings": "Configuración",
	"name": "Nombre",
	"public": "Público",
	"save": "Guardar",
	"delete": "Borrar",
	"members": "Miembros",
	"nUsers": "{n} Usuarios",
	"addUser": "Agregar usuario"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"remove": "Supprimer",
	"showRepliesToOthersInTimeline": "Afficher les réponses aux autres dans le fil",
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?",
	"timeline": "Fil",
	"lists": "Listes",
	"settings": "Paramètres",
	"name": "Nom",
	"public": "Public",
	"save": "Enregistrer",
	"delete": "Supprimer",
	"members": "Membres",
	"nUsers": "{n} utilisateur·rice·s",
	"addUser": "Ajouter un·e utilisateur·rice"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"remove": "Hapus",
	"showRepliesToOthersInTimeline": "Tampilkan balasan ke pengguna lain dalam lini masa",
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"timeline": "Lini masa",
	"lists": "Daftar",
	"settings": "Pengaturan",
	"name": "Nama",
	"public": "Publik",
	"save": "Simpan",
	"delete": "Hapus",
	"members": "Anggota",
	"nUsers": "{n} Pengguna",
	"addUser": "Tambah pengguna"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"remove": "Elimina",
	"showRepliesToOthersInTimeline": "Risposte altrui nella TL",
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"timeline": "Timeline",
	"lists": "Liste",
	"settings": "Impostazioni",
	"name": "Nome",
	"public": "Pubblica",
	"save": "Salva",
	"delete": "Elimina",
	"members": "Membri",
	"nUsers": "{n} profili",
	"addUser": "Aggiungi profilo"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"remove": "削除",
	"showRepliesToOthersInTimeline": "TLに他の人への返信を含める",
	"removeAreYouSure": "「{x}」を削除しますか？",
	"timeline": "タイムライン",
	"lists": "リスト",
	"settings": "設定",
	"name": "名前",
	"public": "パブリック",
	"save": "保存",
	"delete": "削除",
	"members": "メンバー",
	"nUsers": "{n}ユーザー",
	"addUser": "ユーザーを追加"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"remove": "ほかす",
	"showRepliesToOthersInTimeline": "タイムラインに他の人への返信とかも入れるで",
	"removeAreYouSure": "「{x}」はほかしてええか？",
	"timeline": "タイムライン",
	"lists": "リスト",
	"settings": "設定",
	"name": "名前",
	"public": "パブリック",
	"save": "とっとく",
	"delete": "ほかす",
	"members": "メンバーはん",
	"nUsers": "{n}ユーザー",
	"addUser": "ユーザーを追加や"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"remove": "Kkes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"timeline": "Timeline",
	"lists": "Tibdarin",
	"settings": "Iɣewwaṛen",
	"name": "Name",
	"public": "Public",
	"save": "Sekles",
	"delete": "Kkes",
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"remove": "ಅಳಿಸು",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"timeline": "ಸಮಯಸಾಲು",
	"lists": "Lists",
	"settings": "ಸಿದ್ಧತೆಗಳು",
	"name": "Name",
	"public": "Public",
	"save": "ಉಳಿಸಿ",
	"delete": "ಅಳಿಸು",
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"remove": "삭제",
	"showRepliesToOthersInTimeline": "타임라인에 다른 사람에게 보내는 답글을 포함",
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"timeline": "타임라인",
	"lists": "리스트",
	"settings": "설정",
	"name": "이름",
	"public": "공개",
	"save": "저장",
	"delete": "삭제",
	"members": "멤버",
	"nUsers": "{n} 유저",
	"addUser": "유저 추가"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"remove": "Verwijderen",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"timeline": "Tijdlijn",
	"lists": "Lijsten",
	"settings": "Instellingen",
	"name": "Naam",
	"public": "Openbare",
	"save": "Opslaan",
	"delete": "Verwijderen",
	"members": "Leden",
	"nUsers": "{n} Gebruikers",
	"addUser": "Toevoegen gebruiker"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"remove": "Slett",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?",
	"timeline": "Tidslinje",
	"lists": "Lister",
	"settings": "Innstillinger",
	"name": "Navn",
	"public": "Public",
	"save": "Lagre",
	"delete": "Slett",
	"members": "Medlemmer",
	"nUsers": "{n} Users",
	"addUser": "Legg til bruker"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"remove": "Usuń",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"timeline": "Oś czasu",
	"lists": "Listy",
	"settings": "Ustawienia",
	"name": "Nazwa",
	"public": "Publiczny",
	"save": "Zapisz",
	"delete": "Usuń",
	"members": "Członkowie",
	"nUsers": "{n} użytkowników",
	"addUser": "Dodaj użytkownika"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"remove": "Remover",
	"showRepliesToOthersInTimeline": "Mostrar respostas aos outros na linha do tempo",
	"removeAreYouSure": "Deseja excluir \"{x}\"?",
	"timeline": "Linha do tempo",
	"lists": "Listas",
	"settings": "Configurações",
	"name": "Nome",
	"public": "Público",
	"save": "Salvar",
	"delete": "Excluir",
	"members": "Membros",
	"nUsers": "{n} Usuários",
	"addUser": "Adicionar usuário"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"remove": "Удалить",
	"showRepliesToOthersInTimeline": "Показывать ответы в ленте",
	"removeAreYouSure": "Хотите удалить «{x}»?",
	"timeline": "Лента",
	"lists": "Списки",
	"settings": "Настройки",
	"name": "Название",
	"public": "Общедоступно",
	"save": "Сохранить",
	"delete": "Удалить",
	"members": "Участники",
	"nUsers": "Пользователей: {n}",
	"addUser": "Добавить пользователя"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"remove": "Odstrániť",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"timeline": "Časová os",
	"lists": "Zoznamy",
	"settings": "Nastavenia",
	"name": "Názov",
	"public": "Verejné",
	"save": "Uložiť",
	"delete": "Odstrániť",
	"members": "Členovia",
	"nUsers": "{n} používateľov",
	"addUser": "Pridať používateľa"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"remove": "ลบ",
	"showRepliesToOthersInTimeline": "แสดงการตอบกลับผู้อื่นลงในไทม์ไลน์",
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"timeline": "ไทม์ไลน์",
	"lists": "รายชื่อ",
	"settings": "การตั้งค่า",
	"name": "ชื่อ",
	"public": "สาธารณะ",
	"save": "บันทึก",
	"delete": "ลบ",
	"members": "สมาชิก",
	"nUsers": "{n} ผู้ใช้งาน",
	"addUser": "เพิ่มผู้ใช้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"remove": "Sil",
	"showRepliesToOthersInTimeline": "Pano'da diğer kişilere verilen yanıtları göster",
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?",
	"timeline": "Pano",
	"lists": "Listeler",
	"settings": "Ayarlar",
	"name": "İsim",
	"public": "Herkese açık",
	"save": "Kaydet",
	"delete": "Sil",
	"members": "Üyeler",
	"nUsers": "{n} Kullanıcı",
	"addUser": "Kullanıcı ekle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"remove": "ئۆچۈرۈش",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"timeline": "Timeline",
	"lists": "Lists",
	"settings": "Settings",
	"name": "Name",
	"public": "Public",
	"save": "Save",
	"delete": "ئۆچۈرۈش",
	"members": "Members",
	"nUsers": "{n} Users",
	"addUser": "Add a user"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"remove": "Видалити",
	"showRepliesToOthersInTimeline": "Показувати відповіді іншим у стрічці",
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"timeline": "Стрічка",
	"lists": "Списки",
	"settings": "Налаштування",
	"name": "Ім'я",
	"public": "Публічний",
	"save": "Зберегти",
	"delete": "Видалити",
	"members": "Учасники",
	"nUsers": "{n} Користувачів",
	"addUser": "Додати користувача"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"remove": "Xóa",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?",
	"timeline": "Bảng tin",
	"lists": "Danh sách",
	"settings": "Cài đặt",
	"name": "Tên",
	"public": "Công khai",
	"save": "Lưu",
	"delete": "Xóa",
	"members": "Thành viên",
	"nUsers": "{n} Người",
	"addUser": "Thêm người dùng"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"remove": "删除",
	"showRepliesToOthersInTimeline": "在时间线中显示对他人的回复",
	"removeAreYouSure": "要删掉「{x}」吗？",
	"timeline": "时间线",
	"lists": "列表",
	"settings": "设置",
	"name": "名称",
	"public": "公开",
	"save": "保存",
	"delete": "删除",
	"members": "成员",
	"nUsers": "{n} 位用户",
	"addUser": "添加用户"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"remove": "刪除",
	"showRepliesToOthersInTimeline": "在時間軸上顯示給其他人的回覆",
	"removeAreYouSure": "確定要刪掉「{x}」嗎？",
	"timeline": "時間軸",
	"lists": "清單",
	"settings": "設定",
	"name": "名稱",
	"public": "公開",
	"save": "儲存",
	"delete": "刪除",
	"members": "成員",
	"nUsers": "{n} 使用者",
	"addUser": "新增使用者"
}
</locale>
