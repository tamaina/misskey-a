<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i v-if="column.tl != null" :class="basicTimelineIconClass(column.tl)"></i>
		<span style="margin-left: 8px;">{{ column.name || (column.tl ? copyLocaleDictionary(globalLocale.env._timelines)[column.tl] : null) || $locale.sfc.deckColumnsTl }}</span>
	</template>

	<div v-if="!isAvailableBasicTimeline(column.tl)" :class="$style.disabled">
		<p :class="$style.disabledTitle">
			<i class="ti ti-circle-minus"></i>
			{{ $locale.sfc.disabledTimelineTitle }}
		</p>
		<p :class="$style.disabledDescription">{{ $locale.sfc.disabledTimelineDescription }}</p>
	</div>
	<MkStreamingNotesTimeline
		v-else-if="column.tl"
		ref="timeline"
		:key="column.tl + withRenotes + withReplies + onlyFiles"
		:src="column.tl"
		:withRenotes="withRenotes"
		:withReplies="withReplies"
		:withSensitive="withSensitive"
		:onlyFiles="onlyFiles"
		:sound="true"
		:customSound="soundSetting"
	/>
</XColumn>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { onMounted, watch, ref, useTemplateRef, computed } from 'vue';
import { removeColumn, updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { hasWithReplies, isAvailableBasicTimeline, basicTimelineIconClass } from '@features/timelines/frontend/timelines.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = useTemplateRef('timeline');

const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });
const withRenotes = ref(props.column.withRenotes ?? true);
const withReplies = ref(props.column.withReplies ?? false);
const withSensitive = ref(props.column.withSensitive ?? true);
const onlyFiles = ref(props.column.onlyFiles ?? false);

watch(withRenotes, v => {
	updateColumn(props.column.id, {
		withRenotes: v,
	});
});

watch(withReplies, v => {
	updateColumn(props.column.id, {
		withReplies: v,
	});
});

watch(withSensitive, v => {
	updateColumn(props.column.id, {
		withSensitive: v,
	});
});

