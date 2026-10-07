<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-list"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || $locale.sfc.list }}</span>
	</template>

	<MkStreamingNotesTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" :withRenotes="withRenotes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { watch, useTemplateRef, ref, onMounted } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { entities as MisskeyEntities } from 'misskey-js';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { userListsCache } from '@features/runtime/frontend/cache.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const withRenotes = ref(props.column.withRenotes ?? true);
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

onMounted(() => {
	if (props.column.listId == null) {
		setList();
	} else if (props.column.timelineNameCache == null) {
		misskeyApi('users/lists/show', { listId: props.column.listId })
			.then(value => updateColumn(props.column.id, { timelineNameCache: value.name }));
	}
});

watch(withRenotes, v => {
	updateColumn(props.column.id, {
		withRenotes: v,
	});
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: listIdOrOperation } = await os.select({
		title: $locale.value.sfc.selectList,
		items: [
			{ value: '_CREATE_', label: $locale.value.sfc.createNew },
			(lists.length > 0 ? {
				type: 'group' as const,
				label: $locale.value.sfc.createdLists,
				items: lists.map(x => ({
					value: x.id, label: x.name,
				})),
			} : undefined),
		],
		default: lists.find(x => x.id === props.column.listId)?.id,
	});
	if (canceled || listIdOrOperation == null) return;

	if (listIdOrOperation === '_CREATE_') {
		const { canceled, result: name } = await os.inputText({
			title: $locale.value.sfc.enterListName,
		});
		if (canceled || name == null || name === '') return;

		const res = await os.apiWithDialog('users/lists/create', { name: name });
		userListsCache.delete();

		updateColumn(props.column.id, {
			listId: res.id,
			timelineNameCache: res.name,
		});
	} else {
		const list = lists.find(x => x.id === listIdOrOperation)!;

		updateColumn(props.column.id, {
			listId: list.id,
			timelineNameCache: list.name,
		});
	}
}

function editList() {
	os.pageWindow('/my/lists/' + props.column.listId);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: $locale.value.sfc.selectList,
		action: setList,
	},
	{
		icon: 'ti ti-settings',
		text: $locale.value.sfc.editList,
		action: editList,
	},
	{
		type: 'switch',
		text: $locale.value.sfc.showRenotes,
		ref: withRenotes,
	},
	{
		icon: 'ti ti-bell',
		text: $locale.value.sfc.newNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	},
];
</script>

