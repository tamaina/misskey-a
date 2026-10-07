<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-userList">
	<template #icon><i class="ti ti-users"></i></template>
	<template #header>{{ list ? list.name : $locale.sfc.userList }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure()"><i class="ti ti-settings"></i></button></template>

	<div :class="$style.root">
		<div v-if="widgetProps.listId == null" class="init">
			<MkButton primary @click="chooseList">{{ $locale.sfc.chooseList }}</MkButton>
		</div>
		<MkLoading v-else-if="fetching"/>
		<div v-else class="users">
			<span v-for="user in users" :key="user.id" class="user">
				<MkAvatar :user="user" class="avatar" indicator link preview/>
			</span>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useInterval } from '@@/js/use-interval.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const name = 'userList';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
	listId: {
		type: 'string',
		default: null as string | null,
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const list = ref<Misskey.entities.UserList | null>(null);
const users = ref<Misskey.entities.UserDetailed[]>([]);
const fetching = ref(true);

async function chooseList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: listId } = await os.select({
		title: $locale.value.sfc.selectList,
		items: lists.map(x => ({
			value: x.id, label: x.name,
		})),
		default: widgetProps.listId,
	});
	if (canceled || listId == null) return;
	const list = lists.find(x => x.id === listId)!;
	widgetProps.listId = list.id;
	save();
	fetch();
}

const fetch = () => {
	if (widgetProps.listId == null) {
		fetching.value = false;
		return;
	}

	misskeyApi('users/lists/show', {
		listId: widgetProps.listId,
	}).then(_list => {
		list.value = _list;
		misskeyApi('users/show', {
			userIds: list.value.userIds ?? [],
		}).then(_users => {
			users.value = _users;
			fetching.value = false;
		});
	});
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	&:global {
		> .init {
			padding: 16px;
		}

		> .users {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(30px, 40px));
			grid-gap: 12px;
			place-content: center;
			padding: 16px;

			> .user {
				width: 100%;
				height: 100%;
				aspect-ratio: 1;

				> .avatar {
					width: 100%;
					height: 100%;
				}
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"userList": "قائمة المستخدمين",
	"chooseList": "اختر قائمة",
	"showHeader": "Show header",
	"selectList": "اختر قائمة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"userList": "Llistat d'usuaris",
	"chooseList": "Tria una llista",
	"showHeader": "Mostrar la capçalera",
	"selectList": "Tria una llista"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"userList": "Seznam uživatelů",
	"chooseList": "Vybrat seznam",
	"showHeader": "Show header",
	"selectList": "Vybrat seznam"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"userList": "User list",
	"chooseList": "Select a list",
	"showHeader": "Show header",
	"selectList": "Select a list"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"userList": "Benutzerliste",
	"chooseList": "Liste auswählen",
	"showHeader": "Kopfzeile anzeigen",
	"selectList": "Liste auswählen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"userList": "User list",
	"chooseList": "Select a list",
	"showHeader": "Show header",
	"selectList": "Select a list"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"userList": "Lista de usuarios",
	"chooseList": "Seleccione una lista",
	"showHeader": "Mostrar encabezados",
	"selectList": "Selecciona una lista"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"userList": "Liste utilisateur",
	"chooseList": "Sélectionner une liste",
	"showHeader": "Show header",
	"selectList": "Sélectionner une liste"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"userList": "Daftar pengguna",
	"chooseList": "Pilih daftar",
	"showHeader": "Show header",
	"selectList": "Pilih daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"userList": "Lista profili",
	"chooseList": "Seleziona una lista",
	"showHeader": "Mostra la testata",
	"selectList": "Seleziona una lista"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"userList": "ユーザーリスト",
	"chooseList": "リストを選択",
	"showHeader": "ヘッダーを表示",
	"selectList": "リストを選択"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"userList": "ユーザーリスト",
	"chooseList": "リストを選ぶ",
	"showHeader": "ヘッダー出す",
	"selectList": "リストを選ぶ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"userList": "User list",
	"chooseList": "Fren tabdart",
	"showHeader": "Show header",
	"selectList": "Fren tabdart"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"userList": "User list",
	"chooseList": "Select a list",
	"showHeader": "Show header",
	"selectList": "Select a list"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"userList": "유저 리스트",
	"chooseList": "리스트 선택",
	"showHeader": "해더를 표시",
	"selectList": "리스트 선택"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"userList": "User list",
	"chooseList": "Kies een lijst.",
	"showHeader": "Show header",
	"selectList": "Kies een lijst."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"userList": "Brukerliste",
	"chooseList": "Velg liste",
	"showHeader": "Show header",
	"selectList": "Velg en liste"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"userList": "Lista użytkowników",
	"chooseList": "Wybierz listę",
	"showHeader": "Show header",
	"selectList": "Wybierz listę"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"userList": "Lista de usuários",
	"chooseList": "Selecione uma lista",
	"showHeader": "Exibir cabeçalho",
	"selectList": "Selecione uma lista"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"userList": "Список аккаунтов",
	"chooseList": "Выберите список",
	"showHeader": "Show header",
	"selectList": "Выберите список"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"userList": "User list",
	"chooseList": "Vyberte zoznam",
	"showHeader": "Show header",
	"selectList": "Vyberte zoznam"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"userList": "รายชื่อผู้ใช้",
	"chooseList": "เลือกรายชื่อ",
	"showHeader": "แสดงส่วนหัว",
	"selectList": "เลือกรายชื่อ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"userList": "Kullanıcı listesi",
	"chooseList": "Bir liste seçin",
	"showHeader": "Başlığı göster",
	"selectList": "Bir liste seç"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"userList": "User list",
	"chooseList": "Select a list",
	"showHeader": "Show header",
	"selectList": "Select a list"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"userList": "Список користувачів",
	"chooseList": "Виберіть список",
	"showHeader": "Show header",
	"selectList": "Виберіть список"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"userList": "Danh sách người dùng",
	"chooseList": "Chọn danh sách",
	"showHeader": "Show header",
	"selectList": "Chọn danh sách"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"userList": "用户列表",
	"chooseList": "选择列表",
	"showHeader": "显示标题",
	"selectList": "选择列表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"userList": "使用者列表",
	"chooseList": "選擇清單",
	"showHeader": "檢視標頭 ",
	"selectList": "選擇清單"
}
</locale>