watch(onlyFiles, v => {
	updateColumn(props.column.id, {
		onlyFiles: v,
	});
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

onMounted(() => {
	if (props.column.tl == null) {
		setType();
	}
});

async function setType() {
	const { canceled, result: src } = await os.select({
		title: globalLocale.value.env.timeline,
		items: [{
			value: 'home', label: $locale.value.sfc.timelinesHome,
		}, {
			value: 'local', label: $locale.value.sfc.timelinesLocal,
		}, {
			value: 'social', label: $locale.value.sfc.timelinesSocial,
		}, {
			value: 'global', label: $locale.value.sfc.timelinesGlobal,
		}],
		default: props.column.tl,
	});
	if (canceled) {
		if (props.column.tl == null) {
			removeColumn(props.column.id);
		}
		return;
	}
	if (src == null) return;
	updateColumn(props.column.id, {
		tl: src ?? undefined,
	});
}

const menu = computed<MenuItem[]>(() => {
	const menuItems: MenuItem[] = [];

	menuItems.push({
		icon: 'ti ti-pencil',
		text: globalLocale.value.env.timeline,
		action: setType,
	}, {
		icon: 'ti ti-bell',
		text: $locale.value.sfc.deckNewNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	}, {
		type: 'switch',
		text: $locale.value.sfc.showRenotes,
		ref: withRenotes,
	});

	if (hasWithReplies(props.column.tl)) {
		menuItems.push({
			type: 'switch',
			text: globalLocale.value.env.showRepliesToOthersInTimeline,
			ref: withReplies,
			disabled: onlyFiles,
		});
	}

	menuItems.push({
		type: 'switch',
		text: $locale.value.sfc.fileAttachedOnly,
		ref: onlyFiles,
		disabled: hasWithReplies(props.column.tl) ? withReplies : false,
	}, {
		type: 'switch',
		text: $locale.value.sfc.withSensitive,
		ref: withSensitive,
	});

	return menuItems;
});
</script>

<style lang="scss" module>
.disabled {
	text-align: center;
}

.disabledTitle {
	margin: 16px;
}

.disabledDescription {
	font-size: 90%;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"deckColumnsTl": "الخط الزمني",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "الرئيسي",
	"timelinesLocal": "المحلي",
	"timelinesSocial": "الاجتماعي",
	"timelinesGlobal": "الشامل",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"deckColumnsTl": "Línia de temps",
	"disabledTimelineTitle": "Línia de tems desactivada",
	"disabledTimelineDescription": "No pots fer servir aquesta línia de temps amb els teus rols actuals.",
	"timelinesHome": "Inici",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Configuració de notificacions per a notes noves",
	"showRenotes": "Mostrar impulsos",
	"fileAttachedOnly": "Només notes amb adjunts",
	"withSensitive": "Incloure notes amb fitxers sensibles"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"deckColumnsTl": "Časová osa",
	"disabledTimelineTitle": "Časová osa vypnuta",
	"disabledTimelineDescription": "Tuto časovou osu nemůžete používat v rámci svých současných rolí.",
	"timelinesHome": "Domů",
	"timelinesLocal": "Místní",
	"timelinesSocial": "Sociální síť",
	"timelinesGlobal": "Globální",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"deckColumnsTl": "Chronik",
	"disabledTimelineTitle": "Chronik deaktiviert",
	"disabledTimelineDescription": "Mit deinen jetzigen Rollen ist diese Chronik nicht verfügbar.",
	"timelinesHome": "Startseite",
	"timelinesLocal": "Lokal",
	"timelinesSocial": "Sozial",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Benachrichtigungseinstellungen für neue Notizen",
	"showRenotes": "Renotes anzeigen",
	"fileAttachedOnly": "Nur Notizen mit Dateien",
	"withSensitive": "Zeige \"sensitive Inhalte\" an"
}
</locale>

<locale lang="json" locale="en-US">
{
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"deckColumnsTl": "Linea de tiempo",
	"disabledTimelineTitle": "Línea de tiempo deshabilitada",
	"disabledTimelineDescription": "No puedes usar esta línea de tiempo con tus roles actuales.",
	"timelinesHome": "Inicio",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Configuración de las notificaciones para notas nuevas",
	"showRenotes": "Mostrar renotas",
	"fileAttachedOnly": "Solo notas con archivos",
	"withSensitive": "Mostrar notas que contengan material sensible"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"deckColumnsTl": "Fil",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Principal",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Afficher les renotes",
	"fileAttachedOnly": "Avec fichiers joints seulement",
	"withSensitive": "Afficher les notes contenant des fichiers joints sensibles"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"deckColumnsTl": "Beranda",
	"disabledTimelineTitle": "Lini masa dinonaktifkan",
	"disabledTimelineDescription": "Saat ini kamu tidak dapat menggunakan lini masa ini karena peran kamu saat ini.",
	"timelinesHome": "Beranda",
	"timelinesLocal": "Lokal",
	"timelinesSocial": "Sosial",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Pengaturan notifikasi untuk note baru",
	"showRenotes": "Tampilkan renote",
	"fileAttachedOnly": "Hanya catatan dengan berkas",
	"withSensitive": "Lampirkan catatan dengan berkas sensitif"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabilitata",
	"disabledTimelineDescription": "Il ruolo in cui sei non ti permette di leggere questa timeline",
	"timelinesHome": "Home",
	"timelinesLocal": "Locale",
	"timelinesSocial": "Sociale",
	"timelinesGlobal": "Federata",
	"deckNewNoteNotificationSettings": "Preferenze per le notifiche di nuove Note",
	"showRenotes": "Includi le Rinota",
	"fileAttachedOnly": "Solo con allegati",
	"withSensitive": "Includi con allegati espliciti"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"deckColumnsTl": "タイムライン",
	"disabledTimelineTitle": "無効化されたタイムライン",
	"disabledTimelineDescription": "現在のロールでは、このタイムラインを使用することはできません。",
	"timelinesHome": "ホーム",
	"timelinesLocal": "ローカル",
	"timelinesSocial": "ソーシャル",
	"timelinesGlobal": "グローバル",
	"deckNewNoteNotificationSettings": "新着ノート通知の設定",
	"showRenotes": "リノートを表示",
	"fileAttachedOnly": "ファイル付きのみ",
	"withSensitive": "センシティブなファイルを含むノートを表示"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"deckColumnsTl": "タイムライン",
	"disabledTimelineTitle": "使われへんタイムライン",
	"disabledTimelineDescription": "あんたの今のロールやったら、このタイムラインは使われへんで。",
	"timelinesHome": "ホーム",
	"timelinesLocal": "ローカル",
	"timelinesSocial": "ソーシャル",
	"timelinesGlobal": "グローバル",
	"deckNewNoteNotificationSettings": "新着ノート通知の設定",
	"showRenotes": "リノート出す",
	"fileAttachedOnly": "ファイルのっけてあるやつだけ",
	"withSensitive": "センシティブなファイルを含むノートを表示"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"deckColumnsTl": "ಸಮಯಸಾಲು",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"deckColumnsTl": "타임라인",
	"disabledTimelineTitle": "비활성화된 타임라인",
	"disabledTimelineDescription": "현재 역할에서는 이 타임라인을 이용할 수 없습니다.",
	"timelinesHome": "홈",
	"timelinesLocal": "로컬",
	"timelinesSocial": "소셜",
	"timelinesGlobal": "글로벌",
	"deckNewNoteNotificationSettings": "새 노트 알림 설정",
	"showRenotes": "리노트 보기",
	"fileAttachedOnly": "미디어를 포함한 노트만",
	"withSensitive": "민감한 파일이 포함된 노트 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"deckColumnsTl": "Tijdlijn",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Startpagina",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"deckColumnsTl": "Tidslinje",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Hjem",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"deckColumnsTl": "Oś czasu",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Strona główna",
	"timelinesLocal": "Lokalne",
	"timelinesSocial": "Społeczność",
	"timelinesGlobal": "Globalna",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Linha do tempo desabilitada",
	"disabledTimelineDescription": "Você não pode acessar essa linha do tempo sob o seu cargo atual.",
	"timelinesHome": "Início",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Opções de notificação para novas notas",
	"showRenotes": "Exibir reposts",
	"fileAttachedOnly": "Apenas notas com arquivos",
	"withSensitive": "Incluir notas com arquivos sensíveis"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"deckColumnsTl": "Лента",
	"disabledTimelineTitle": "Лента отключена",
	"disabledTimelineDescription": "Ваша текущая роль не позволяет пользоваться этой лентой.",
	"timelinesHome": "Персональная",
	"timelinesLocal": "Местная",
	"timelinesSocial": "Социальная",
	"timelinesGlobal": "Всеобщая",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Показывать репосты",
	"fileAttachedOnly": "Только заметки с файлами",
	"withSensitive": "Показывать заметки с NSFW контентом"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"deckColumnsTl": "Časová os",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Domov",
	"timelinesLocal": "Lokálne",
	"timelinesSocial": "Sociálne",
	"timelinesGlobal": "Globálne",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"deckColumnsTl": "ไทม์ไลน์",
	"disabledTimelineTitle": "ปิดใช้งานไทม์ไลน์",
	"disabledTimelineDescription": "คุณไม่สามารถใช้ไทม์ไลน์นี้ภายใต้บทบาทปัจจุบันของคุณได้",
	"timelinesHome": "หน้าหลัก",
	"timelinesLocal": "ท้องถิ่น",
	"timelinesSocial": "โซเชียล",
	"timelinesGlobal": "ทั่วโลก",
	"deckNewNoteNotificationSettings": "ตั้งค่าการแจ้งเตือนเมื่อมีโน้ตใหม่",
	"showRenotes": "แสดงรีโน้ต",
	"fileAttachedOnly": "เฉพาะโน้ตที่มีไฟล์เท่านั้น",
	"withSensitive": "แสดงโน้ตที่มีไฟล์เนื้อหาละเอียดอ่อน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"deckColumnsTl": "Pano",
	"disabledTimelineTitle": "Pano devre dışı bırakıldı",
	"disabledTimelineDescription": "Mevcut rollerinle bu Pano kullanılamaz.",
	"timelinesHome": "Pano",
	"timelinesLocal": "Yerel",
	"timelinesSocial": "Sosyal",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Renote'ları göster",
	"fileAttachedOnly": "Yalnızca dosya içeren notlar",
	"withSensitive": "Hassas dosyalara notlar ekle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"deckColumnsTl": "Стрічка",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Домівка",
	"timelinesLocal": "Локальна",
	"timelinesSocial": "Соціальна",
	"timelinesGlobal": "Глобальна",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Показати поширення",
	"fileAttachedOnly": "Лише нотатки з файлами",
	"withSensitive": "Допис від {name} містить чутливий вміст"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"deckColumnsTl": "Bảng tin",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesHome": "Trang chính",
	"timelinesLocal": "Máy chủ này",
	"timelinesSocial": "Xã hội",
	"timelinesGlobal": "Liên hợp",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"deckColumnsTl": "时间线",
	"disabledTimelineTitle": "时间线已禁用",
	"disabledTimelineDescription": "您不能在当前角色使用时间线。",
	"timelinesHome": "首页",
	"timelinesLocal": "本地",
	"timelinesSocial": "社交",
	"timelinesGlobal": "全局",
	"deckNewNoteNotificationSettings": "新帖子通知设定",
	"showRenotes": "显示转帖",
	"fileAttachedOnly": "仅限媒体",
	"withSensitive": "显示包含敏感媒体的帖子"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"deckColumnsTl": "時間軸",
	"disabledTimelineTitle": "時間軸已停用",
	"disabledTimelineDescription": "目前角色無法使用這個時間軸。",
	"timelinesHome": "首頁",
	"timelinesLocal": "本地",
	"timelinesSocial": "社交",
	"timelinesGlobal": "公開",
	"deckNewNoteNotificationSettings": "新貼文通知的設定",
	"showRenotes": "顯示其他人的轉發貼文",
	"fileAttachedOnly": "只顯示包含附件的貼文",
	"withSensitive": "顯示包含敏感檔案的貼文"
}
</locale>
