<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkTip k="userLists">
				{{ $locale.sfc.tip }}
			</MkTip>

			<MkResult v-if="items.length === 0" type="empty"/>

			<MkButton primary rounded style="margin: 0 auto;" @click="create"><i class="ti ti-plus"></i> {{ $locale.sfc.createList }}</MkButton>

			<div v-if="items.length > 0" class="_gaps">
				<MkA v-for="list in items" :key="list.id" class="_panel" :class="$style.list" :to="`/timeline/list/${list.id}`">
					<div style="margin-bottom: 4px;">{{ list.name }} <span :class="$style.nUsers">({{ interpolateLocaleParameters($locale.sfc.nUsers, { n: `${list.userIds!.length}/${$i.policies['userEachUserListsLimit']}` }) }})</span></div>
					<MkAvatars :userIds="list.userIds!" :limit="10"/>
				</MkA>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkAvatars from '@features/users/frontend/components/MkAvatars.vue';
import * as os from '@features/ui/frontend/os.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { userListsCache } from '@features/runtime/frontend/cache.js';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const items = computed(() => userListsCache.value.value ?? []);

function _fetch_() {
	userListsCache.fetch();
}

_fetch_();

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: $locale.value.sfc.enterListName,
	});
	if (canceled || name == null) return;
	await os.apiWithDialog('users/lists/create', { name: name });
	userListsCache.delete();
	_fetch_();
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: $locale.value.sfc.reload,
	handler: () => {
		userListsCache.delete();
		_fetch_();
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.manageLists,
	icon: 'ti ti-list',
}));

onActivated(() => {
	_fetch_();
});
</script>

<style lang="scss" module>
.list {
	display: block;
	padding: 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;
	margin-bottom: 8px;

	&:hover {
		border: solid 1px var(--MI_THEME-accent);
		text-decoration: none;
	}
}

.nUsers {
	font-size: .9em;
	opacity: .7;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"enterListName": "اسم القائمة",
	"reload": "انعش",
	"manageLists": "إدارة القوائم",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "إنشاء قائمة",
	"nUsers": "{n} مستخدم"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"enterListName": "Introdueix un nom per a la llista",
	"reload": "Actualitzar",
	"manageLists": "Gestionar les llistes",
	"tip": "Es poden crear llistes amb qualsevol usuari. La llista creada es pot mostrar com una línia de temps.",
	"createList": "Crear llista",
	"nUsers": "{n} Usuaris"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"enterListName": "Jméno seznamu",
	"reload": "Aktualizovat",
	"manageLists": "Spravovat seznam",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Vytvořit seznam",
	"nUsers": "{n} užívatelů"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"enterListName": "Enter a name for the list",
	"reload": "Refresh",
	"manageLists": "Manage lists",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Create list",
	"nUsers": "{n} Users"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"enterListName": "Listennamen eingeben",
	"reload": "Aktualisieren",
	"manageLists": "Listen verwalten",
	"tip": "Es können Listen mit beliebigen Benutzern erstellt werden. Die erstellte Liste kann als eigene Chronik angezeigt werden.",
	"createList": "Liste erstellen",
	"nUsers": "{n} Benutzer"
}
</locale>

