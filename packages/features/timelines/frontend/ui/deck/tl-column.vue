<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i v-if="column.tl != null" :class="basicTimelineIconClass(column.tl)"></i>
		<span style="margin-left: 8px;">{{ column.name || (column.tl ? copyLocaleDictionary($locale.sfc.timelinesLabels)[column.tl] : null) || $locale.sfc.deckColumnsTl }}</span>
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
import { onMounted, watch, ref, useTemplateRef, computed } from 'vue';
import XColumn from '../../../../navigation/frontend/ui/deck/column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { SoundStore } from '@features/preferences/frontend/state/def.js';
import { removeColumn, updateColumn } from '@features/preferences/frontend/deck.js';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import * as os from '@features/ui/frontend/os.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { hasWithReplies, isAvailableBasicTimeline, basicTimelineIconClass } from '@features/timelines/frontend/timelines.js';
import { soundSettingsButton } from '@features/notes/frontend/ui/deck/tl-note-notification.js';

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
		title: $locale.value.sfc.timeline,
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
		text: $locale.value.sfc.timeline,
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
			text: $locale.value.sfc.showRepliesToOthersInTimeline,
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
	"timelinesLabels": {
		"home": "الرئيسي",
		"local": "المحلي",
		"social": "الاجتماعي",
		"global": "الشامل"
	},
	"deckColumnsTl": "الخط الزمني",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "الخيط الزمني",
	"timelinesHome": "الرئيسي",
	"timelinesLocal": "المحلي",
	"timelinesSocial": "الاجتماعي",
	"timelinesGlobal": "الشامل",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"timelinesLabels": {
		"home": "Inici",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Línia de temps",
	"disabledTimelineTitle": "Línia de tems desactivada",
	"disabledTimelineDescription": "No pots fer servir aquesta línia de temps amb els teus rols actuals.",
	"timeline": "Línia de temps",
	"timelinesHome": "Inici",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Configuració de notificacions per a notes noves",
	"showRenotes": "Mostrar impulsos",
	"showRepliesToOthersInTimeline": "Mostrar les respostes a altres a la línia de temps",
	"fileAttachedOnly": "Només notes amb adjunts",
	"withSensitive": "Incloure notes amb fitxers sensibles"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"timelinesLabels": {
		"home": "Domů",
		"local": "Místní",
		"social": "Sociální síť",
		"global": "Globální"
	},
	"deckColumnsTl": "Časová osa",
	"disabledTimelineTitle": "Časová osa vypnuta",
	"disabledTimelineDescription": "Tuto časovou osu nemůžete používat v rámci svých současných rolí.",
	"timeline": "Časová osa",
	"timelinesHome": "Domů",
	"timelinesLocal": "Místní",
	"timelinesSocial": "Sociální síť",
	"timelinesGlobal": "Globální",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Timeline",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"timelinesLabels": {
		"home": "Startseite",
		"local": "Lokal",
		"social": "Sozial",
		"global": "Global"
	},
	"deckColumnsTl": "Chronik",
	"disabledTimelineTitle": "Chronik deaktiviert",
	"disabledTimelineDescription": "Mit deinen jetzigen Rollen ist diese Chronik nicht verfügbar.",
	"timeline": "Chronik",
	"timelinesHome": "Startseite",
	"timelinesLocal": "Lokal",
	"timelinesSocial": "Sozial",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Benachrichtigungseinstellungen für neue Notizen",
	"showRenotes": "Renotes anzeigen",
	"showRepliesToOthersInTimeline": "Antworten in Chronik anzeigen",
	"fileAttachedOnly": "Nur Notizen mit Dateien",
	"withSensitive": "Zeige \"sensitive Inhalte\" an"
}
</locale>

