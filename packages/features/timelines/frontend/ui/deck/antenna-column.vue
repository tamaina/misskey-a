<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-antenna"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || $locale.sfc.antenna }}</span>
	</template>

	<MkStreamingNotesTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch, defineAsyncComponent, provide } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type * as Misskey from 'misskey-js';
import type { entities as MisskeyEntities } from 'misskey-js';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });
const antenna = ref<Misskey.entities.Antenna | null>(null);

provide('currentAntenna', antenna);

watch(() => props.column.antennaId, async (antennaId) => {
	if (antennaId == null) return;
	antenna.value = await misskeyApi('antennas/show', { antennaId });
}, { immediate: true });

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	} else if (props.column.timelineNameCache == null) {
		misskeyApi('antennas/show', { antennaId: props.column.antennaId })
			.then(value => updateColumn(props.column.id, { timelineNameCache: value.name }));
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setAntenna() {
	const antennas = await misskeyApi('antennas/list');
	const { canceled, result: antennaIdOrOperation } = await os.select({
		title: $locale.value.sfc.selectAntenna,
		items: [
			{ value: '_CREATE_', label: $locale.value.sfc.createNew },
			(antennas.length > 0 ? {
				type: 'group' as const,
				label: $locale.value.sfc.createdAntennas,
				items: antennas.map(x => ({
					value: x.id, label: x.name,
				})),
			} : undefined),
		],
		default: antennas.find(x => x.id === props.column.antennaId)?.id,
	});

	if (canceled || antennaIdOrOperation == null) return;

	if (antennaIdOrOperation === '_CREATE_') {
		const { dispose } = await os.popupAsyncWithDialog(import('@features/timelines/frontend/components/MkAntennaEditorDialog.vue').then(x => x.default), {}, {
			created: (newAntenna: MisskeyEntities.Antenna) => {
				antennasCache.delete();
				updateColumn(props.column.id, {
					antennaId: newAntenna.id,
					timelineNameCache: newAntenna.name,
				});
			},
			closed: () => {
				dispose();
			},
		});
		return;
	}

	const selectedAntenna = antennas.find(x => x.id === antennaIdOrOperation);
	if (selectedAntenna == null) return;

	updateColumn(props.column.id, {
		antennaId: selectedAntenna.id,
		timelineNameCache: selectedAntenna.name,
	});
}

function editAntenna() {
	os.pageWindow('/my/antennas/' + props.column.antennaId);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: $locale.value.sfc.selectAntenna,
		action: setAntenna,
	},
	{
		icon: 'ti ti-settings',
		text: $locale.value.sfc.editAntenna,
		action: editAntenna,
	},
	{
		icon: 'ti ti-bell',
		text: $locale.value.sfc.newNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	},
];

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>

