<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps_m">
			<MkFolder :expanded="false">
				<template #icon><i class="ti ti-plus"></i></template>
				<template #label>{{ $locale.sfc.createInviteCode }}</template>

				<div class="_gaps_m">
					<MkSwitch v-model="noExpirationDate">
						<template #label>{{ $locale.sfc.noExpirationDate }}</template>
					</MkSwitch>
					<MkInput v-if="!noExpirationDate" v-model="expiresAt" type="datetime-local">
						<template #label>{{ $locale.sfc.expirationDate }}</template>
					</MkInput>
					<MkInput v-model="createCount" type="number" :min="1">
						<template #label>{{ $locale.sfc.createCount }}</template>
					</MkInput>
					<MkButton primary rounded @click="createWithOptions">{{ $locale.sfc.create }}</MkButton>
				</div>
			</MkFolder>

			<div :class="$style.inputs">
				<MkSelect v-model="type" :items="typeDef" :class="$style.input">
					<template #label>{{ $locale.sfc.state }}</template>
				</MkSelect>
				<MkSelect v-model="sort" :items="sortDef" :class="$style.input">
					<template #label>{{ $locale.sfc.sort }}</template>
				</MkSelect>
			</div>
			<MkPagination :paginator="paginator">
				<template #default="{ items }">
					<div class="_gaps_s">
						<MkInviteCode v-for="item in items" :key="item.id" :invite="item" :onDeleted="deleted" moderator/>
					</div>
				</template>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref, useTemplateRef } from 'vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkInviteCode from '@features/auth/frontend/components/MkInviteCode.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const {
	model: type,
	def: typeDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'all' },
		{ label: $locale.value.sfc.unused, value: 'unused' },
		{ label: $locale.value.sfc.used, value: 'used' },
		{ label: $locale.value.sfc.expired, value: 'expired' },
	],
	initialValue: 'all',
});
const {
	model: sort,
	def: sortDef,
} = useMkSelect({
	items: [
		{ label: `${$locale.value.sfc.createdAt} (${$locale.value.sfc.ascendingOrder})`, value: '+createdAt' },
		{ label: `${$locale.value.sfc.createdAt} (${$locale.value.sfc.descendingOrder})`, value: '-createdAt' },
		{ label: `${$locale.value.sfc.usedAt} (${$locale.value.sfc.ascendingOrder})`, value: '+usedAt' },
		{ label: `${$locale.value.sfc.usedAt} (${$locale.value.sfc.descendingOrder})`, value: '-usedAt' },
	],
	initialValue: '+createdAt',
});

const paginator = markRaw(new Paginator('admin/invite/list', {
	limit: 10,
	computedParams: computed(() => ({
		type: type.value,
		sort: sort.value,
	})),
	offsetMode: true,
}));

const expiresAt = ref('');
const noExpirationDate = ref(true);
const createCount = ref(1);

async function createWithOptions() {
	const options = {
		expiresAt: noExpirationDate.value ? null : expiresAt.value,
		count: createCount.value,
	};

	const tickets = await misskeyApi('admin/invite/create', options);
	os.alert({
		type: 'success',
		title: $locale.value.sfc.inviteCodeCreated,
		text: tickets.map(x => x.code).join('\n'),
	});

	tickets.forEach(ticket => paginator.prepend(ticket));
}

function deleted(id: string) {
	paginator.removeItem(id);
}

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.invite,
	icon: 'ti ti-user-plus',
}));
</script>