<locale lang="json" locale="en-US">
{
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Timeline",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"timelinesLabels": {
		"home": "Inicio",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Linea de tiempo",
	"disabledTimelineTitle": "Línea de tiempo deshabilitada",
	"disabledTimelineDescription": "No puedes usar esta línea de tiempo con tus roles actuales.",
	"timeline": "Línea de tiempo",
	"timelinesHome": "Inicio",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Configuración de las notificaciones para notas nuevas",
	"showRenotes": "Mostrar renotas",
	"showRepliesToOthersInTimeline": "Mostrar respuestas a otros en la línea de tiempo",
	"fileAttachedOnly": "Solo notas con archivos",
	"withSensitive": "Mostrar notas que contengan material sensible"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"timelinesLabels": {
		"home": "Principal",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Fil",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Fil",
	"timelinesHome": "Principal",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Afficher les renotes",
	"showRepliesToOthersInTimeline": "Afficher les réponses aux autres dans le fil",
	"fileAttachedOnly": "Avec fichiers joints seulement",
	"withSensitive": "Afficher les notes contenant des fichiers joints sensibles"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"timelinesLabels": {
		"home": "Beranda",
		"local": "Lokal",
		"social": "Sosial",
		"global": "Global"
	},
	"deckColumnsTl": "Beranda",
	"disabledTimelineTitle": "Lini masa dinonaktifkan",
	"disabledTimelineDescription": "Saat ini kamu tidak dapat menggunakan lini masa ini karena peran kamu saat ini.",
	"timeline": "Lini masa",
	"timelinesHome": "Beranda",
	"timelinesLocal": "Lokal",
	"timelinesSocial": "Sosial",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Pengaturan notifikasi untuk note baru",
	"showRenotes": "Tampilkan renote",
	"showRepliesToOthersInTimeline": "Tampilkan balasan ke pengguna lain dalam lini masa",
	"fileAttachedOnly": "Hanya catatan dengan berkas",
	"withSensitive": "Lampirkan catatan dengan berkas sensitif"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"timelinesLabels": {
		"home": "Home",
		"local": "Locale",
		"social": "Sociale",
		"global": "Federata"
	},
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabilitata",
	"disabledTimelineDescription": "Il ruolo in cui sei non ti permette di leggere questa timeline",
	"timeline": "Timeline",
	"timelinesHome": "Home",
	"timelinesLocal": "Locale",
	"timelinesSocial": "Sociale",
	"timelinesGlobal": "Federata",
	"deckNewNoteNotificationSettings": "Preferenze per le notifiche di nuove Note",
	"showRenotes": "Includi le Rinota",
	"showRepliesToOthersInTimeline": "Risposte altrui nella TL",
	"fileAttachedOnly": "Solo con allegati",
	"withSensitive": "Mostra le Note con allegati espliciti"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	},
	"deckColumnsTl": "タイムライン",
	"disabledTimelineTitle": "無効化されたタイムライン",
	"disabledTimelineDescription": "現在のロールでは、このタイムラインを使用することはできません。",
	"timeline": "タイムライン",
	"timelinesHome": "ホーム",
	"timelinesLocal": "ローカル",
	"timelinesSocial": "ソーシャル",
	"timelinesGlobal": "グローバル",
	"deckNewNoteNotificationSettings": "新着ノート通知の設定",
	"showRenotes": "リノートを表示",
	"showRepliesToOthersInTimeline": "TLに他の人への返信を含める",
	"fileAttachedOnly": "ファイル付きのみ",
	"withSensitive": "センシティブなファイルを含むノートを表示"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	},
	"deckColumnsTl": "タイムライン",
	"disabledTimelineTitle": "使われへんタイムライン",
	"disabledTimelineDescription": "あんたの今のロールやったら、このタイムラインは使われへんで。",
	"timeline": "タイムライン",
	"timelinesHome": "ホーム",
	"timelinesLocal": "ローカル",
	"timelinesSocial": "ソーシャル",
	"timelinesGlobal": "グローバル",
	"deckNewNoteNotificationSettings": "新着ノート通知の設定",
	"showRenotes": "リノート出す",
	"showRepliesToOthersInTimeline": "タイムラインに他の人への返信とかも入れるで",
	"fileAttachedOnly": "ファイルのっけてあるやつだけ",
	"withSensitive": "センシティブなファイルを含むノートを表示"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Timeline",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "ಸಮಯಸಾಲು",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "ಸಮಯಸಾಲು",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"timelinesLabels": {
		"home": "홈",
		"local": "로컬",
		"social": "소셜",
		"global": "글로벌"
	},
	"deckColumnsTl": "타임라인",
	"disabledTimelineTitle": "비활성화된 타임라인",
	"disabledTimelineDescription": "현재 역할에서는 이 타임라인을 이용할 수 없습니다.",
	"timeline": "타임라인",
	"timelinesHome": "홈",
	"timelinesLocal": "로컬",
	"timelinesSocial": "소셜",
	"timelinesGlobal": "글로벌",
	"deckNewNoteNotificationSettings": "새 노트 알림 설정",
	"showRenotes": "리노트 보기",
	"showRepliesToOthersInTimeline": "타임라인에 다른 사람에게 보내는 답글을 포함",
	"fileAttachedOnly": "미디어를 포함한 노트만",
	"withSensitive": "민감한 파일이 포함된 노트 보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"timelinesLabels": {
		"home": "Startpagina",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Tijdlijn",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Tijdlijn",
	"timelinesHome": "Startpagina",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"timelinesLabels": {
		"home": "Hjem",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Tidslinje",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Tidslinje",
	"timelinesHome": "Hjem",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"timelinesLabels": {
		"home": "Strona główna",
		"local": "Lokalne",
		"social": "Społeczność",
		"global": "Globalna"
	},
	"deckColumnsTl": "Oś czasu",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Oś czasu",
	"timelinesHome": "Strona główna",
	"timelinesLocal": "Lokalne",
	"timelinesSocial": "Społeczność",
	"timelinesGlobal": "Globalna",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"timelinesLabels": {
		"home": "Início",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Linha do tempo desabilitada",
	"disabledTimelineDescription": "Você não pode acessar essa linha do tempo sob o seu cargo atual.",
	"timeline": "Linha do tempo",
	"timelinesHome": "Início",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Opções de notificação para novas notas",
	"showRenotes": "Exibir reposts",
	"showRepliesToOthersInTimeline": "Mostrar respostas aos outros na linha do tempo",
	"fileAttachedOnly": "Apenas notas com arquivos",
	"withSensitive": "Incluir notas com arquivos sensíveis"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"timelinesLabels": {
		"home": "Персональная",
		"local": "Местная",
		"social": "Социальная",
		"global": "Всеобщая"
	},
	"deckColumnsTl": "Лента",
	"disabledTimelineTitle": "Лента отключена",
	"disabledTimelineDescription": "Ваша текущая роль не позволяет пользоваться этой лентой.",
	"timeline": "Лента",
	"timelinesHome": "Персональная",
	"timelinesLocal": "Местная",
	"timelinesSocial": "Социальная",
	"timelinesGlobal": "Всеобщая",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Показывать репосты",
	"showRepliesToOthersInTimeline": "Показывать ответы в ленте",
	"fileAttachedOnly": "Только заметки с файлами",
	"withSensitive": "Показывать заметки с NSFW контентом"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"timelinesLabels": {
		"home": "Domov",
		"local": "Lokálne",
		"social": "Sociálne",
		"global": "Globálne"
	},
	"deckColumnsTl": "Časová os",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Časová os",
	"timelinesHome": "Domov",
	"timelinesLocal": "Lokálne",
	"timelinesSocial": "Sociálne",
	"timelinesGlobal": "Globálne",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"timelinesLabels": {
		"home": "หน้าหลัก",
		"local": "ท้องถิ่น",
		"social": "โซเชียล",
		"global": "ทั่วโลก"
	},
	"deckColumnsTl": "ไทม์ไลน์",
	"disabledTimelineTitle": "ปิดใช้งานไทม์ไลน์",
	"disabledTimelineDescription": "คุณไม่สามารถใช้ไทม์ไลน์นี้ภายใต้บทบาทปัจจุบันของคุณได้",
	"timeline": "ไทม์ไลน์",
	"timelinesHome": "หน้าหลัก",
	"timelinesLocal": "ท้องถิ่น",
	"timelinesSocial": "โซเชียล",
	"timelinesGlobal": "ทั่วโลก",
	"deckNewNoteNotificationSettings": "ตั้งค่าการแจ้งเตือนเมื่อมีโน้ตใหม่",
	"showRenotes": "แสดงรีโน้ต",
	"showRepliesToOthersInTimeline": "แสดงการตอบกลับผู้อื่นลงในไทม์ไลน์",
	"fileAttachedOnly": "เฉพาะโน้ตที่มีไฟล์เท่านั้น",
	"withSensitive": "แสดงโน้ตที่มีไฟล์เนื้อหาละเอียดอ่อน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"timelinesLabels": {
		"home": "Pano",
		"local": "Yerel",
		"social": "Sosyal",
		"global": "Global"
	},
	"deckColumnsTl": "Pano",
	"disabledTimelineTitle": "Pano devre dışı bırakıldı",
	"disabledTimelineDescription": "Mevcut rollerinle bu Pano kullanılamaz.",
	"timeline": "Pano",
	"timelinesHome": "Pano",
	"timelinesLocal": "Yerel",
	"timelinesSocial": "Sosyal",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Renote'ları göster",
	"showRepliesToOthersInTimeline": "Pano'da diğer kişilere verilen yanıtları göster",
	"fileAttachedOnly": "Yalnızca dosya içeren notlar",
	"withSensitive": "Hassas dosyalara notlar ekle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"deckColumnsTl": "Timeline",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Timeline",
	"timelinesHome": "Home",
	"timelinesLocal": "Local",
	"timelinesSocial": "Social",
	"timelinesGlobal": "Global",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"timelinesLabels": {
		"home": "Домівка",
		"local": "Локальна",
		"social": "Соціальна",
		"global": "Глобальна"
	},
	"deckColumnsTl": "Стрічка",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Стрічка",
	"timelinesHome": "Домівка",
	"timelinesLocal": "Локальна",
	"timelinesSocial": "Соціальна",
	"timelinesGlobal": "Глобальна",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Показати поширення",
	"showRepliesToOthersInTimeline": "Показувати відповіді іншим у стрічці",
	"fileAttachedOnly": "Лише нотатки з файлами",
	"withSensitive": "Допис від {name} містить чутливий вміст"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"timelinesLabels": {
		"home": "Trang chính",
		"local": "Máy chủ này",
		"social": "Xã hội",
		"global": "Liên hợp"
	},
	"deckColumnsTl": "Bảng tin",
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timeline": "Bảng tin",
	"timelinesHome": "Trang chính",
	"timelinesLocal": "Máy chủ này",
	"timelinesSocial": "Xã hội",
	"timelinesGlobal": "Liên hợp",
	"deckNewNoteNotificationSettings": "Notification setting for new notes",
	"showRenotes": "Show renotes",
	"showRepliesToOthersInTimeline": "Show replies to others in timeline",
	"fileAttachedOnly": "Only notes with files",
	"withSensitive": "Include notes with sensitive files"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"timelinesLabels": {
		"home": "首页",
		"local": "本地",
		"social": "社交",
		"global": "全局"
	},
	"deckColumnsTl": "时间线",
	"disabledTimelineTitle": "时间线已禁用",
	"disabledTimelineDescription": "您不能在当前角色使用时间线。",
	"timeline": "时间线",
	"timelinesHome": "首页",
	"timelinesLocal": "本地",
	"timelinesSocial": "社交",
	"timelinesGlobal": "全局",
	"deckNewNoteNotificationSettings": "新帖子通知设定",
	"showRenotes": "显示转帖",
	"showRepliesToOthersInTimeline": "在时间线中显示对他人的回复",
	"fileAttachedOnly": "仅限媒体",
	"withSensitive": "显示包含敏感媒体的帖子"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"timelinesLabels": {
		"home": "首頁",
		"local": "本地",
		"social": "社交",
		"global": "公開"
	},
	"deckColumnsTl": "時間軸",
	"disabledTimelineTitle": "時間軸已停用",
	"disabledTimelineDescription": "目前角色無法使用這個時間軸。",
	"timeline": "時間軸",
	"timelinesHome": "首頁",
	"timelinesLocal": "本地",
	"timelinesSocial": "社交",
	"timelinesGlobal": "公開",
	"deckNewNoteNotificationSettings": "新貼文通知的設定",
	"showRenotes": "顯示其他人的轉發貼文",
	"showRepliesToOthersInTimeline": "在時間軸上顯示給其他人的回覆",
	"fileAttachedOnly": "只顯示包含附件的貼文",
	"withSensitive": "顯示包含敏感檔案的貼文"
}
</locale>
