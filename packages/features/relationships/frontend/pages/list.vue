<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div v-if="error != null" class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkResult type="error"/>
	</div>
	<div v-else-if="list" class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="list" class="members _margin">
			<div :class="$style.member_text">{{ $locale.sfc.members }}</div>
			<div class="_gaps_s">
				<div v-for="user in users" :key="user.id" :class="$style.userItem">
					<MkA :class="$style.userItemBody" :to="`${userPage(user)}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</div>
			</div>
		</div>
		<MkButton v-if="list.isLiked" v-tooltip="$locale.sfc.unlike" inline :class="$style.button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="list.likedCount != null && list.likedCount > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton v-if="!list.isLiked" v-tooltip="$locale.sfc.like" inline :class="$style.button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="1 > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton inline @click="create()"><i class="ti ti-download" :class="$style.import"></i>{{ $locale.sfc.import }}</MkButton>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { userPage } from '@features/users/frontend/filters/user.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { definePage } from '@features/navigation/frontend/page.js';

const props = defineProps<{
	listId: string;
}>();

const list = ref<Misskey.entities.UsersListsShowResponse | null>(null);
const error = ref<unknown | null>(null);
const users = ref<Misskey.entities.UserDetailed[]>([]);

function fetchList(): void {
	misskeyApi('users/lists/show', {
		listId: props.listId,
		forPublic: true,
	}).then(_list => {
		list.value = _list;
		if (_list.userIds == null || _list.userIds.length === 0) return;
		misskeyApi('users/show', {
			userIds: _list.userIds,
		}).then(_users => {
			users.value = _users;
		});
	}).catch(err => {
		error.value = err;
	});
}

function like() {
	if (list.value == null) return;
	os.apiWithDialog('users/lists/favorite', {
		listId: list.value.id,
	}).then(() => {
		if (list.value == null) return;
		list.value.isLiked = true;
		list.value.likedCount = (list.value.likedCount != null ? list.value.likedCount + 1 : 1);
	});
}

function unlike() {
	if (list.value == null) return;
	os.apiWithDialog('users/lists/unfavorite', {
		listId: list.value.id,
	}).then(() => {
		if (list.value == null) return;
		list.value.isLiked = false;
		list.value.likedCount = (list.value.likedCount != null ? Math.max(0, list.value.likedCount - 1) : 0);
	});
}