<locale lang="json" locale="en-US">
{
	"enterListName": "Enter a name for the list",
	"reload": "Refresh",
	"manageLists": "Manage lists",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Create list",
	"nUsers": "{n} Users"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"enterListName": "Introduce un nombre para la lista",
	"reload": "Recargar",
	"manageLists": "Administrar listas",
	"tip": "Puedes crear listas que incluyan a cualquier usuario. Las listas creadas se pueden visualizar en forma de cronología.",
	"createList": "Crear lista",
	"nUsers": "{n} Usuarios"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"enterListName": "Nom de la liste",
	"reload": "Rafraîchir",
	"manageLists": "Gérer les listes",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Créer une liste",
	"nUsers": "{n} utilisateur·rice·s"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"enterListName": "Masukkan nama daftar",
	"reload": "Muat ulang",
	"manageLists": "Sunting daftar",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Buat daftar",
	"nUsers": "{n} Pengguna"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"enterListName": "Nome della lista",
	"reload": "Ricarica",
	"manageLists": "Gestisci liste",
	"tip": "Puoi creare un elenco di Note create da qualsiasi profilo. L'elenco è visualizzato come una sequenza temporale.",
	"createList": "Aggiungi una nuova lista",
	"nUsers": "{n} profili"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"enterListName": "リスト名を入力",
	"reload": "リロード",
	"manageLists": "リストの管理",
	"tip": "任意のユーザーが含まれるリストを作成できます。作成したリストはタイムラインとして表示可能です。",
	"createList": "リスト作成",
	"nUsers": "{n}ユーザー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"enterListName": "リスト名を入れてや",
	"reload": "リロード",
	"manageLists": "リストの管理",
	"tip": "好きなユーザーを含むリストを作れるねん。作ったリストはタイムラインとして表示できるで。",
	"createList": "リスト作る",
	"nUsers": "{n}ユーザー"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"enterListName": "Isem n tebdart",
	"reload": "Refresh",
	"manageLists": "Manage lists",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Snulfu-d tabdart",
	"nUsers": "{n} Users"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"enterListName": "Enter a name for the list",
	"reload": "Refresh",
	"manageLists": "Manage lists",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Create list",
	"nUsers": "{n} Users"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"enterListName": "리스트 이름을 입력",
	"reload": "새로고침",
	"manageLists": "리스트 관리",
	"tip": "임의의 유저가 포함된 리스트를 작성할 수 있습니다. 작성한 리스트는 타임라인으로 표시가 가능합니다.",
	"createList": "리스트 만들기",
	"nUsers": "{n} 유저"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"enterListName": "Voer de naam van de lijst in",
	"reload": "Verversen",
	"manageLists": "Beheren lijsten",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Creëer lijst",
	"nUsers": "{n} Gebruikers"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"enterListName": "Skriv inn et navn på listen",
	"reload": "Refresh",
	"manageLists": "Manage lists",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Opprett liste",
	"nUsers": "{n} Users"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"enterListName": "Nazwa listy",
	"reload": "Odśwież",
	"manageLists": "Zarządzaj listami",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Utwórz listę",
	"nUsers": "{n} użytkowników"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"enterListName": "Insira um nome para a lista",
	"reload": "Recarregar",
	"manageLists": "Gerenciar listas",
	"tip": "Listas podem conter qualquer usuário que você especificar em sua criação. A lista criada aparece como uma linha do tempo exibindo usuários selecionados.",
	"createList": "Criar lista",
	"nUsers": "{n} Usuários"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"enterListName": "Название списка",
	"reload": "Перезагрузить",
	"manageLists": "Управление списками",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Создать список",
	"nUsers": "Пользователей: {n}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"enterListName": "Zadajte názov zoznamu",
	"reload": "Obnoviť",
	"manageLists": "Spravovať zoznamy",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Vytvoriť zoznam",
	"nUsers": "{n} používateľov"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"enterListName": "ป้อนนามเรียกของรายชื่อชุดนี้",
	"reload": "รีโหลด",
	"manageLists": "จัดการรายชื่อ",
	"tip": "สามารถสร้างรายชื่อที่มีผู้ใช้ใดก็ได้ เมื่อสร้างแล้ว รายชื่อนั้นจะแสดงเป็นไทม์ไลน์ได้",
	"createList": "สร้างรายชื่อ",
	"nUsers": "{n} ผู้ใช้งาน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"enterListName": "Listeye bir ad girin",
	"reload": "Yenile",
	"manageLists": "Listeleri yönet",
	"tip": "Listeler, oluşturulurken belirttiğin herhangi bir kullanıcıyı içerebilir. Oluşturulan liste, yalnızca belirtilen kullanıcıları gösteren bir pano olarak görüntülenebilir.",
	"createList": "Liste oluştur",
	"nUsers": "{n} Kullanıcı"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"enterListName": "Enter a name for the list",
	"reload": "Refresh",
	"manageLists": "Manage lists",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Create list",
	"nUsers": "{n} Users"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"enterListName": "Введіть назву списку",
	"reload": "Оновити",
	"manageLists": "Управління списками",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Створити список",
	"nUsers": "{n} Користувачів"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"enterListName": "Đặt tên cho danh sách",
	"reload": "Tải lại",
	"manageLists": "Quản lý danh sách",
	"tip": "Lists can contain any user you specify when creating, the created list can then be displayed as a timeline showing only the specified users.",
	"createList": "Tạo danh sách",
	"nUsers": "{n} Người"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"enterListName": "输入列表名称",
	"reload": "刷新",
	"manageLists": "管理列表",
	"tip": "可创建包含任意用户的列表。已创建的列表可作为时间线查看。",
	"createList": "创建列表",
	"nUsers": "{n} 位用户"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"enterListName": "輸入清單名稱",
	"reload": "重新整理",
	"manageLists": "管理清單",
	"tip": "您可以建立包含任意使用者的清單。建立後的清單可以作為時間軸顯示。\n",
	"createList": "建立清單",
	"nUsers": "{n} 使用者"
}
</locale>
