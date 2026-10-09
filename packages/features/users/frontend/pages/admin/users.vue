<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div :class="$style.inputs">
				<MkButton style="margin-left: auto" @click="resetQuery">{{ $locale.sfc.reset }}</MkButton>
			</div>
			<div :class="$style.inputs">
				<MkSelect v-model="sort" :items="sortDef" style="flex: 1;">
					<template #label>{{ $locale.sfc.sort }}</template>
				</MkSelect>
				<MkSelect v-model="state" :items="stateDef" style="flex: 1;">
					<template #label>{{ $locale.sfc.state }}</template>
				</MkSelect>
				<MkSelect v-model="origin" :items="originDef" style="flex: 1;">
					<template #label>{{ $locale.sfc.instance }}</template>
				</MkSelect>
			</div>
			<div :class="$style.inputs">
				<MkInput v-model="searchUsername" style="flex: 1;" type="text" :spellcheck="false">
					<template #prefix>@</template>
					<template #label>{{ $locale.sfc.username }}</template>
				</MkInput>
				<MkInput v-model="searchHost" style="flex: 1;" type="text" :spellcheck="false" :disabled="paginator.computedParams?.value?.origin === 'local'">
					<template #prefix>@</template>
					<template #label>{{ $locale.sfc.host }}</template>
				</MkInput>
			</div>

			<MkPagination v-slot="{items}" :paginator="paginator">
				<div :class="$style.users">
					<MkA v-for="user in items" :key="user.id" v-tooltip.mfm="`Last posted: ${user.updatedAt ? dateString(user.updatedAt) : 'Unknown'}`" :class="$style.user" :to="`/admin/user/${user.id}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref, watchEffect } from 'vue';
import * as Misskey from 'misskey-js';
import { defaultMemoryStorage } from '@features/preferences/frontend/memory-storage';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import * as os from '@features/ui/frontend/os.js';
import { lookupUser } from '@features/moderation/frontend/utility/admin-lookup.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import { dateString } from '@features/ui/frontend/filters/date.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

type SearchQuery = {
	sort?: '-createdAt' | '+createdAt' | '-updatedAt' | '+updatedAt';
	state?: 'all' | 'available' | 'admin' | 'moderator' | 'suspended';
	origin?: 'combined' | 'local' | 'remote';
	username?: string;
	hostname?: string;
};

const storedQuery = JSON.parse(defaultMemoryStorage.getItem('admin-users-query') ?? '{}') as SearchQuery;

const {
	model: sort,
	def: sortDef,
} = useMkSelect({
	items: [
		{ label: `${$locale.value.sfc.registeredDate} (${$locale.value.sfc.ascendingOrder})`, value: '-createdAt' },
		{ label: `${$locale.value.sfc.registeredDate} (${$locale.value.sfc.descendingOrder})`, value: '+createdAt' },
		{ label: `${$locale.value.sfc.lastUsed} (${$locale.value.sfc.ascendingOrder})`, value: '-updatedAt' },
		{ label: `${$locale.value.sfc.lastUsed} (${$locale.value.sfc.descendingOrder})`, value: '+updatedAt' },
	],
	initialValue: storedQuery.sort ?? '+createdAt',
});
const {
	model: state,
	def: stateDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'all' },
		{ label: $locale.value.sfc.normal, value: 'available' },
		{ label: $locale.value.sfc.administrator, value: 'admin' },
		{ label: $locale.value.sfc.moderator, value: 'moderator' },
		{ label: $locale.value.sfc.suspend, value: 'suspended' },
	],
	initialValue: storedQuery.state ?? 'all',
});
const {
	model: origin,
	def: originDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'combined' },
		{ label: $locale.value.sfc.local, value: 'local' },
		{ label: $locale.value.sfc.remote, value: 'remote' },
	],
	initialValue: storedQuery.origin ?? 'local',
});
const searchUsername = ref(storedQuery.username ?? '');
const searchHost = ref(storedQuery.hostname ?? '');
const paginator = markRaw(new Paginator('admin/show-users', {
	limit: 10,
	computedParams: computed(() => ({
		sort: sort.value,
		state: state.value,
		origin: origin.value,
		username: searchUsername.value,
		hostname: searchHost.value,
	})),
	offsetMode: true,
}));