async function create() {
	if (list.value == null) return;
	const { canceled, result: name } = await os.inputText({
		title: $locale.value.sfc.enterListName,
	});
	if (canceled || name == null) return;
	await os.apiWithDialog('users/lists/create-from-public', { name: name, listId: list.value.id });
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = computed(() => []);

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
.member_text {
	margin: 5px;
}

.root {
	padding: 32px;
	text-align: center;
  align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.img {
	vertical-align: bottom;
  width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}

.button {
	margin-right: 10px;
}

.import {
	margin-right: 4px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"members": "الأعضاء",
	"unlike": "ألغِ الإعجاب",
	"like": "أعجبني",
	"import": "استيراد",
	"enterListName": "اسم القائمة",
	"lists": "القوائم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"members": "Membres",
	"unlike": "Treure m'agrada ",
	"like": "M'agrada ",
	"import": "Importar",
	"enterListName": "Introdueix un nom per a la llista",
	"lists": "Llistes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"members": "Členové",
	"unlike": "Už se mi to nelíbí",
	"like": "To se mi líbí",
	"import": "Importovat",
	"enterListName": "Jméno seznamu",
	"lists": "Seznamy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"members": "Members",
	"unlike": "Unlike",
	"like": "Like",
	"import": "Import",
	"enterListName": "Enter a name for the list",
	"lists": "Lists"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"members": "Mitglieder",
	"unlike": "\"Gefällt mir\" entfernen",
	"like": "Gefällt mir",
	"import": "Import",
	"enterListName": "Listennamen eingeben",
	"lists": "Listen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"members": "Members",
	"unlike": "Unlike",
	"like": "Like",
	"import": "Import",
	"enterListName": "Enter a name for the list",
	"lists": "Lists"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"members": "Miembros",
	"unlike": "Quitar 'me gusta'",
	"like": "¡Muy bien!",
	"import": "Importar",
	"enterListName": "Introduce un nombre para la lista",
	"lists": "Listas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"members": "Membres",
	"unlike": "Ne plus aimer",
	"like": "J'aime",
	"import": "Importer",
	"enterListName": "Nom de la liste",
	"lists": "Listes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"members": "Anggota",
	"unlike": "Tidak Suka",
	"like": "Suka",
	"import": "Impor",
	"enterListName": "Masukkan nama daftar",
	"lists": "Daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"members": "Membri",
	"unlike": "Non mi piace",
	"like": "Mi piace!",
	"import": "Importa",
	"enterListName": "Nome della lista",
	"lists": "Liste"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"members": "メンバー",
	"unlike": "いいねを解除",
	"like": "いいね！",
	"import": "インポート",
	"enterListName": "リスト名を入力",
	"lists": "リスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"members": "メンバーはん",
	"unlike": "いいねやめる",
	"like": "ええやん！",
	"import": "インポート",
	"enterListName": "リスト名を入れてや",
	"lists": "リスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"members": "Members",
	"unlike": "Unlike",
	"like": "Like",
	"import": "Kter",
	"enterListName": "Isem n tebdart",
	"lists": "Tibdarin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"members": "Members",
	"unlike": "Unlike",
	"like": "Like",
	"import": "ಆಮದು",
	"enterListName": "Enter a name for the list",
	"lists": "Lists"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"members": "멤버",
	"unlike": "좋아요 취소",
	"like": "좋아요!",
	"import": "가져오기",
	"enterListName": "리스트 이름을 입력",
	"lists": "리스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"members": "Leden",
	"unlike": "Unlike",
	"like": "Like",
	"import": "Import",
	"enterListName": "Voer de naam van de lijst in",
	"lists": "Lijsten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"members": "Medlemmer",
	"unlike": "Liker ikke",
	"like": "Liker!",
	"import": "Importer",
	"enterListName": "Skriv inn et navn på listen",
	"lists": "Lister"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"members": "Członkowie",
	"unlike": "Usuń polubienie",
	"like": "Polub",
	"import": "Importuj",
	"enterListName": "Nazwa listy",
	"lists": "Listy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"members": "Membros",
	"unlike": "Remover curtida",
	"like": "Curtir",
	"import": "Importar",
	"enterListName": "Insira um nome para a lista",
	"lists": "Listas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"members": "Участники",
	"unlike": "Отменить «нравится»",
	"like": "Нравится!",
	"import": "Импорт",
	"enterListName": "Название списка",
	"lists": "Списки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"members": "Členovia",
	"unlike": "Unlike",
	"like": "Páči sa mi",
	"import": "Importovať",
	"enterListName": "Zadajte názov zoznamu",
	"lists": "Zoznamy"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"members": "สมาชิก",
	"unlike": "เลิกถูกใจ",
	"like": "ถูกใจ!",
	"import": "นำเข้า",
	"enterListName": "ป้อนนามเรียกของรายชื่อชุดนี้",
	"lists": "รายชื่อ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"members": "Üyeler",
	"unlike": "Beğenme",
	"like": "Beğen",
	"import": "İçeri aktar",
	"enterListName": "Listeye bir ad girin",
	"lists": "Listeler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"members": "Members",
	"unlike": "Unlike",
	"like": "Like",
	"import": "Import",
	"enterListName": "Enter a name for the list",
	"lists": "Lists"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"members": "Учасники",
	"unlike": "Не вподобати",
	"like": "Вподобати",
	"import": "Імпорт",
	"enterListName": "Введіть назву списку",
	"lists": "Списки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"members": "Thành viên",
	"unlike": "Bỏ lượt thích",
	"like": "Thích",
	"import": "Nhập dữ liệu",
	"enterListName": "Đặt tên cho danh sách",
	"lists": "Danh sách"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"members": "成员",
	"unlike": "取消喜欢",
	"like": "点赞！",
	"import": "导入",
	"enterListName": "输入列表名称",
	"lists": "列表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"members": "成員",
	"unlike": "收回讚",
	"like": "讚",
	"import": "匯入",
	"enterListName": "輸入清單名稱",
	"lists": "清單"
}
</locale>