<locale locale="ar-SA" lang="json">
{
	"antenna": "الهوائيات",
	"selectAntenna": "اختر هوائيًا",
	"createNew": "أنشِئ جديد",
	"createdAntennas": "Created antennas",
	"editAntenna": "عدّل الهوائي",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"antenna": "Antena",
	"selectAntenna": "Tria una antena",
	"createNew": "Crear",
	"createdAntennas": "Antenes creades",
	"editAntenna": "Modificar antena",
	"newNoteNotificationSettings": "Configuració de notificacions per a notes noves"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"antenna": "Antény",
	"selectAntenna": "Vyberte Anténu",
	"createNew": "Vytvořit nový",
	"createdAntennas": "Created antennas",
	"editAntenna": "Upravit anténu",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"antenna": "Antennas",
	"selectAntenna": "Select an antenna",
	"createNew": "Create new",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"antenna": "Antennen",
	"selectAntenna": "Antenne auswählen",
	"createNew": "Neu erstellen",
	"createdAntennas": "Erstellte Antennen",
	"editAntenna": "Antenne bearbeiten",
	"newNoteNotificationSettings": "Benachrichtigungseinstellungen für neue Notizen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"antenna": "Antennas",
	"selectAntenna": "Select an antenna",
	"createNew": "Create new",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"antenna": "Antenas",
	"selectAntenna": "Seleccionar antena",
	"createNew": "Crear Nuevo",
	"createdAntennas": "Antenas creadas",
	"editAntenna": "Editar antena",
	"newNoteNotificationSettings": "Configuración de las notificaciones para notas nuevas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"antenna": "Antennes",
	"selectAntenna": "Sélectionner une antenne",
	"createNew": "Créer",
	"createdAntennas": "Antennes créées",
	"editAntenna": "Modifier l'antenne",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"antenna": "Antena",
	"selectAntenna": "Pilih Antena",
	"createNew": "Buat baru",
	"createdAntennas": "Antena yang dibuat",
	"editAntenna": "Sunting antena",
	"newNoteNotificationSettings": "Pengaturan notifikasi untuk note baru"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"antenna": "Antenne",
	"selectAntenna": "Scegli un'antenna",
	"createNew": "Crea",
	"createdAntennas": "Antenne create",
	"editAntenna": "Modifica Antenna",
	"newNoteNotificationSettings": "Preferenze per le notifiche di nuove Note"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"antenna": "アンテナ",
	"selectAntenna": "アンテナを選択",
	"createNew": "新規作成",
	"createdAntennas": "作成したアンテナ",
	"editAntenna": "アンテナを編集",
	"newNoteNotificationSettings": "新着ノート通知の設定"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"antenna": "アンテナ",
	"selectAntenna": "アンテナを選ぶ",
	"createNew": "新しく作るで",
	"createdAntennas": "作成したアンテナ",
	"editAntenna": "アンテナいじる",
	"newNoteNotificationSettings": "新着ノート通知の設定"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"antenna": "Antennas",
	"selectAntenna": "Select an antenna",
	"createNew": "Create new",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"antenna": "Antennas",
	"selectAntenna": "Select an antenna",
	"createNew": "Create new",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"antenna": "안테나",
	"selectAntenna": "안테나 선택",
	"createNew": "새로 만들기",
	"createdAntennas": "만든 안테나",
	"editAntenna": "안테나 편집",
	"newNoteNotificationSettings": "새 노트 알림 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"antenna": "Antennes",
	"selectAntenna": "Kies een antenne",
	"createNew": "Nieuwe aanmaken",
	"createdAntennas": "Created antennas",
	"editAntenna": "Antenne bewerken",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"antenna": "Antenner",
	"selectAntenna": "Velg en antenne",
	"createNew": "Create new",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"antenna": "Anteny",
	"selectAntenna": "Wybierz Antennę",
	"createNew": "Utwórz nowy",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edytuj antenę",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"antenna": "Antenas",
	"selectAntenna": "Selecione uma antena",
	"createNew": "Criar novo",
	"createdAntennas": "Antenas criadas",
	"editAntenna": "Editar antena",
	"newNoteNotificationSettings": "Opções de notificação para novas notas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"antenna": "Антенны",
	"selectAntenna": "Выберите антенну",
	"createNew": "Новый документ",
	"createdAntennas": "Созданные антенны",
	"editAntenna": "Редактировать антенну",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"antenna": "Antény",
	"selectAntenna": "Vyberte anténu",
	"createNew": "Vytvoriť nový",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"antenna": "เสาอากาศ",
	"selectAntenna": "เลือกเสาอากาศ",
	"createNew": "สร้างใหม่",
	"createdAntennas": "เสาอากาศที่ถูกสร้าง",
	"editAntenna": "แก้ไขเสาอากาศ",
	"newNoteNotificationSettings": "ตั้งค่าการแจ้งเตือนเมื่อมีโน้ตใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"antenna": "Antenler",
	"selectAntenna": "Bir anten seç",
	"createNew": "Yeni oluştur",
	"createdAntennas": "Oluşturulan antenler",
	"editAntenna": "Anteni düzenle",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"antenna": "Antennas",
	"selectAntenna": "Select an antenna",
	"createNew": "Create new",
	"createdAntennas": "Created antennas",
	"editAntenna": "Edit antenna",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"antenna": "Антени",
	"selectAntenna": "Виберіть антену",
	"createNew": "Створити новий",
	"createdAntennas": "Створені антени",
	"editAntenna": "Редагувати антену",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"antenna": "Trạm phát sóng",
	"selectAntenna": "Chọn một antenna",
	"createNew": "Tạo mới",
	"createdAntennas": "Created antennas",
	"editAntenna": "Chỉnh sửa Ăngten",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"antenna": "天线",
	"selectAntenna": "选择天线",
	"createNew": "新建",
	"createdAntennas": "已创建的天线",
	"editAntenna": "编辑天线",
	"newNoteNotificationSettings": "新帖子通知设定"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"antenna": "天線",
	"selectAntenna": "選擇天線",
	"createNew": "新建",
	"createdAntennas": "已建立的天線",
	"editAntenna": "編輯天線",
	"newNoteNotificationSettings": "新貼文通知的設定"
}
</locale>
