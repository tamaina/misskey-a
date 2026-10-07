<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-badge"></i><span style="margin-left: 8px;">{{ column.name || column.timelineNameCache || $locale.sfc.roleTimeline }}</span>
	</template>

	<MkStreamingNotesTimeline v-if="column.roleId" ref="timeline" src="role" :role="column.roleId"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

onMounted(() => {
	if (props.column.roleId == null) {
		setRole();
	} else if (props.column.timelineNameCache == null) {
		misskeyApi('roles/show', { roleId: props.column.roleId })
			.then(value => updateColumn(props.column.id, { timelineNameCache: value.name }));
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setRole() {
	const roles = (await misskeyApi('roles/list')).filter(x => x.isExplorable);
	const { canceled, result: roleId } = await os.select({
		title: $locale.value.sfc.role,
		items: roles.map(x => ({
			value: x.id, label: x.name,
		})),
		default: roles.find(x => x.id === props.column.roleId)?.id,
	});
	if (canceled || roleId == null) return;
	const role = roles.find(x => x.id === roleId)!;
	updateColumn(props.column.id, {
		roleId: role.id,
		timelineNameCache: role.name,
	});
}

const menu: MenuItem[] = [{
	icon: 'ti ti-pencil',
	text: $locale.value.sfc.role,
	action: setRole,
}, {
	icon: 'ti ti-bell',
	text: $locale.value.sfc.newNoteNotificationSettings,
	action: () => soundSettingsButton(soundSetting),
}];

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
	"roleTimeline": "Role Timeline",
	"role": "الدور",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"roleTimeline": "Línia de temps dels rols",
	"role": "Rols",
	"newNoteNotificationSettings": "Configuració de notificacions per a notes noves"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"roleTimeline": "Časová osa role",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"roleTimeline": "Rollenchronik",
	"role": "Rolle",
	"newNoteNotificationSettings": "Benachrichtigungseinstellungen für neue Notizen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"roleTimeline": "Linea de tiempo del rol",
	"role": "Rol",
	"newNoteNotificationSettings": "Configuración de las notificaciones para notas nuevas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Rôles",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"roleTimeline": "Lini masa peran",
	"role": "Peran",
	"newNoteNotificationSettings": "Pengaturan notifikasi untuk note baru"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"roleTimeline": "Timeline Ruolo",
	"role": "Ruolo",
	"newNoteNotificationSettings": "Preferenze per le notifiche di nuove Note"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"roleTimeline": "ロールタイムライン",
	"role": "ロール",
	"newNoteNotificationSettings": "新着ノート通知の設定"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"roleTimeline": "ロールタイムライン",
	"role": "ロール",
	"newNoteNotificationSettings": "新着ノート通知の設定"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"roleTimeline": "역할 타임라인",
	"role": "역할",
	"newNoteNotificationSettings": "새 노트 알림 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Rolle",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Rola",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"roleTimeline": "Linha do tempo do cargo",
	"role": "Cargo",
	"newNoteNotificationSettings": "Opções de notificação para novas notas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"roleTimeline": "История Ролей",
	"role": "Роль",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"roleTimeline": "บทบาทไทม์ไลน์",
	"role": "บทบาท",
	"newNoteNotificationSettings": "ตั้งค่าการแจ้งเตือนเมื่อมีโน้ตใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"roleTimeline": "Rol Pano",
	"role": "Rol",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Role",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Роль",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"roleTimeline": "Role Timeline",
	"role": "Vai trò",
	"newNoteNotificationSettings": "Notification setting for new notes"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"roleTimeline": "角色时间线",
	"role": "角色",
	"newNoteNotificationSettings": "新帖子通知设定"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"roleTimeline": "角色時間軸",
	"role": "角色",
	"newNoteNotificationSettings": "新貼文通知的設定"
}
</locale>