function searchUser() {
	os.selectUser({ includeSelf: true }).then(user => {
		show(user);
	});
}

async function addUser() {
	const { canceled: canceled1, result: username } = await os.inputText({
		title: $locale.value.sfc.username,
	});
	if (canceled1 || username == null) return;

	const { canceled: canceled2, result: password } = await os.inputText({
		title: $locale.value.sfc.password,
		type: 'password',
	});
	if (canceled2 || password == null) return;

	os.apiWithDialog('admin/accounts/create', {
		username: username,
		password: password,
	}).then(res => {
		paginator.reload();
	});
}

function show(user: Misskey.entities.UserDetailed) {
	os.pageWindow(`/admin/user/${user.id}`);
}

function resetQuery() {
	sort.value = '+createdAt';
	state.value = 'all';
	origin.value = 'local';
	searchUsername.value = '';
	searchHost.value = '';
}

const headerActions = computed(() => [{
	icon: 'ti ti-search',
	text: $locale.value.sfc.search,
	handler: searchUser,
}, {
	asFullButton: true,
	icon: 'ti ti-plus',
	text: $locale.value.sfc.addUser,
	handler: addUser,
}, {
	asFullButton: true,
	icon: 'ti ti-search',
	text: $locale.value.sfc.lookup,
	handler: lookupUser,
}]);

const headerTabs = computed(() => []);

watchEffect(() => {
	defaultMemoryStorage.setItem('admin-users-query', JSON.stringify({
		sort: sort.value,
		state: state.value,
		origin: origin.value,
		username: searchUsername.value,
		hostname: searchHost.value,
	}));
});

definePage(() => ({
	title: $locale.value.sfc.users,
	icon: 'ti ti-users',
}));
</script>

<style lang="scss" module>
.inputs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;

	> .user:hover {
		text-decoration: none;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"registeredDate": "انضم في",
	"ascendingOrder": "تصاعدي",
	"descendingOrder": "تنازلي",
	"lastUsed": "آخر استخدام",
	"all": "الكل",
	"normal": "عادي",
	"administrator": "المدير",
	"moderator": "مشرِف",
	"suspend": "علِق",
	"local": "المحلي",
	"remote": "بُعدي",
	"username": "اسم المستخدم",
	"password": "الكلمة السرية",
	"search": "البحث",
	"addUser": "اضافة مستخدم",
	"lookup": "البحث",
	"users": "المستخدمون",
	"reset": "Reset",
	"sort": "ترتيب حسب",
	"state": "الحالة",
	"instance": "مثيل الخادم",
	"host": "المضيف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"registeredDate": "Data de registre",
	"ascendingOrder": "Ascendent",
	"descendingOrder": "Descendent",
	"lastUsed": "Fet servir per última vegada",
	"all": "Tot",
	"normal": "Normal",
	"administrator": "Administrador/a",
	"moderator": "Moderador/a",
	"suspend": "Suspèn",
	"local": "Local",
	"remote": "Remot",
	"username": "Nom d'usuari",
	"password": "Contrasenya",
	"search": "Cercar",
	"addUser": "Afegir un usuari",
	"lookup": "Cerca",
	"users": "Usuaris",
	"reset": "Reiniciar",
	"sort": "Ordena",
	"state": "Estat",
	"instance": "Instància ",
	"host": "Amfitrió"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"registeredDate": "Datum registrace",
	"ascendingOrder": "Vzestupně",
	"descendingOrder": "Sestupně",
	"lastUsed": "Naposledy použito",
	"all": "Vše",
	"normal": "Normální",
	"administrator": "Administrátor",
	"moderator": "Moderátor",
	"suspend": "Zmrazit",
	"local": "Lokální",
	"remote": "Vzdálené",
	"username": "Uživatelské jméno",
	"password": "Heslo",
	"search": "Vyhledávání",
	"addUser": "Přidat uživatele",
	"lookup": "Vyhledat",
	"users": "Uživatelé",
	"reset": "Obnovit",
	"sort": "Seřadit",
	"state": "Stav",
	"instance": "Instance",
	"host": "Hostitel"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"registeredDate": "Joined on",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"lastUsed": "Last used",
	"all": "All",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Suspend",
	"local": "Local",
	"remote": "Remote",
	"username": "Username",
	"password": "Password",
	"search": "Search",
	"addUser": "Add a user",
	"lookup": "Lookup",
	"users": "Users",
	"reset": "Reset",
	"sort": "Sorting order",
	"state": "State",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"registeredDate": "Registrationsdatum",
	"ascendingOrder": "Aufsteigende Reihenfolge",
	"descendingOrder": "Absteigende Reihenfolge",
	"lastUsed": "Zuletzt benutzt",
	"all": "Alle",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Sperren",
	"local": "Lokal",
	"remote": "Fremd",
	"username": "Benutzername",
	"password": "Passwort",
	"search": "Suchen",
	"addUser": "Benutzer hinzufügen",
	"lookup": "Anfragen",
	"users": "Benutzer",
	"reset": "Zurücksetzen",
	"sort": "Sortieren",
	"state": "Status",
	"instance": "Instanz",
	"host": "Hostname"
}
</locale>

