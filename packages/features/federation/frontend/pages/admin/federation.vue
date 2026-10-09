<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div>
				<MkInput v-model="host" :debounce="true" class="">
					<template #prefix><i class="ti ti-search"></i></template>
					<template #label>{{ $locale.sfc.host }}</template>
				</MkInput>
				<FormSplit style="margin-top: var(--MI-margin);">
					<MkSelect v-model="state" :items="stateDef">
						<template #label>{{ $locale.sfc.state }}</template>
					</MkSelect>
					<MkSelect v-model="sort" :items="sortDef">
						<template #label>{{ $locale.sfc.sort }}</template>
					</MkSelect>
				</FormSplit>
			</div>

			<MkPagination v-slot="{items}" :key="host + state" :paginator="paginator">
				<div :class="$style.instances">
					<MkA v-for="instance in items" :key="instance.id" v-tooltip.mfm="`Status: ${getStatus(instance)}`" :class="$style.instance" :to="`/instance-info/${instance.host}`">
						<MkInstanceCardMini :instance="instance"/>
					</MkA>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkInstanceCardMini from '@features/federation/frontend/components/MkInstanceCardMini.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const host = ref('');
const {
	model: state,
	def: stateDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'all' },
		{ label: $locale.value.sfc.federating, value: 'federating' },
		{ label: $locale.value.sfc.subscribing, value: 'subscribing' },
		{ label: $locale.value.sfc.publishing, value: 'publishing' },
		{ label: $locale.value.sfc.suspended, value: 'suspended' },
		{ label: $locale.value.sfc.blocked, value: 'blocked' },
		{ label: $locale.value.sfc.silence, value: 'silenced' },
		{ label: $locale.value.sfc.notResponding, value: 'notResponding' },
	],
	initialValue: 'federating',
});
const {
	model: sort,
	def: sortDef,
} = useMkSelect({
	items: [
		{ label: `${$locale.value.sfc.pubSub} (${$locale.value.sfc.descendingOrder})`, value: '+pubSub' },
		{ label: `${$locale.value.sfc.pubSub} (${$locale.value.sfc.ascendingOrder})`, value: '-pubSub' },
		{ label: `${$locale.value.sfc.notes} (${$locale.value.sfc.descendingOrder})`, value: '+notes' },
		{ label: `${$locale.value.sfc.notes} (${$locale.value.sfc.ascendingOrder})`, value: '-notes' },
		{ label: `${$locale.value.sfc.users} (${$locale.value.sfc.descendingOrder})`, value: '+users' },
		{ label: `${$locale.value.sfc.users} (${$locale.value.sfc.ascendingOrder})`, value: '-users' },
		{ label: `${$locale.value.sfc.following} (${$locale.value.sfc.descendingOrder})`, value: '+following' },
		{ label: `${$locale.value.sfc.following} (${$locale.value.sfc.ascendingOrder})`, value: '-following' },
		{ label: `${$locale.value.sfc.followers} (${$locale.value.sfc.descendingOrder})`, value: '+followers' },
		{ label: `${$locale.value.sfc.followers} (${$locale.value.sfc.ascendingOrder})`, value: '-followers' },
		{ label: `${$locale.value.sfc.registeredAt} (${$locale.value.sfc.descendingOrder})`, value: '+firstRetrievedAt' },
		{ label: `${$locale.value.sfc.registeredAt} (${$locale.value.sfc.ascendingOrder})`, value: '-firstRetrievedAt' },
	],
	initialValue: '+pubSub',
});
const paginator = markRaw(new Paginator('federation/instances', {
	limit: 10,
	offsetMode: true,
	computedParams: computed(() => ({
		sort: sort.value,
		host: host.value !== '' ? host.value : null,
		...(
			state.value === 'federating' ? { federating: true, suspended: false, blocked: false } :
			state.value === 'subscribing' ? { subscribing: true, suspended: false, blocked: false } :
			state.value === 'publishing' ? { publishing: true, suspended: false, blocked: false } :
			state.value === 'suspended' ? { suspended: true } :
			state.value === 'blocked' ? { blocked: true } :
			state.value === 'silenced' ? { silenced: true } :
			state.value === 'notResponding' ? { notResponding: true } :
			{}),
	})),
}));