<locale locale="ar-SA" lang="json">
{
	"selectList": "اختر قائمة",
	"createNew": "أنشِئ جديد",
	"createdLists": "Created lists",
	"enterListName": "اسم القائمة",
	"editList": "عدّل القائمة",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "القوائم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"selectList": "Tria una llista",
	"createNew": "Crear",
	"createdLists": "Llistes creades ",
	"enterListName": "Introdueix un nom per a la llista",
	"editList": "Editar llista",
	"showRenotes": "Mostrar impulsos",
	"newNoteNotificationSettings": "Configuració de notificacions per a notes noves",
	"list": "Llistes"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"selectList": "Vybrat seznam",
	"createNew": "Vytvořit nový",
	"createdLists": "Created lists",
	"enterListName": "Jméno seznamu",
	"editList": "Upravit seznam",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Seznamy"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"selectList": "Select a list",
	"createNew": "Create new",
	"createdLists": "Created lists",
	"enterListName": "Enter a name for the list",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "List"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"selectList": "Liste auswählen",
	"createNew": "Neu erstellen",
	"createdLists": "Erstellte Listen",
	"enterListName": "Listennamen eingeben",
	"editList": "Liste bearbeiten",
	"showRenotes": "Renotes anzeigen",
	"newNoteNotificationSettings": "Benachrichtigungseinstellungen für neue Notizen",
	"list": "Listen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"selectList": "Select a list",
	"createNew": "Create new",
	"createdLists": "Created lists",
	"enterListName": "Enter a name for the list",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "List"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"selectList": "Selecciona una lista",
	"createNew": "Crear Nuevo",
	"createdLists": "Listas creadas",
	"enterListName": "Introduce un nombre para la lista",
	"editList": "Editar lista",
	"showRenotes": "Mostrar renotas",
	"newNoteNotificationSettings": "Configuración de las notificaciones para notas nuevas",
	"list": "Listas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"selectList": "Sélectionner une liste",
	"createNew": "Créer",
	"createdLists": "Listes créées",
	"enterListName": "Nom de la liste",
	"editList": "Modifier la liste",
	"showRenotes": "Afficher les renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Listes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"selectList": "Pilih daftar",
	"createNew": "Buat baru",
	"createdLists": "Senarai yang dibuat",
	"enterListName": "Masukkan nama daftar",
	"editList": "Sunting daftar",
	"showRenotes": "Tampilkan renote",
	"newNoteNotificationSettings": "Pengaturan notifikasi untuk note baru",
	"list": "Daftar"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"selectList": "Seleziona una lista",
	"createNew": "Crea",
	"createdLists": "Liste create",
	"enterListName": "Nome della lista",
	"editList": "Modifica Lista",
	"showRenotes": "Includi le Rinota",
	"newNoteNotificationSettings": "Preferenze per le notifiche di nuove Note",
	"list": "Liste"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"selectList": "リストを選択",
	"createNew": "新規作成",
	"createdLists": "作成したリスト",
	"enterListName": "リスト名を入力",
	"editList": "リストを編集",
	"showRenotes": "リノートを表示",
	"newNoteNotificationSettings": "新着ノート通知の設定",
	"list": "リスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"selectList": "リストを選ぶ",
	"createNew": "新しく作るで",
	"createdLists": "作成したリスト",
	"enterListName": "リスト名を入れてや",
	"editList": "リストいじる",
	"showRenotes": "リノート出す",
	"newNoteNotificationSettings": "新着ノート通知の設定",
	"list": "リスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"selectList": "Fren tabdart",
	"createNew": "Create new",
	"createdLists": "Created lists",
	"enterListName": "Isem n tebdart",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Tibdarin"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"selectList": "Select a list",
	"createNew": "Create new",
	"createdLists": "Created lists",
	"enterListName": "Enter a name for the list",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "List"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"selectList": "리스트 선택",
	"createNew": "새로 만들기",
	"createdLists": "만든 리스트",
	"enterListName": "리스트 이름을 입력",
	"editList": "리스트 편집",
	"showRenotes": "리노트 보기",
	"newNoteNotificationSettings": "새 노트 알림 설정",
	"list": "리스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"selectList": "Kies een lijst.",
	"createNew": "Nieuwe aanmaken",
	"createdLists": "Created lists",
	"enterListName": "Voer de naam van de lijst in",
	"editList": "Lijst bewerken",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Lijsten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"selectList": "Velg en liste",
	"createNew": "Create new",
	"createdLists": "Created lists",
	"enterListName": "Skriv inn et navn på listen",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Lister"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"selectList": "Wybierz listę",
	"createNew": "Utwórz nowy",
	"createdLists": "Created lists",
	"enterListName": "Nazwa listy",
	"editList": "Edytuj listę",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Listy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"selectList": "Selecione uma lista",
	"createNew": "Criar novo",
	"createdLists": "Listas criadas",
	"enterListName": "Insira um nome para a lista",
	"editList": "Editar lista",
	"showRenotes": "Exibir reposts",
	"newNoteNotificationSettings": "Opções de notificação para novas notas",
	"list": "Listas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"selectList": "Выберите список",
	"createNew": "Новый документ",
	"createdLists": "Созданные списки",
	"enterListName": "Название списка",
	"editList": "Редактировать список",
	"showRenotes": "Показывать репосты",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Списки"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"selectList": "Vyberte zoznam",
	"createNew": "Vytvoriť nový",
	"createdLists": "Created lists",
	"enterListName": "Zadajte názov zoznamu",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Zoznam"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"selectList": "เลือกรายชื่อ",
	"createNew": "สร้างใหม่",
	"createdLists": "รายชื่อที่ถูกสร้าง",
	"enterListName": "ป้อนนามเรียกของรายชื่อชุดนี้",
	"editList": "แก้ไขรายชื่อ",
	"showRenotes": "แสดงรีโน้ต",
	"newNoteNotificationSettings": "ตั้งค่าการแจ้งเตือนเมื่อมีโน้ตใหม่",
	"list": "รายการ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"selectList": "Bir liste seç",
	"createNew": "Yeni oluştur",
	"createdLists": "Oluşturulan listeler",
	"enterListName": "Listeye bir ad girin",
	"editList": "Listeyi düzenle",
	"showRenotes": "Renote'ları göster",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Liste"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"selectList": "Select a list",
	"createNew": "Create new",
	"createdLists": "Created lists",
	"enterListName": "Enter a name for the list",
	"editList": "Edit list",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "List"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"selectList": "Виберіть список",
	"createNew": "Створити новий",
	"createdLists": "Створені списки",
	"enterListName": "Введіть назву списку",
	"editList": "Редагувати список",
	"showRenotes": "Показати поширення",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Списки"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"selectList": "Chọn danh sách",
	"createNew": "Tạo mới",
	"createdLists": "Created lists",
	"enterListName": "Đặt tên cho danh sách",
	"editList": "Chỉnh sửa danh sách",
	"showRenotes": "Show renotes",
	"newNoteNotificationSettings": "Notification setting for new notes",
	"list": "Danh sách"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"selectList": "选择列表",
	"createNew": "新建",
	"createdLists": "已创建的列表",
	"enterListName": "输入列表名称",
	"editList": "编辑列表",
	"showRenotes": "显示转帖",
	"newNoteNotificationSettings": "新帖子通知设定",
	"list": "列表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"selectList": "選擇清單",
	"createNew": "新建",
	"createdLists": "已建立的清單",
	"enterListName": "輸入清單名稱",
	"editList": "編輯清單",
	"showRenotes": "顯示其他人的轉發貼文",
	"newNoteNotificationSettings": "新貼文通知的設定",
	"list": "清單"
}
</locale>