<locale locale="en-US" lang="json">
{
	"registeredDate": "Joined on",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"lastUsed": "Last used",
	"all": "All",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Suspend",
	"local": "Local",
	"remote": "Remote",
	"username": "Username",
	"password": "Password",
	"search": "Search",
	"addUser": "Add a user",
	"lookup": "Lookup",
	"users": "Users",
	"reset": "Reset",
	"sort": "Sorting order",
	"state": "State",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"registeredDate": "Fecha de registro",
	"ascendingOrder": "Ascendente",
	"descendingOrder": "Descendente",
	"lastUsed": "Última vez usado",
	"all": "Todo",
	"normal": "Normal",
	"administrator": "Administrador",
	"moderator": "Moderador",
	"suspend": "Suspender",
	"local": "Local",
	"remote": "Remoto",
	"username": "Nombre de usuario",
	"password": "Contraseña",
	"search": "Buscar",
	"addUser": "Agregar usuario",
	"lookup": "Búsqueda",
	"users": "Usuarios",
	"reset": "Restablecer",
	"sort": "Ordenar",
	"state": "Estado",
	"instance": "Instancia",
	"host": "Instancia"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"registeredDate": "Inscrit le",
	"ascendingOrder": "Ascendant",
	"descendingOrder": "Descendant",
	"lastUsed": "Dernier utilisé",
	"all": "Tous",
	"normal": "Normal",
	"administrator": "Administrateur",
	"moderator": "Modérateur·rice·s",
	"suspend": "Suspendre",
	"local": "Local",
	"remote": "Distant",
	"username": "Nom d’utilisateur·rice",
	"password": "Mot de passe",
	"search": "Rechercher",
	"addUser": "Ajouter un·e utilisateur·rice",
	"lookup": "Recherche",
	"users": "Utilisateur·rice·s",
	"reset": "Réinitialiser",
	"sort": "Trier",
	"state": "État",
	"instance": "Instance",
	"host": "Serveur distant"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"registeredDate": "Bergabung pada",
	"ascendingOrder": "Urutkan naik",
	"descendingOrder": "Urutkan menurun",
	"lastUsed": "Terakhir digunakan",
	"all": "Semua",
	"normal": "Normal",
	"administrator": "Admin",
	"moderator": "Moderator",
	"suspend": "Tangguhkan",
	"local": "Lokal",
	"remote": "Remote",
	"username": "Nama Pengguna",
	"password": "Kata sandi",
	"search": "Cari",
	"addUser": "Tambah pengguna",
	"lookup": "Cari",
	"users": "Pengguna",
	"reset": "Reset",
	"sort": "Urutkan",
	"state": "Kondisi",
	"instance": "Server",
	"host": "Host"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"registeredDate": "Data iscrizione",
	"ascendingOrder": "Aumenta",
	"descendingOrder": "Diminuisce",
	"lastUsed": "Ultima attività",
	"all": "Tutte",
	"normal": "Normale",
	"administrator": "Amministratore",
	"moderator": "Moderatore",
	"suspend": "Sospensione",
	"local": "Locale",
	"remote": "Remota",
	"username": "Nome utente",
	"password": "Password",
	"search": "Cerca",
	"addUser": "Aggiungi profilo",
	"lookup": "Ricerca remota",
	"users": "Profili",
	"reset": "Ripristina",
	"sort": "Ordina per",
	"state": "Stato",
	"instance": "Istanza",
	"host": "Host"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"registeredDate": "登録日",
	"ascendingOrder": "昇順",
	"descendingOrder": "降順",
	"lastUsed": "最後の使用",
	"all": "全て",
	"normal": "通常",
	"administrator": "管理者",
	"moderator": "モデレーター",
	"suspend": "凍結",
	"local": "ローカル",
	"remote": "リモート",
	"username": "ユーザー名",
	"password": "パスワード",
	"search": "検索",
	"addUser": "ユーザーを追加",
	"lookup": "照会",
	"users": "ユーザー",
	"reset": "リセット",
	"sort": "ソート",
	"state": "状態",
	"instance": "サーバー",
	"host": "ホスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"registeredDate": "始めた日",
	"ascendingOrder": "小さい順",
	"descendingOrder": "大きい順",
	"lastUsed": "最後に使うた日",
	"all": "みんな",
	"normal": "ええ感じ",
	"administrator": "管理者",
	"moderator": "モデレーター",
	"suspend": "凍結",
	"local": "ローカル",
	"remote": "リモート",
	"username": "ユーザー名",
	"password": "パスワード",
	"search": "探す",
	"addUser": "ユーザーを追加や",
	"lookup": "見てきて",
	"users": "ユーザー",
	"reset": "リセット",
	"sort": "並び替え",
	"state": "状態",
	"instance": "サーバー",
	"host": "ホスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"registeredDate": "Joined on",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"lastUsed": "Last used",
	"all": "All",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Suspend",
	"local": "Local",
	"remote": "Remote",
	"username": "Isem n umseqdac",
	"password": "Awal uffir",
	"search": "Nadi",
	"addUser": "Add a user",
	"lookup": "Lookup",
	"users": "Users",
	"reset": "Reset",
	"sort": "Sorting order",
	"state": "State",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"registeredDate": "Joined on",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"lastUsed": "Last used",
	"all": "All",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Suspend",
	"local": "Local",
	"remote": "Remote",
	"username": "ಬಳಕೆಹೆಸರು",
	"password": "ಗುಪ್ತಪದ",
	"search": "ಹುಡುಕು",
	"addUser": "ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ",
	"lookup": "Lookup",
	"users": "ಬಳಕೆದಾರ",
	"reset": "Reset",
	"sort": "Sorting order",
	"state": "State",
	"instance": "ನಿದರ್ಶನ",
	"host": "Host"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"registeredDate": "등록일",
	"ascendingOrder": "오름차순",
	"descendingOrder": "내림차순",
	"lastUsed": "마지막 사용",
	"all": "전체",
	"normal": "일반",
	"administrator": "관리자",
	"moderator": "모더레이터",
	"suspend": "정지",
	"local": "로컬",
	"remote": "리모트",
	"username": "유저명",
	"password": "비밀번호",
	"search": "검색",
	"addUser": "유저 추가",
	"lookup": "찾아보기",
	"users": "유저",
	"reset": "초기화",
	"sort": "정렬",
	"state": "상태",
	"instance": "서버",
	"host": "호스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"registeredDate": "Inschrijvingsdatum",
	"ascendingOrder": "Oplopende volgorde",
	"descendingOrder": "Aflopende volgorde",
	"lastUsed": "Laatst gebruikt",
	"all": "Alle",
	"normal": "Normaal",
	"administrator": "Beheerder",
	"moderator": "Moderator",
	"suspend": "Opschorten",
	"local": "Lokaal",
	"remote": "Remote",
	"username": "Gebruikersnaam",
	"password": "Wachtwoord",
	"search": "Zoeken",
	"addUser": "Toevoegen gebruiker",
	"lookup": "Opzoeken",
	"users": "Gebruikers",
	"reset": "Herstellen",
	"sort": "Sorteren",
	"state": "Status",
	"instance": "Server",
	"host": "Server"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"registeredDate": "Joined on",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"lastUsed": "Last used",
	"all": "Alle",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Suspender",
	"local": "Local",
	"remote": "Remote",
	"username": "Brukernavn",
	"password": "Passord",
	"search": "Søk",
	"addUser": "Legg til bruker",
	"lookup": "Lookup",
	"users": "Brukere",
	"reset": "Reset",
	"sort": "Sorting order",
	"state": "State",
	"instance": "Server",
	"host": "Vert"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"registeredDate": "Zarejestrowano",
	"ascendingOrder": "Rosnąco",
	"descendingOrder": "Malejąco",
	"lastUsed": "Ostatnio używane",
	"all": "Wszystkie",
	"normal": "Normalny",
	"administrator": "Admin",
	"moderator": "Moderator",
	"suspend": "Zawieś",
	"local": "Lokalne",
	"remote": "Zdalny",
	"username": "Nazwa użytkownika",
	"password": "Hasło",
	"search": "Szukaj",
	"addUser": "Dodaj użytkownika",
	"lookup": "Zapytania",
	"users": "Użytkownicy",
	"reset": "Reset",
	"sort": "Sortuj",
	"state": "Stan",
	"instance": "Instancja",
	"host": "Host"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"registeredDate": "Data de registro",
	"ascendingOrder": "Ascendente",
	"descendingOrder": "Descendente",
	"lastUsed": "Último uso",
	"all": "Todos",
	"normal": "Normal",
	"administrator": "Administrador",
	"moderator": "Moderador",
	"suspend": "Suspender",
	"local": "Local",
	"remote": "Remoto",
	"username": "Nome de usuário",
	"password": "Senha",
	"search": "Pesquisar",
	"addUser": "Adicionar usuário",
	"lookup": "Consultar",
	"users": "Usuários",
	"reset": "Redefinir",
	"sort": "Ordenação",
	"state": "Estado",
	"instance": "Instância",
	"host": "Host"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"registeredDate": "Дата регистрации",
	"ascendingOrder": "По возрастанию",
	"descendingOrder": "По убыванию",
	"lastUsed": "Последнее использование",
	"all": "Все",
	"normal": "Стабильно",
	"administrator": "Администратор",
	"moderator": "Модератор",
	"suspend": "Заморозить",
	"local": "С этого сайта",
	"remote": "С других сайтов",
	"username": "Имя пользователя",
	"password": "Пароль",
	"search": "Поиск",
	"addUser": "Добавить пользователя",
	"lookup": "Запрос",
	"users": "Пользователи",
	"reset": "Сброс",
	"sort": "Сортировать",
	"state": "Состояние",
	"instance": "Экземпляр",
	"host": "Хост"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"registeredDate": "Dátum registrácie",
	"ascendingOrder": "Vzostupne",
	"descendingOrder": "Zostupne",
	"lastUsed": "Naposledy použité",
	"all": "Všetko",
	"normal": "Normálne",
	"administrator": "Administrátor",
	"moderator": "Moderátor",
	"suspend": "Zmraziť",
	"local": "Lokálne",
	"remote": "Vzdialené",
	"username": "Meno používateľa",
	"password": "Heslo",
	"search": "Hľadať",
	"addUser": "Pridať používateľa",
	"lookup": "Vyhľadať",
	"users": "Používatelia",
	"reset": "Reset",
	"sort": "Zoradiť",
	"state": "Status",
	"instance": "Inštancia",
	"host": "Host"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"registeredDate": "วันที่ลงทะเบียน",
	"ascendingOrder": "เรียงลำดับขึ้น",
	"descendingOrder": "เรียงลำดับลง",
	"lastUsed": "ใช้ล่าสุด",
	"all": "ทั้งหมด",
	"normal": "ปกติ",
	"administrator": "ผู้ดูแลระบบ",
	"moderator": "ผู้ควบคุม",
	"suspend": "ระงับ",
	"local": "ท้องถิ่น",
	"remote": "ระยะไกล",
	"username": "ชื่อผู้ใช้",
	"password": "รหัสผ่าน",
	"search": "ค้นหา",
	"addUser": "เพิ่มผู้ใช้",
	"lookup": "การค้นหา",
	"users": "ผู้ใช้",
	"reset": "รีเซ็ต",
	"sort": "เรียงลำดับ",
	"state": "สถานะ",
	"instance": "เซิร์ฟเวอร์",
	"host": "โฮสต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"registeredDate": "Katılma tarihi",
	"ascendingOrder": "Artan",
	"descendingOrder": "Azalan",
	"lastUsed": "Son kullanılan",
	"all": "Tümü",
	"normal": "Normal",
	"administrator": "Yönetici",
	"moderator": "Moderatör",
	"suspend": "askıya al",
	"local": "Yerel",
	"remote": "Uzak",
	"username": "Kullanıcı Adı",
	"password": "Şifre",
	"search": "Ara",
	"addUser": "Kullanıcı ekle",
	"lookup": "Sorgu",
	"users": "Kullanıcılar",
	"reset": "Sıfırla",
	"sort": "Sıralama düzeni",
	"state": "Durum",
	"instance": "Sunucu",
	"host": "Host"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"registeredDate": "Joined on",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"lastUsed": "Last used",
	"all": "All",
	"normal": "Normal",
	"administrator": "Administrator",
	"moderator": "Moderator",
	"suspend": "Suspend",
	"local": "Local",
	"remote": "Remote",
	"username": "Username",
	"password": "Password",
	"search": "ئىزدەش",
	"addUser": "Add a user",
	"lookup": "Lookup",
	"users": "Users",
	"reset": "Reset",
	"sort": "Sorting order",
	"state": "State",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"registeredDate": "Приєднання",
	"ascendingOrder": "За зростанням",
	"descendingOrder": "За спаданням",
	"lastUsed": "Востаннє використано",
	"all": "Всі",
	"normal": "Нормальний",
	"administrator": "Адмін",
	"moderator": "Модератор",
	"suspend": "Призупинити",
	"local": "Локальні",
	"remote": "Віддалені",
	"username": "Ім'я користувача",
	"password": "Пароль",
	"search": "Пошук",
	"addUser": "Додати користувача",
	"lookup": "Пошук",
	"users": "Користувачі",
	"reset": "Скинути",
	"sort": "Сортування",
	"state": "Стан",
	"instance": "Інстанс",
	"host": "Хост"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"registeredDate": "Tham gia",
	"ascendingOrder": "Tăng dần",
	"descendingOrder": "Giảm dần",
	"lastUsed": "Dùng lần cuối",
	"all": "Tất cả",
	"normal": "Bình thường",
	"administrator": "Quản trị viên",
	"moderator": "Kiểm duyệt viên",
	"suspend": "Vô hiệu hóa",
	"local": "Máy chủ này",
	"remote": "Máy chủ khác",
	"username": "Tên người dùng",
	"password": "Mật khẩu",
	"search": "Tìm kiếm",
	"addUser": "Thêm người dùng",
	"lookup": "Tra cứu",
	"users": "Người dùng",
	"reset": "cài lại",
	"sort": "Sắp xếp",
	"state": "Trạng thái",
	"instance": "Máy chủ",
	"host": "Host"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"registeredDate": "注册于",
	"ascendingOrder": "升序",
	"descendingOrder": "降序",
	"lastUsed": "最后使用：",
	"all": "全部",
	"normal": "正常",
	"administrator": "管理员",
	"moderator": "监察员",
	"suspend": "冻结",
	"local": "本地",
	"remote": "远程",
	"username": "用户名",
	"password": "密码",
	"search": "搜索",
	"addUser": "添加用户",
	"lookup": "查找用户",
	"users": "用户",
	"reset": "重置",
	"sort": "排序",
	"state": "状态",
	"instance": "服务器",
	"host": "主机名"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"registeredDate": "註冊日期",
	"ascendingOrder": "昇冪",
	"descendingOrder": "降冪",
	"lastUsed": "上次使用",
	"all": "全部",
	"normal": "正常",
	"administrator": "管理員",
	"moderator": "審查員",
	"suspend": "凍結",
	"local": "本地",
	"remote": "遠端",
	"username": "使用者名稱",
	"password": "密碼",
	"search": "搜尋",
	"addUser": "新增使用者",
	"lookup": "查詢",
	"users": "使用者",
	"reset": "重設",
	"sort": "排序",
	"state": "狀態",
	"instance": "伺服器",
	"host": "主機"
}
</locale>