function getStatus(instance: Misskey.entities.FederationInstance) {
	switch (instance.suspensionState) {
		case 'manuallySuspended':
			return 'Manually Suspended';
		case 'goneSuspended':
			return 'Automatically Suspended (Gone)';
		case 'autoSuspendedForNotResponding':
			return 'Automatically Suspended (Not Responding)';
		case 'none':
			break;
	}
	if (instance.isBlocked) return 'Blocked';
	if (instance.isSilenced) return 'Silenced';
	if (instance.isNotResponding) return 'Error';
	return 'Alive';
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.federation,
	icon: 'ti ti-whirl',
}));
</script>

<style lang="scss" module>
.instances {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
}

.instance:hover {
	text-decoration: none;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"all": "الكل",
	"federating": "الفديرالية جارية",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "مُعلّق",
	"blocked": "محجوب",
	"silence": "اكتم",
	"notResponding": "لا يستجيب",
	"pubSub": "حسابات Pub/Sub",
	"descendingOrder": "تنازلي",
	"ascendingOrder": "تصاعدي",
	"notes": "الملاحظات",
	"users": "المستخدمون",
	"following": "المتابَعون",
	"followers": "المتابِعون",
	"registeredAt": "مسجل منذ",
	"federation": "الفديرالية",
	"host": "المضيف",
	"state": "الحالة",
	"sort": "ترتيب حسب"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"all": "Tot",
	"federating": "Federant",
	"subscribing": "Subscrit a",
	"publishing": "S'està publicant",
	"suspended": "Anul·lar subscripció ",
	"blocked": "Bloquejat",
	"silence": "Silencia",
	"notResponding": "Sense resposta",
	"pubSub": "Comptes Pub/Sub",
	"descendingOrder": "Descendent",
	"ascendingOrder": "Ascendent",
	"notes": "Notes",
	"users": "Usuaris",
	"following": "Segueixes ",
	"followers": "Seguidors",
	"registeredAt": "Registrat a",
	"federation": "Federació",
	"host": "Amfitrió",
	"state": "Estat",
	"sort": "Ordena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"all": "Vše",
	"federating": "Sdružování",
	"subscribing": "Odebíráte",
	"publishing": "Publikuji",
	"suspended": "Suspendováno",
	"blocked": "Blokováno",
	"silence": "Ztlumení",
	"notResponding": "Neodpovídá",
	"pubSub": "Pub/Sub účty",
	"descendingOrder": "Sestupně",
	"ascendingOrder": "Vzestupně",
	"notes": "Poznámky",
	"users": "Uživatelé",
	"following": "Sledovaní",
	"followers": "Sledující",
	"registeredAt": "Registrován",
	"federation": "Federace",
	"host": "Hostitel",
	"state": "Stav",
	"sort": "Seřadit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"all": "All",
	"federating": "Federating",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "Suspended",
	"blocked": "Blocked",
	"silence": "Silence",
	"notResponding": "Not responding",
	"pubSub": "Pub/Sub Accounts",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"notes": "Notes",
	"users": "Users",
	"following": "Following",
	"followers": "Followers",
	"registeredAt": "Registered at",
	"federation": "Federation",
	"host": "Host",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"all": "Alle",
	"federating": "Wird föderiert",
	"subscribing": "Wird abonniert",
	"publishing": "Wird veröffentlicht",
	"suspended": "Gesperrt",
	"blocked": "Blockiert",
	"silence": "Instanzweit stummschalten",
	"notResponding": "Antwortet nicht",
	"pubSub": "Pub/Sub Benutzerkonten",
	"descendingOrder": "Absteigende Reihenfolge",
	"ascendingOrder": "Aufsteigende Reihenfolge",
	"notes": "Notizen",
	"users": "Benutzer",
	"following": "Folgt",
	"followers": "Gefolgt von",
	"registeredAt": "Registriert am",
	"federation": "Föderation",
	"host": "Hostname",
	"state": "Status",
	"sort": "Sortieren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"all": "All",
	"federating": "Federating",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "Suspended",
	"blocked": "Blocked",
	"silence": "Silence",
	"notResponding": "Not responding",
	"pubSub": "Pub/Sub Accounts",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"notes": "Notes",
	"users": "Users",
	"following": "Following",
	"followers": "Followers",
	"registeredAt": "Registered at",
	"federation": "Federation",
	"host": "Host",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"all": "Todo",
	"federating": "Federando",
	"subscribing": "Suscribiendo",
	"publishing": "Publicando",
	"suspended": "Suspendido",
	"blocked": "Bloqueado",
	"silence": "Silenciar",
	"notResponding": "Sin respuestas",
	"pubSub": "Cuentas Pub/Sub",
	"descendingOrder": "Descendente",
	"ascendingOrder": "Ascendente",
	"notes": "Notas",
	"users": "Usuarios",
	"following": "Siguiendo",
	"followers": "Seguidores",
	"registeredAt": "Registrado en",
	"federation": "Federación",
	"host": "Instancia",
	"state": "Estado",
	"sort": "Ordenar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"all": "Tous",
	"federating": "En cours de fédération",
	"subscribing": "Abonné",
	"publishing": "Publié",
	"suspended": "Suspendu·e",
	"blocked": "Bloqué·e",
	"silence": "Mettre en sourdine",
	"notResponding": "Ne répond pas",
	"pubSub": "Comptes Pub/Sub",
	"descendingOrder": "Descendant",
	"ascendingOrder": "Ascendant",
	"notes": "Notes",
	"users": "Utilisateur·rice·s",
	"following": "Abonnements",
	"followers": "Abonné·e·s",
	"registeredAt": "Premier contact le",
	"federation": "Fédération",
	"host": "Serveur distant",
	"state": "État",
	"sort": "Trier"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"all": "Semua",
	"federating": "memfederasi",
	"subscribing": "Berlangganan",
	"publishing": "Sedang menyiarkan langsung",
	"suspended": "Ditangguhkan",
	"blocked": "Diblokir",
	"silence": "Senyapkan",
	"notResponding": "Tidak ada respon",
	"pubSub": "Akun Pub/Sub",
	"descendingOrder": "Urutkan menurun",
	"ascendingOrder": "Urutkan naik",
	"notes": "Catatan",
	"users": "Pengguna",
	"following": "Ikuti",
	"followers": "Pengikut",
	"registeredAt": "Terdaftar",
	"federation": "Federasi",
	"host": "Host",
	"state": "Kondisi",
	"sort": "Urutkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"all": "Tutte",
	"federating": "Federazione",
	"subscribing": "Iscrizione",
	"publishing": "Pubblicazione",
	"suspended": "Sospensione",
	"blocked": "Bloccato",
	"silence": "Silenziare",
	"notResponding": "Nessuna risposta",
	"pubSub": "Publish/Subscribe del profilo",
	"descendingOrder": "Diminuisce",
	"ascendingOrder": "Aumenta",
	"notes": "Note",
	"users": "Profili",
	"following": "Following",
	"followers": "Follower",
	"registeredAt": "Prima federazione",
	"federation": "Federazione",
	"host": "Host",
	"state": "Stato",
	"sort": "Ordina per"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"all": "全て",
	"federating": "連合中",
	"subscribing": "購読中",
	"publishing": "配信中",
	"suspended": "配信停止",
	"blocked": "ブロック中",
	"silence": "サイレンス",
	"notResponding": "応答なし",
	"pubSub": "Pub/Subのアカウント",
	"descendingOrder": "降順",
	"ascendingOrder": "昇順",
	"notes": "ノート",
	"users": "ユーザー",
	"following": "フォロー",
	"followers": "フォロワー",
	"registeredAt": "初観測",
	"federation": "連合",
	"host": "ホスト",
	"state": "状態",
	"sort": "ソート"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"all": "みんな",
	"federating": "連合しとる",
	"subscribing": "購読しとる",
	"publishing": "配信しとる",
	"suspended": "配信せぇへん",
	"blocked": "ブロックしとる",
	"silence": "サイレンス",
	"notResponding": "応答してへんで",
	"pubSub": "Pub/Subのアカウント",
	"descendingOrder": "大きい順",
	"ascendingOrder": "小さい順",
	"notes": "ノート",
	"users": "ユーザー",
	"following": "フォロー",
	"followers": "フォロワー",
	"registeredAt": "初観測",
	"federation": "連合",
	"host": "ホスト",
	"state": "状態",
	"sort": "並び替え"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"all": "All",
	"federating": "Federating",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "Suspended",
	"blocked": "Blocked",
	"silence": "Silence",
	"notResponding": "Not responding",
	"pubSub": "Pub/Sub Accounts",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"notes": "Notes",
	"users": "Users",
	"following": "Ig ṭṭafaṛ",
	"followers": "Imeḍfaṛen",
	"registeredAt": "Registered at",
	"federation": "Federation",
	"host": "Host",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"all": "All",
	"federating": "Federating",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "Suspended",
	"blocked": "Blocked",
	"silence": "Silence",
	"notResponding": "Not responding",
	"pubSub": "Pub/Sub Accounts",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"notes": "Notes",
	"users": "ಬಳಕೆದಾರ",
	"following": "Following",
	"followers": "Followers",
	"registeredAt": "Registered at",
	"federation": "Federation",
	"host": "Host",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"all": "전체",
	"federating": "연합 중",
	"subscribing": "구독 중",
	"publishing": "배포 중",
	"suspended": "정지됨",
	"blocked": "차단됨",
	"silence": "사일런스",
	"notResponding": "응답 없음",
	"pubSub": "Pub/Sub 계정",
	"descendingOrder": "내림차순",
	"ascendingOrder": "오름차순",
	"notes": "노트",
	"users": "유저",
	"following": "팔로잉",
	"followers": "팔로워",
	"registeredAt": "등록 날짜",
	"federation": "연합",
	"host": "호스트",
	"state": "상태",
	"sort": "정렬"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"all": "Alle",
	"federating": "Federeren",
	"subscribing": "Abonneren",
	"publishing": "Publiceren",
	"suspended": "Opgeschort",
	"blocked": "Geblokkeerd",
	"silence": "Dempen",
	"notResponding": "Reageert niet",
	"pubSub": "Pub/Sub Gebruikersaccounts",
	"descendingOrder": "Aflopende volgorde",
	"ascendingOrder": "Oplopende volgorde",
	"notes": "Notities",
	"users": "Gebruikers",
	"following": "Volgend",
	"followers": "Volgers",
	"registeredAt": "Geregistreerd op",
	"federation": "Federatie",
	"host": "Server",
	"state": "Status",
	"sort": "Sorteren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"all": "Alle",
	"federating": "Federating",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "Suspendert",
	"blocked": "Blokkert",
	"silence": "Silence",
	"notResponding": "Svarer ikke",
	"pubSub": "Pub/Sub Accounts",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"notes": "Notes",
	"users": "Brukere",
	"following": "Følger",
	"followers": "Følgere",
	"registeredAt": "Registrerte seg",
	"federation": "Føderasjon",
	"host": "Vert",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"all": "Wszystkie",
	"federating": "Federowanie",
	"subscribing": "Subskrybowanie",
	"publishing": "Publikowanie",
	"suspended": "Zawieszono",
	"blocked": "Zablokowano",
	"silence": "Wycisz",
	"notResponding": "Nie odpowiada",
	"pubSub": "Konta Pub/Sub",
	"descendingOrder": "Malejąco",
	"ascendingOrder": "Rosnąco",
	"notes": "Wpisy",
	"users": "Użytkownicy",
	"following": "Obserwowani",
	"followers": "Obserwujący",
	"registeredAt": "Zarejestrowano",
	"federation": "Federacja",
	"host": "Host",
	"state": "Stan",
	"sort": "Sortuj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"all": "Todos",
	"federating": "Federando",
	"subscribing": "Inscrito",
	"publishing": "Publicando",
	"suspended": "Suspenso",
	"blocked": "Bloqueado",
	"silence": "Silenciado",
	"notResponding": "Sem resposta",
	"pubSub": "Publicar/Inscrever no perfil",
	"descendingOrder": "Descendente",
	"ascendingOrder": "Ascendente",
	"notes": "Posts",
	"users": "Usuários",
	"following": "Seguindo",
	"followers": "Seguidores",
	"registeredAt": "Registrado em",
	"federation": "Federação",
	"host": "Host",
	"state": "Estado",
	"sort": "Ordenação"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"all": "Все",
	"federating": "Федерируется",
	"subscribing": "Подписка",
	"publishing": "Публикация",
	"suspended": "Заморожено",
	"blocked": "Заблокировано",
	"silence": "Заглушить",
	"notResponding": "Нет ответа",
	"pubSub": "Учётные записи Pub/Sub",
	"descendingOrder": "По убыванию",
	"ascendingOrder": "По возрастанию",
	"notes": "Заметки",
	"users": "Пользователи",
	"following": "Подписки",
	"followers": "Подписчики",
	"registeredAt": "Первое наблюдение",
	"federation": "Федерация",
	"host": "Хост",
	"state": "Состояние",
	"sort": "Сортировать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"all": "Všetko",
	"federating": "Federácia",
	"subscribing": "Odoberanie",
	"publishing": "Zverejňovanie",
	"suspended": "Zmrazené",
	"blocked": "Blokované",
	"silence": "Ticho",
	"notResponding": "Neodpovedá",
	"pubSub": "Pub/Sub účty",
	"descendingOrder": "Zostupne",
	"ascendingOrder": "Vzostupne",
	"notes": "Poznámky",
	"users": "Používatelia",
	"following": "Sledujete",
	"followers": "Sledujúci",
	"registeredAt": "Registrácia",
	"federation": "Federácia",
	"host": "Host",
	"state": "Status",
	"sort": "Zoradiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"all": "ทั้งหมด",
	"federating": "สหพันธ์",
	"subscribing": "กำลังสมัครสมาชิก",
	"publishing": "กำลังเผยแพร่",
	"suspended": "ระงับการส่ง",
	"blocked": "ถูกบล็อก",
	"silence": "ถูกปิดปาก",
	"notResponding": "ไม่มีการตอบสนอง",
	"pubSub": "บัญชี Pub/Sub",
	"descendingOrder": "เรียงลำดับลง",
	"ascendingOrder": "เรียงลำดับขึ้น",
	"notes": " โน้ต",
	"users": "ผู้ใช้",
	"following": "กำลังติดตาม",
	"followers": "ผู้ติดตาม",
	"registeredAt": "วันที่ลงทะเบียน",
	"federation": "สหพันธ์",
	"host": "โฮสต์",
	"state": "สถานะ",
	"sort": "เรียงลำดับ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"all": "Tümü",
	"federating": "Birleştirme",
	"subscribing": "Abonelik",
	"publishing": "Paylaşım",
	"suspended": "Askıya alınmış",
	"blocked": "Engellenmiş",
	"silence": "Sessize al",
	"notResponding": "Yanıt vermiyor",
	"pubSub": "Yayın/Abonelik Hesapları",
	"descendingOrder": "Azalan",
	"ascendingOrder": "Artan",
	"notes": "Notlar",
	"users": "Kullanıcılar",
	"following": "Takip",
	"followers": "Takipçi",
	"registeredAt": "Kayıtlı",
	"federation": "Federasyon",
	"host": "Host",
	"state": "Durum",
	"sort": "Sıralama düzeni"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"all": "All",
	"federating": "Federating",
	"subscribing": "Subscribing",
	"publishing": "Publishing",
	"suspended": "Suspended",
	"blocked": "Blocked",
	"silence": "Silence",
	"notResponding": "Not responding",
	"pubSub": "Pub/Sub Accounts",
	"descendingOrder": "Descending",
	"ascendingOrder": "Ascending",
	"notes": "Notes",
	"users": "Users",
	"following": "Following",
	"followers": "Followers",
	"registeredAt": "Registered at",
	"federation": "Federation",
	"host": "Host",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"all": "Всі",
	"federating": "Федерується",
	"subscribing": "Підписка",
	"publishing": "Публікація",
	"suspended": "Призупинено",
	"blocked": "Заблоковано",
	"silence": "Заглушити",
	"notResponding": "Не відповідає",
	"pubSub": "Акаунти Pub/Sub",
	"descendingOrder": "За спаданням",
	"ascendingOrder": "За зростанням",
	"notes": "Записи",
	"users": "Користувачі",
	"following": "Підписки",
	"followers": "Підписники",
	"registeredAt": "Реєстрація",
	"federation": "Федіверс",
	"host": "Хост",
	"state": "Стан",
	"sort": "Сортування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"all": "Tất cả",
	"federating": "Đang liên hợp",
	"subscribing": "Đang đăng ký",
	"publishing": "Đang đăng",
	"suspended": "Đã vô hiệu hóa",
	"blocked": "Đã chặn",
	"silence": "Ẩn",
	"notResponding": "Không có phản hồi",
	"pubSub": "Tài khoản Chính/Phụ",
	"descendingOrder": "Giảm dần",
	"ascendingOrder": "Tăng dần",
	"notes": "Bài Viết",
	"users": "Người dùng",
	"following": "Đang theo dõi",
	"followers": "Người theo dõi",
	"registeredAt": "Đăng ký vào",
	"federation": "Liên hợp",
	"host": "Host",
	"state": "Trạng thái",
	"sort": "Sắp xếp"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"all": "全部",
	"federating": "联邦通信中",
	"subscribing": "已订阅",
	"publishing": "投递中",
	"suspended": "停止投递",
	"blocked": "已屏蔽",
	"silence": "禁言",
	"notResponding": "没有响应",
	"pubSub": "Pub/Sub 账户",
	"descendingOrder": "降序",
	"ascendingOrder": "升序",
	"notes": "帖子",
	"users": "用户",
	"following": "关注中",
	"followers": "关注者",
	"registeredAt": "初次观测",
	"federation": "联邦",
	"host": "主机名",
	"state": "状态",
	"sort": "排序"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"all": "全部",
	"federating": "聯邦運作中",
	"subscribing": "訂閱中",
	"publishing": "發送中",
	"suspended": "停止發送",
	"blocked": "已封鎖",
	"silence": "禁言",
	"notResponding": "沒有回應",
	"pubSub": "Pub/Sub 帳戶",
	"descendingOrder": "降冪",
	"ascendingOrder": "昇冪",
	"notes": "貼文",
	"users": "使用者",
	"following": "追隨中",
	"followers": "追隨者",
	"registeredAt": "初次觀測",
	"federation": "站台聯邦",
	"host": "主機",
	"state": "狀態",
	"sort": "排序"
}
</locale>