<style lang="scss" module>
.inputs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.input {
	flex: 1;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"all": "الكل",
	"unused": "غير مستعمَل",
	"used": "Used",
	"expired": "منتهية صلاحيته",
	"createdAt": "أُنشئ في",
	"ascendingOrder": "تصاعدي",
	"descendingOrder": "تنازلي",
	"usedAt": "Used at",
	"inviteCodeCreated": "ولِّدت دعوة",
	"invite": "دعوة",
	"createInviteCode": "ولِّد دعوة",
	"noExpirationDate": "لا نهاية لصلاحيتها",
	"expirationDate": "تاريخ انتهاء الصلاحية",
	"createCount": "Invite count",
	"create": "أنشئ",
	"state": "الحالة",
	"sort": "ترتيب حسب"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"all": "Tot",
	"unused": "Sense utilitzar",
	"used": "Utilitzada",
	"expired": "Caducat",
	"createdAt": "Creat el",
	"ascendingOrder": "Ascendent",
	"descendingOrder": "Descendent",
	"usedAt": "Utilitzada el",
	"inviteCodeCreated": "Invitació creada",
	"invite": "Convida",
	"createInviteCode": "Crear codi d'invitació ",
	"noExpirationDate": "Sense data de venciment",
	"expirationDate": "Data de venciment",
	"createCount": "Comptador d'invitacions ",
	"create": "Crear",
	"state": "Estat",
	"sort": "Ordena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"all": "Vše",
	"unused": "Nepoužívaná",
	"used": "Používaná",
	"expired": "Prošlá",
	"createdAt": "Vytvořeno",
	"ascendingOrder": "Vzestupně",
	"descendingOrder": "Sestupně",
	"usedAt": "Používá se v",
	"inviteCodeCreated": "Pozvánka vygenerována",
	"invite": "Pozvat",
	"createInviteCode": "Vygenerovat pozvánku",
	"noExpirationDate": "Bez expirace",
	"expirationDate": "Datum expirace",
	"createCount": "Počet vytvořených pozvánek",
	"create": "Vytvořit",
	"state": "Stav",
	"sort": "Seřadit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"all": "All",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Created at",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Create",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"all": "Alle",
	"unused": "Unbenutzt",
	"used": "Benutzt",
	"expired": "Abgelaufen",
	"createdAt": "Erstellt am",
	"ascendingOrder": "Aufsteigende Reihenfolge",
	"descendingOrder": "Absteigende Reihenfolge",
	"usedAt": "Benutzt am",
	"inviteCodeCreated": "Einladung erstellt",
	"invite": "Einladen",
	"createInviteCode": "Einladung erstellen",
	"noExpirationDate": "Keins",
	"expirationDate": "Ablaufdatum",
	"createCount": "Einladungsanzahl",
	"create": "Erstellen",
	"state": "Status",
	"sort": "Sortieren"
}
</locale>

<locale locale="en-US" lang="json">
{
	"all": "All",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Created at",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Create",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"all": "Todo",
	"unused": "Sin usar",
	"used": "Usada",
	"expired": "Caducada",
	"createdAt": "Fecha de creación",
	"ascendingOrder": "Ascendente",
	"descendingOrder": "Descendente",
	"usedAt": "Usada el",
	"inviteCodeCreated": "Invitación generada",
	"invite": "Invitar",
	"createInviteCode": "Generar invitación",
	"noExpirationDate": "Sin caducidad",
	"expirationDate": "Fecha de caducidad",
	"createCount": "Conteo de invitaciones",
	"create": "Crear",
	"state": "Estado",
	"sort": "Ordenar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"all": "Tous",
	"unused": "Non-utilisé",
	"used": "Utilisé",
	"expired": "Expiré",
	"createdAt": "Date de création",
	"ascendingOrder": "Ascendant",
	"descendingOrder": "Descendant",
	"usedAt": "Utilisé le",
	"inviteCodeCreated": "Code d'invitation créé",
	"invite": "Inviter",
	"createInviteCode": "Créer un code d'invitation",
	"noExpirationDate": "Ne pas expirer",
	"expirationDate": "Date d’expiration",
	"createCount": "Quantité à créer",
	"create": "Créer",
	"state": "État",
	"sort": "Trier"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"all": "Semua",
	"unused": "Tidak digunakan",
	"used": "Digunakan",
	"expired": "Kedaluwarsa",
	"createdAt": "Dibuat pada",
	"ascendingOrder": "Urutkan naik",
	"descendingOrder": "Urutkan menurun",
	"usedAt": "Digunakan pada",
	"inviteCodeCreated": "Kode undangan dibuat",
	"invite": "Undang",
	"createInviteCode": "Buat kode undangan",
	"noExpirationDate": "tidak ada tanggal kedaluwarsa",
	"expirationDate": "Tanggal kedaluwarsa",
	"createCount": "Jumlah undangan",
	"create": "Buat",
	"state": "Kondisi",
	"sort": "Urutkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"all": "Tutte",
	"unused": "Inutilizzato",
	"used": "Utilizzato",
	"expired": "Scaduto",
	"createdAt": "Data di creazione",
	"ascendingOrder": "Aumenta",
	"descendingOrder": "Diminuisce",
	"usedAt": "Usato alle",
	"inviteCodeCreated": "Inviti generati",
	"invite": "Invita",
	"createInviteCode": "Genera codice di invito",
	"noExpirationDate": "Senza scadenza",
	"expirationDate": "Scadenza",
	"createCount": "Conteggio inviti",
	"create": "Crea",
	"state": "Stato",
	"sort": "Ordina per"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"all": "全て",
	"unused": "未使用",
	"used": "使用済み",
	"expired": "期限切れ",
	"createdAt": "作成日時",
	"ascendingOrder": "昇順",
	"descendingOrder": "降順",
	"usedAt": "使用日時",
	"inviteCodeCreated": "招待コードを作成しました",
	"invite": "招待",
	"createInviteCode": "招待コードを作成",
	"noExpirationDate": "有効期限を設けない",
	"expirationDate": "有効期限",
	"createCount": "作成数",
	"create": "作成",
	"state": "状態",
	"sort": "ソート"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"all": "みんな",
	"unused": "つこてへん",
	"used": "もうつこてる",
	"expired": "期限切れ",
	"createdAt": "作成した日",
	"ascendingOrder": "小さい順",
	"descendingOrder": "大きい順",
	"usedAt": "使った時",
	"inviteCodeCreated": "招待コード作ったで",
	"invite": "来てや",
	"createInviteCode": "招待コード作る",
	"noExpirationDate": "期限なし",
	"expirationDate": "有効期限",
	"createCount": "作った数",
	"create": "作成",
	"state": "状態",
	"sort": "並び替え"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"all": "All",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Created at",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Create",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"all": "All",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Created at",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Create",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"all": "전체",
	"unused": "사용되지 않음",
	"used": "사용됨",
	"expired": "만료됨",
	"createdAt": "생성된 날짜",
	"ascendingOrder": "오름차순",
	"descendingOrder": "내림차순",
	"usedAt": "사용 시각",
	"inviteCodeCreated": "초대 코드 생성됨",
	"invite": "초대",
	"createInviteCode": "초대 코드 생성",
	"noExpirationDate": "만료기간 없음",
	"expirationDate": "만료 날짜",
	"createCount": "초대 수",
	"create": "생성",
	"state": "상태",
	"sort": "정렬"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"all": "Alle",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Aangemaakt at",
	"ascendingOrder": "Oplopende volgorde",
	"descendingOrder": "Aflopende volgorde",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Uitnodigen",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Creëer",
	"state": "Status",
	"sort": "Sorteren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"all": "Alle",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Created at",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Inviter",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Opprett",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"all": "Wszystkie",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Utworzono",
	"ascendingOrder": "Rosnąco",
	"descendingOrder": "Malejąco",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Zaproś",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Utwórz",
	"state": "Stan",
	"sort": "Sortuj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"all": "Todos",
	"unused": "Não foi usado",
	"used": "Usado",
	"expired": "Expirado",
	"createdAt": "Data de criação",
	"ascendingOrder": "Ascendente",
	"descendingOrder": "Descendente",
	"usedAt": "Usado em",
	"inviteCodeCreated": "Convite gerado",
	"invite": "Convidar",
	"createInviteCode": "Gerar convite",
	"noExpirationDate": "Sem expiração",
	"expirationDate": "Data de expiração",
	"createCount": "Número de convites",
	"create": "Criar",
	"state": "Estado",
	"sort": "Ordenação"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"all": "Все",
	"unused": "Неиспользованное",
	"used": "Использован",
	"expired": "Срок действия приглашения истёк",
	"createdAt": "Создано",
	"ascendingOrder": "По возрастанию",
	"descendingOrder": "По убыванию",
	"usedAt": "Использовано",
	"inviteCodeCreated": "Создан пригласительный код",
	"invite": "Пригласить",
	"createInviteCode": "Создать код приглашения",
	"noExpirationDate": "Бессрочно",
	"expirationDate": "Дата истечения",
	"createCount": "Количество приглашений",
	"create": "Создать",
	"state": "Состояние",
	"sort": "Сортировать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"all": "Všetko",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Vytvorené",
	"ascendingOrder": "Vzostupne",
	"descendingOrder": "Zostupne",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Pozvať",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Vytvoriť",
	"state": "Status",
	"sort": "Zoradiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"all": "ทั้งหมด",
	"unused": "ยังไม่ได้ใช้",
	"used": "ถูกใช้แล้ว",
	"expired": "หมดอายุแล้ว",
	"createdAt": "สร้างเมื่อ",
	"ascendingOrder": "เรียงลำดับขึ้น",
	"descendingOrder": "เรียงลำดับลง",
	"usedAt": "วันเวลาที่ถูกใช้",
	"inviteCodeCreated": "สร้างรหัสเชิญแล้ว",
	"invite": "คำเชิญ",
	"createInviteCode": "สร้างรหัสเชิญ",
	"noExpirationDate": "ไม่มีหมดอายุ",
	"expirationDate": "วันที่หมดอายุ",
	"createCount": "จำนวนรหัสเชิญ",
	"create": "สร้าง",
	"state": "สถานะ",
	"sort": "เรียงลำดับ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"all": "Tümü",
	"unused": "Kullanılmamış",
	"used": "Kullanılmış",
	"expired": "Süresi dolmuş",
	"createdAt": "Oluşturuldu",
	"ascendingOrder": "Artan",
	"descendingOrder": "Azalan",
	"usedAt": "Kullanıldığı yer",
	"inviteCodeCreated": "Davet oluşturuldu",
	"invite": "Davet et",
	"createInviteCode": "Davet Kodu oluştur",
	"noExpirationDate": "Son kullanma tarihi yok",
	"expirationDate": "Son kullanma tarihi",
	"createCount": "Davet sayısı",
	"create": "Oluştur",
	"state": "Durum",
	"sort": "Sıralama düzeni"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"all": "All",
	"unused": "Unused",
	"used": "Used",
	"expired": "Expired",
	"createdAt": "Created at",
	"ascendingOrder": "Ascending",
	"descendingOrder": "Descending",
	"usedAt": "Used at",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"createInviteCode": "Generate invite",
	"noExpirationDate": "No expiration",
	"expirationDate": "Expiration date",
	"createCount": "Invite count",
	"create": "Create",
	"state": "State",
	"sort": "Sorting order"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"all": "Всі",
	"unused": "Не використано",
	"used": "Використаний",
	"expired": "Термін дії минув",
	"createdAt": "Створено",
	"ascendingOrder": "За зростанням",
	"descendingOrder": "За спаданням",
	"usedAt": "Використано",
	"inviteCodeCreated": "Запрошення створено",
	"invite": "Запросити",
	"createInviteCode": "Створити запрошення",
	"noExpirationDate": "Без закінчення терміну дії",
	"expirationDate": "Дата закінчення терміну дії",
	"createCount": "Кількість запрошень",
	"create": "Створити",
	"state": "Стан",
	"sort": "Сортування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"all": "Tất cả",
	"unused": "Chưa được sử dụng",
	"used": "Đã được sử dụng",
	"expired": "Đã hết hạn",
	"createdAt": "Ngày tạo",
	"ascendingOrder": "Tăng dần",
	"descendingOrder": "Giảm dần",
	"usedAt": "Sử dụng vào lúc",
	"inviteCodeCreated": "Lời mời đã được tạo",
	"invite": "Mời",
	"createInviteCode": "Tạo lời mời",
	"noExpirationDate": "Vô thời hạn",
	"expirationDate": "Ngày hết hạn",
	"createCount": "Số lượng mời",
	"create": "Tạo",
	"state": "Trạng thái",
	"sort": "Sắp xếp"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"all": "全部",
	"unused": "未使用",
	"used": "已使用",
	"expired": "已过期",
	"createdAt": "创建日期",
	"ascendingOrder": "升序",
	"descendingOrder": "降序",
	"usedAt": "使用时间",
	"inviteCodeCreated": "已生成邀请码",
	"invite": "邀请",
	"createInviteCode": "生成邀请码",
	"noExpirationDate": "不设置有效日期",
	"expirationDate": "有效日期",
	"createCount": "发行数",
	"create": "创建",
	"state": "状态",
	"sort": "排序"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"all": "全部",
	"unused": "未使用",
	"used": "已使用",
	"expired": "過期",
	"createdAt": "建立於",
	"ascendingOrder": "昇冪",
	"descendingOrder": "降冪",
	"usedAt": "使用的日期和時間",
	"inviteCodeCreated": "已建立邀請碼",
	"invite": "邀請",
	"createInviteCode": "建立邀請碼",
	"noExpirationDate": "不設有效日期",
	"expirationDate": "有效日期",
	"createCount": "建立數",
	"create": "新增",
	"state": "狀態",
	"sort": "排序"
}
</locale>
