<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="true"
	:okButtonDisabled="!canSave"
	@close="cancel()"
	@ok="save()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-icons"></i> {{ copyLocaleDictionary($locale.sfc.widgetsLabels)[widgetName] ?? widgetName }}</template>

	<MkPreviewWithControls>
		<template #preview>
			<div :class="$style.previewWrapper">
				<div class="_acrylic" :class="$style.previewTitle">{{ $locale.sfc.preview }}</div>

				<div ref="resizerRootEl" :class="$style.previewResizerRoot" inert>
					<div
						ref="resizerEl"
						:class="$style.previewResizer"
						:style="{ transform: widgetStyle }"
					>
						<component
							:is="`widget-${widgetName}`"
							:widget="{ name: widgetName, id: '__PREVIEW__', data: settings }"
						></component>
					</div>
				</div>
			</div>
		</template>

		<template #controls>
			<div class="_spacer">
				<MkForm v-model="settings" :form="form" @canSaveStateChange="onCanSaveStateChanged"/>
			</div>
		</template>
	</MkPreviewWithControls>
</MkModalWindow>
</template>

<script setup lang="ts">
import { useTemplateRef, ref, computed, onBeforeUnmount, onMounted } from 'vue';
import MkPreviewWithControls from '@features/markup/frontend/components/MkPreviewWithControls.vue';
import type { Form } from '@features/ui/frontend/utility/form.js';
import type { WidgetName } from '@features/index/frontend/widgets.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkForm from '@features/ui/frontend/components/MkForm.vue';

const props = defineProps<{
	widgetName: WidgetName;
	form: Form;
	currentSettings: Record<string, any>;
}>();

const emit = defineEmits<{
	(ev: 'saved', settings: Record<string, any>): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const settings = ref<Record<string, any>>(deepClone(props.currentSettings));

const canSave = ref(true);

function onCanSaveStateChanged(newCanSave: boolean) {
	canSave.value = newCanSave;
}

function save() {
	if (!canSave.value) return;
	emit('saved', deepClone(settings.value));
	dialog.value?.close();
}

function cancel() {
	emit('canceled');
	dialog.value?.close();
}

//#region プレビューのリサイズ
const resizerRootEl = useTemplateRef('resizerRootEl');
const resizerEl = useTemplateRef('resizerEl');
const widgetHeight = ref(0);
const widgetScale = ref(1);
const widgetStyle = computed(() => {
	return `translate(-50%, -50%) scale(${widgetScale.value})`;
});
const ro1 = new ResizeObserver(() => {
	widgetHeight.value = resizerEl.value!.clientHeight;
	calcScale();
});
const ro2 = new ResizeObserver(() => {
	calcScale();
});

function calcScale() {
	if (!resizerRootEl.value) return;
	const previewWidth = resizerRootEl.value.clientWidth - 40; // 左右の余白 20pxずつ
	const previewHeight = resizerRootEl.value.clientHeight - 40; // 上下の余白 20pxずつ
	const widgetWidth = 280;
	const scale = Math.min(previewWidth / widgetWidth, previewHeight / widgetHeight.value, 1); // 拡大はしないので1を上限に
	widgetScale.value = scale;
}

onMounted(() => {
	if (resizerEl.value) {
		ro1.observe(resizerEl.value);
	}
	if (resizerRootEl.value) {
		ro2.observe(resizerRootEl.value);
	}
	calcScale();
});

onBeforeUnmount(() => {
	ro1.disconnect();
	ro2.disconnect();
});
//#endregion
</script>

<style module>
.previewContainer {
	display: flex;
	flex-direction: column;
	height: 100%;
	user-select: none;
	-webkit-user-drag: none;
}

.previewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.previewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.previewResizerRoot {
	position: relative;
	flex: 1 0;
}

.previewResizer {
	position: absolute;
	container-type: inline-size;
	top: 50%;
	left: 50%;
	width: 280px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"widgetsLabels": {
		"profile": "الملف التعريفي",
		"instanceInfo": "معلومات مثيل الخادم",
		"memo": "ملاحظة لاصقة",
		"notifications": "الإشعارات",
		"timeline": "الخيط الزمني",
		"calendar": "التقويم",
		"trends": "المتداوَلة",
		"clock": "الساعة",
		"rss": "تدفق RSS",
		"rssTicker": "RSS-Ticker",
		"activity": "النشاط",
		"photos": "الصور",
		"digitalClock": "ساعة رقمية",
		"unixClock": "UNIX clock",
		"federation": "الفديرالية",
		"instanceCloud": "Instance cloud",
		"postForm": "أنشئ ملاحظة",
		"slideshow": "عرض الشرائح",
		"button": "زر",
		"onlineUsers": "المتّصلون",
		"jobQueue": "قائمة الانتظار",
		"serverMetric": "إحصائيات الخادم",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "قائمة المستخدمين",
		"_userList": {
			"chooseList": "اختر قائمة"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "معاينة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"widgetsLabels": {
		"profile": "Perfil",
		"instanceInfo": "Informació del fitxer d'instal·lació",
		"memo": "Notes adhesives",
		"notifications": "Notificacions",
		"timeline": "Línia de temps",
		"calendar": "Calendari",
		"trends": "Tendència",
		"clock": "Rellotge",
		"rss": "Lector RSS",
		"rssTicker": "RSS ticker",
		"activity": "Activitat",
		"photos": "Fotografies",
		"digitalClock": "Rellotge digital",
		"unixClock": "Rellotge UNIX",
		"federation": "Federació",
		"instanceCloud": "Núvol d'instàncies",
		"postForm": "Formulari de publicació",
		"slideshow": "Presentació",
		"button": "Botó ",
		"onlineUsers": "Usuaris actius",
		"jobQueue": "Cua de feines",
		"serverMetric": "Mètriques del servidor",
		"aiscript": "Consola AiScript",
		"aiscriptApp": "Aplicació AiScript",
		"aichan": "Ai",
		"userList": "Llistat d'usuaris",
		"_userList": {
			"chooseList": "Tria una llista"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Usuaris que fan l'aniversari avui",
		"chat": "Xateja amb aquest usuari"
	},
	"preview": "Vista prèvia"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"widgetsLabels": {
		"profile": "Váš profil",
		"instanceInfo": "Informace o instanci",
		"memo": "Přilepené poznámky",
		"notifications": "Oznámení",
		"timeline": "Časová osa",
		"calendar": "Kalendář",
		"trends": "Trendy",
		"clock": "Hodiny",
		"rss": "RSS čtečka",
		"rssTicker": "RSS Ticker",
		"activity": "Aktivita",
		"photos": "Fotky",
		"digitalClock": "Digitální hodiny",
		"unixClock": "Hodiny UNIX",
		"federation": "Federace",
		"instanceCloud": "Cloud instance",
		"postForm": "Formulář pro odeslání",
		"slideshow": "Prezentace",
		"button": "Tlačítko",
		"onlineUsers": "Online uživatelé",
		"jobQueue": "Fronta úloh",
		"serverMetric": "Metriky serveru",
		"aiscript": "AiScript conzole",
		"aiscriptApp": "Aplikace AiScript",
		"aichan": "Ai",
		"userList": "Seznam uživatelů",
		"_userList": {
			"chooseList": "Vybrat seznam"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Náhled"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"widgetsLabels": {
		"profile": "Profile",
		"instanceInfo": "Instance Information",
		"memo": "Sticky notes",
		"notifications": "Notifications",
		"timeline": "Timeline",
		"calendar": "Calendar",
		"trends": "Trending",
		"clock": "Clock",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Activity",
		"photos": "Photos",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Federation",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Button",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Select a list"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Preview"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Instanzinformationen",
		"memo": "Merkzettel",
		"notifications": "Benachrichtigungen",
		"timeline": "Chronik",
		"calendar": "Kalender",
		"trends": "Trends",
		"clock": "Uhr",
		"rss": "RSS-Reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Aktivität",
		"photos": "Fotos",
		"digitalClock": "Digitaluhr",
		"unixClock": "UNIX-Uhr",
		"federation": "Föderation",
		"instanceCloud": "Instanzwolke",
		"postForm": "Notizfenster",
		"slideshow": "Diashow",
		"button": "Knopf",
		"onlineUsers": "Benutzer Online",
		"jobQueue": "Job-Warteschlange",
		"serverMetric": "Servermetriken",
		"aiscript": "AiScript-Konsole",
		"aiscriptApp": "AiScript-Anwendung",
		"aichan": "Ai",
		"userList": "Benutzerliste",
		"_userList": {
			"chooseList": "Liste auswählen"
		},
		"clicker": "Klickzähler",
		"birthdayFollowings": "Nutzer, die heute Geburtstag haben",
		"chat": "Mit dem Benutzer chatten"
	},
	"preview": "Vorschau"
}
</locale>

<locale lang="json" locale="en-US">
{
	"widgetsLabels": {
		"profile": "Profile",
		"instanceInfo": "Instance Information",
		"memo": "Sticky notes",
		"notifications": "Notifications",
		"timeline": "Timeline",
		"calendar": "Calendar",
		"trends": "Trending",
		"clock": "Clock",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Activity",
		"photos": "Photos",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Federation",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Button",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Select a list"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Preview"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"widgetsLabels": {
		"profile": "Perfil",
		"instanceInfo": "información de la instancia",
		"memo": "Nota adhesiva",
		"notifications": "Notificaciones",
		"timeline": "Linea de tiempo",
		"calendar": "Calendario",
		"trends": "Tendencias",
		"clock": "Reloj",
		"rss": "Lector RSS",
		"rssTicker": "Ticker-RSS",
		"activity": "Actividad",
		"photos": "Fotos",
		"digitalClock": "Reloj digital",
		"unixClock": "Reloj UNIX",
		"federation": "Federación",
		"instanceCloud": "Nube de Instancias Federadas",
		"postForm": "Formulario",
		"slideshow": "Diapositivas",
		"button": "Botón",
		"onlineUsers": "Usuarios en linea",
		"jobQueue": "Cola de trabajos",
		"serverMetric": "Estadísticas del servidor",
		"aiscript": "Consola de AiScript",
		"aiscriptApp": "Aplicación AiScript",
		"aichan": "indigo",
		"userList": "Lista de usuarios",
		"_userList": {
			"chooseList": "Seleccione una lista"
		},
		"clicker": "Cliqueador",
		"birthdayFollowings": "Hoy cumplen años",
		"chat": "Chatear"
	},
	"preview": "Vista previa"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Informations sur l’instance",
		"memo": "Note collante",
		"notifications": "Notifications",
		"timeline": "Fil",
		"calendar": "Calendrier",
		"trends": "Tendances",
		"clock": "Horloge",
		"rss": "Lecteur de flux RSS",
		"rssTicker": "Filtre RSS",
		"activity": "Activité",
		"photos": "Photos",
		"digitalClock": "Horloge numérique",
		"unixClock": "Horloge UNIX",
		"federation": "Fédération",
		"instanceCloud": "Instance cloud",
		"postForm": "Formulaire de publication",
		"slideshow": "Diaporama",
		"button": "Bouton",
		"onlineUsers": "Utilisateurs en ligne",
		"jobQueue": "File d’attente",
		"serverMetric": "Statistiques du serveur",
		"aiscript": "Console AiScript",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "Liste utilisateur",
		"_userList": {
			"chooseList": "Sélectionner une liste"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Utilisateurs qui fêtent l'anniversaire aujourd'hui",
		"chat": "Chat with user"
	},
	"preview": "Aperçu"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Informasi Instansi",
		"memo": "Catatan memo",
		"notifications": "Notifikasi",
		"timeline": "Lini masa",
		"calendar": "Kalender",
		"trends": "Tren",
		"clock": "Jam",
		"rss": "Pembaca RSS",
		"rssTicker": "RSS-Ticker",
		"activity": "Aktivitas",
		"photos": "Foto",
		"digitalClock": "Jam digital",
		"unixClock": "Jam UNIX",
		"federation": "Federasi",
		"instanceCloud": "Instansi awan",
		"postForm": "Buat catatan",
		"slideshow": "Slideshow",
		"button": "Tombol",
		"onlineUsers": "Pengguna online",
		"jobQueue": "Antrian kerja",
		"serverMetric": "Statistik peladen",
		"aiscript": "Konsol AiScript",
		"aiscriptApp": "Aplikasi AiScript",
		"aichan": "Ai",
		"userList": "Daftar pengguna",
		"_userList": {
			"chooseList": "Pilih daftar"
		},
		"clicker": "Pengeklik",
		"birthdayFollowings": "Pengguna yang merayakan hari ulang tahunnya hari ini",
		"chat": "Obrolan pengguna"
	},
	"preview": "Pratinjau"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"widgetsLabels": {
		"profile": "Profilo",
		"instanceInfo": "Informazioni sull'istanza",
		"memo": "Promemoria",
		"notifications": "Notifiche",
		"timeline": "Timeline",
		"calendar": "Calendario",
		"trends": "Hashtag popolari",
		"clock": "Orologio",
		"rss": "Lettura RSS",
		"rssTicker": "Nastro RSS",
		"activity": "Attività",
		"photos": "Foto",
		"digitalClock": "Orologio digitale",
		"unixClock": "Orologio UNIX",
		"federation": "Federazione",
		"instanceCloud": "Nuvola di federazione",
		"postForm": "Finestra di pubblicazione",
		"slideshow": "Diapositive",
		"button": "Bottone",
		"onlineUsers": "Persone attive adesso",
		"jobQueue": "Coda di lavoro",
		"serverMetric": "Statistiche server",
		"aiscript": "Console AiScript",
		"aiscriptApp": "App AiScript",
		"aichan": "Mascotte Ai",
		"userList": "Lista profili",
		"_userList": {
			"chooseList": "Seleziona una lista"
		},
		"clicker": "Cliccheria",
		"birthdayFollowings": "Compleanni del giorno",
		"chat": "Messaggi diretti"
	},
	"preview": "Anteprima"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"widgetsLabels": {
		"profile": "プロフィール",
		"instanceInfo": "サーバー情報",
		"memo": "付箋",
		"notifications": "通知",
		"timeline": "タイムライン",
		"calendar": "カレンダー",
		"trends": "トレンド",
		"clock": "時計",
		"rss": "RSSリーダー",
		"rssTicker": "RSSティッカー",
		"activity": "アクティビティ",
		"photos": "フォト",
		"digitalClock": "デジタル時計",
		"unixClock": "UNIX時計",
		"federation": "連合",
		"instanceCloud": "サーバークラウド",
		"postForm": "投稿フォーム",
		"slideshow": "スライドショー",
		"button": "ボタン",
		"onlineUsers": "オンラインユーザー",
		"jobQueue": "ジョブキュー",
		"serverMetric": "サーバーメトリクス",
		"aiscript": "AiScriptコンソール",
		"aiscriptApp": "AiScript App",
		"aichan": "藍",
		"userList": "ユーザーリスト",
		"_userList": {
			"chooseList": "リストを選択"
		},
		"clicker": "クリッカー",
		"birthdayFollowings": "もうすぐ誕生日のユーザー",
		"chat": "ダイレクトメッセージ"
	},
	"preview": "プレビュー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"widgetsLabels": {
		"profile": "プロフィール",
		"instanceInfo": "サーバー情報",
		"memo": "付箋",
		"notifications": "通知",
		"timeline": "タイムライン",
		"calendar": "カレンダー",
		"trends": "トレンド",
		"clock": "時計",
		"rss": "RSSリーダー",
		"rssTicker": "RSSティッカー",
		"activity": "アクティビティ",
		"photos": "フォト",
		"digitalClock": "デジタル時計",
		"unixClock": "UNIX時計",
		"federation": "連合",
		"instanceCloud": "サーバークラウド",
		"postForm": "投稿フォーム",
		"slideshow": "スライドショー",
		"button": "ボタン",
		"onlineUsers": "オンラインユーザー",
		"jobQueue": "ジョブキュー",
		"serverMetric": "サーバーメトリクス",
		"aiscript": "AiScriptコンソール",
		"aiscriptApp": "AiScript App",
		"aichan": "藍",
		"userList": "ユーザーリスト",
		"_userList": {
			"chooseList": "リストを選ぶ"
		},
		"clicker": "クリッカー",
		"birthdayFollowings": "今日誕生日のツレ",
		"chat": "チャットしよか"
	},
	"preview": "プレビュー"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"widgetsLabels": {
		"profile": "Amaɣnu",
		"instanceInfo": "Instance Information",
		"memo": "Sticky notes",
		"notifications": "Ilɣuyen",
		"timeline": "Timeline",
		"calendar": "Calendar",
		"trends": "Trending",
		"clock": "Clock",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Activity",
		"photos": "Photos",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Federation",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Button",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Fren tabdart"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Preview"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"widgetsLabels": {
		"profile": "ಪ್ರೊಫೈಲು",
		"instanceInfo": "Instance Information",
		"memo": "Sticky notes",
		"notifications": "ಅಧಿಸೂಚನೆಗಳು",
		"timeline": "ಸಮಯಸಾಲು",
		"calendar": "Calendar",
		"trends": "Trending",
		"clock": "Clock",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Activity",
		"photos": "Photos",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Federation",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Button",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Select a list"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Preview"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"widgetsLabels": {
		"profile": "프로필",
		"instanceInfo": "서버 정보",
		"memo": "스티커 메모",
		"notifications": "알림",
		"timeline": "타임라인",
		"calendar": "달력",
		"trends": "트렌드",
		"clock": "시계",
		"rss": "RSS 리더",
		"rssTicker": "RSS Ticker",
		"activity": "활동",
		"photos": "사진",
		"digitalClock": "디지털 시계",
		"unixClock": "UNIX 시계",
		"federation": "연합",
		"instanceCloud": "서버 구름",
		"postForm": "글 입력란",
		"slideshow": "슬라이드 쇼",
		"button": "버튼",
		"onlineUsers": "온라인 유저",
		"jobQueue": "작업 대기열",
		"serverMetric": "서버 통계",
		"aiscript": "AiScript 콘솔",
		"aiscriptApp": "AiScript 앱",
		"aichan": "아이",
		"userList": "유저 리스트",
		"_userList": {
			"chooseList": "리스트 선택"
		},
		"clicker": "클리커",
		"birthdayFollowings": "곧 생일인 사용자",
		"chat": "채팅하기"
	},
	"preview": "미리보기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"widgetsLabels": {
		"profile": "Profiel",
		"instanceInfo": "Serverinformatie",
		"memo": "Sticky notes",
		"notifications": "Meldingen",
		"timeline": "Tijdlijn",
		"calendar": "Calendar",
		"trends": "Trending",
		"clock": "Clock",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Activiteit",
		"photos": "Photos",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Federatie",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Button",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Kies een lijst."
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Voorbeeld"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Serverinformasjon",
		"memo": "Sticky notes",
		"notifications": "Varsler",
		"timeline": "Tidslinje",
		"calendar": "Kalender",
		"trends": "Populært",
		"clock": "Klokke",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Aktivitet",
		"photos": "Bilder",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Føderasjon",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Knapp",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "Brukerliste",
		"_userList": {
			"chooseList": "Velg liste"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Preview"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Informacje o instancji",
		"memo": "Przypięte notatki",
		"notifications": "Powiadomienia",
		"timeline": "Oś czasu",
		"calendar": "Kalendarz",
		"trends": "Na czasie",
		"clock": "Zegar",
		"rss": "Czytnik RSS",
		"rssTicker": "RSS-Ticker",
		"activity": "Aktywność",
		"photos": "Zdjęcia",
		"digitalClock": "Zegar cyfrowy",
		"unixClock": "Zegar UNIX",
		"federation": "Federacja",
		"instanceCloud": "Chmura instancji",
		"postForm": "Formularz tworzenia wpisu",
		"slideshow": "Pokaz slajdów",
		"button": "Przycisk",
		"onlineUsers": "Użytkownicy online",
		"jobQueue": "Kolejka zadań",
		"serverMetric": "Metryka serwera",
		"aiscript": "Konsola AiScript",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "Lista użytkowników",
		"_userList": {
			"chooseList": "Wybierz listę"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Podgląd"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"widgetsLabels": {
		"profile": "Perfil",
		"instanceInfo": "Informações da instância",
		"memo": "Notas adesivas",
		"notifications": "Notificações",
		"timeline": "Linha do tempo",
		"calendar": "Calendário",
		"trends": "Destaques",
		"clock": "Relógio",
		"rss": "Leitor de RSS",
		"rssTicker": "Ticker RSS",
		"activity": "Atividades",
		"photos": "Fotos",
		"digitalClock": "Relógio digital",
		"unixClock": "Hora UNIX",
		"federation": "Federação",
		"instanceCloud": "Nuvem de instâncias",
		"postForm": "Campo de postagem",
		"slideshow": "Apresentação de slides",
		"button": "Botão",
		"onlineUsers": "Usuários Online",
		"jobQueue": "Fila de tarefas",
		"serverMetric": "Métricas do servidor",
		"aiscript": "Console AiScript",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "Lista de usuários",
		"_userList": {
			"chooseList": "Selecione uma lista"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Usuários de aniversário hoje",
		"chat": "Conversar com usuário"
	},
	"preview": "Pré-visualizar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"widgetsLabels": {
		"profile": "Профиль",
		"instanceInfo": "Информация об инстансе",
		"memo": "Памятки",
		"notifications": "Уведомления",
		"timeline": "Лента",
		"calendar": "Календарь",
		"trends": "Актуальное",
		"clock": "Часы",
		"rss": "Просмотр RSS",
		"rssTicker": "Бегущая строка RSS",
		"activity": "Активность",
		"photos": "Фото",
		"digitalClock": "Цифровые часы",
		"unixClock": "Часы UNIX",
		"federation": "Федерация",
		"instanceCloud": "Облако инстансов",
		"postForm": "Форма отправки",
		"slideshow": "Показ слайдов",
		"button": "Кнопка",
		"onlineUsers": "Пользователи сейчас с сети",
		"jobQueue": "Очередь заданий",
		"serverMetric": "Показатели сервера",
		"aiscript": "Консоль AiScript",
		"aiscriptApp": "Приложение на AiScript",
		"aichan": "Ай",
		"userList": "Список аккаунтов",
		"_userList": {
			"chooseList": "Выберите список"
		},
		"clicker": "Счётчик щелчков",
		"birthdayFollowings": "Пользователи, у которых сегодня день рождения",
		"chat": "Открыть личные сообщения"
	},
	"preview": "Предпросмотр"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Informácie o serveri",
		"memo": "Prilepené poznámky",
		"notifications": "Oznámenia",
		"timeline": "Časová os",
		"calendar": "Kalendár",
		"trends": "Trendy",
		"clock": "Hodiny",
		"rss": "RSS čítačka",
		"rssTicker": "RSS Ticker",
		"activity": "Aktivita",
		"photos": "Fotky",
		"digitalClock": "Digitálne hodiny",
		"unixClock": "UNIX čas",
		"federation": "Federácia",
		"instanceCloud": "Cloud serverov",
		"postForm": "Napísať poznámku",
		"slideshow": "Prezentácia",
		"button": "Tlačidlo",
		"onlineUsers": "Online používatelia",
		"jobQueue": "Fronta úloh",
		"serverMetric": "Metriky servera",
		"aiscript": "Konzola AiScript",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Vyberte zoznam"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Náhľad"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"widgetsLabels": {
		"profile": "โปรไฟล์",
		"instanceInfo": "ข้อมูลเซิร์ฟเวอร์",
		"memo": "โน้ตแปะ",
		"notifications": "การเเจ้งเตือน",
		"timeline": "ไทม์ไลน์",
		"calendar": "ปฏิทิน",
		"trends": "กำลังมาแรง",
		"clock": "นาฬิกา",
		"rss": "โปรแกรมอ่าน RSS",
		"rssTicker": "RSS-ทิกเกอร์",
		"activity": "กิจกรรม",
		"photos": "รูปภาพ",
		"digitalClock": "นาฬิกาดิจิตอล",
		"unixClock": "นาฬิกา UNIX",
		"federation": "สหพันธ์",
		"instanceCloud": "กลุ่มเมฆเซิร์ฟเวอร์",
		"postForm": "แบบฟอร์มการโพสต์",
		"slideshow": "แสดงภาพนิ่ง",
		"button": "ปุ่ม",
		"onlineUsers": "ผู้ใช้ที่ออนไลน์",
		"jobQueue": "คิวงาน",
		"serverMetric": "ตัวชี้วัดเซิร์ฟเวอร์",
		"aiscript": " คอนโซล AiScript",
		"aiscriptApp": "แอป AiScript",
		"aichan": "藍 (ไอ)",
		"userList": "รายชื่อผู้ใช้",
		"_userList": {
			"chooseList": "เลือกรายชื่อ"
		},
		"clicker": "คลิกเกอร์",
		"birthdayFollowings": "วันเกิดผู้ใช้ในวันนี้",
		"chat": "แชตเลย"
	},
	"preview": "แสดงตัวอย่าง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"widgetsLabels": {
		"profile": "Profil",
		"instanceInfo": "Sunucu Bilgisi",
		"memo": "Yapışkan notlar",
		"notifications": "Bildirimler",
		"timeline": "Pano",
		"calendar": "Takvim",
		"trends": "Trend olan",
		"clock": "Saat",
		"rss": "RSS okuyucu",
		"rssTicker": "RSS-Ticker",
		"activity": "Etkinlik",
		"photos": "Fotoğraflar",
		"digitalClock": "Dijital saat",
		"unixClock": "UNIX saati",
		"federation": "Federasyon",
		"instanceCloud": "Bulut sunucu",
		"postForm": "Gönderim formu",
		"slideshow": "Slayt gösterisi",
		"button": "Düğme",
		"onlineUsers": "Çevrimiçi kullanıcılar",
		"jobQueue": "İş Kuyruğu",
		"serverMetric": "Sunucu ölçümleri",
		"aiscript": "AiScript konsolu",
		"aiscriptApp": "AiScript Uygulaması",
		"aichan": "Ai",
		"userList": "Kullanıcı listesi",
		"_userList": {
			"chooseList": "Bir liste seçin"
		},
		"clicker": "Tıklayıcı",
		"birthdayFollowings": "Bugünün Doğum Günleri",
		"chat": "Sohbet"
	},
	"preview": "Önizleme"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"widgetsLabels": {
		"profile": "profile",
		"instanceInfo": "Instance Information",
		"memo": "Sticky notes",
		"notifications": "Notifications",
		"timeline": "Timeline",
		"calendar": "Calendar",
		"trends": "Trending",
		"clock": "Clock",
		"rss": "RSS reader",
		"rssTicker": "RSS-Ticker",
		"activity": "Activity",
		"photos": "Photos",
		"digitalClock": "Digital clock",
		"unixClock": "UNIX clock",
		"federation": "Federation",
		"instanceCloud": "Instance cloud",
		"postForm": "Posting form",
		"slideshow": "Slideshow",
		"button": "Button",
		"onlineUsers": "Online users",
		"jobQueue": "Job Queue",
		"serverMetric": "Server metrics",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "User list",
		"_userList": {
			"chooseList": "Select a list"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Preview"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"widgetsLabels": {
		"profile": "Профіль",
		"instanceInfo": "Про цей інстанс",
		"memo": "Нагадування",
		"notifications": "Сповіщення",
		"timeline": "Стрічка",
		"calendar": "Календар",
		"trends": "Тенденції",
		"clock": "Годинник",
		"rss": "RSS-читач",
		"rssTicker": "RSS-Ticker",
		"activity": "Активність",
		"photos": "Фото",
		"digitalClock": "Цифровий годинник",
		"unixClock": "Unix-годинник",
		"federation": "Федіверс",
		"instanceCloud": "Хмара інстансів",
		"postForm": "Створення нотатки",
		"slideshow": "Слайд-шоу",
		"button": "Кнопка",
		"onlineUsers": "Користувачі онлайн",
		"jobQueue": "Черга завдань",
		"serverMetric": "Показники сервера ",
		"aiscript": "Консоль AiScript",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "Список користувачів",
		"_userList": {
			"chooseList": "Виберіть список"
		},
		"clicker": "Clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Написати цьому користувачу"
	},
	"preview": "Попередній перегляд"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"widgetsLabels": {
		"profile": "Trang cá nhân",
		"instanceInfo": "Thông tin máy chủ",
		"memo": "Tút đã ghim",
		"notifications": "Thông báo",
		"timeline": "Bảng tin",
		"calendar": "Lịch",
		"trends": "Xu hướng",
		"clock": "Đồng hồ",
		"rss": "Trình đọc RSS",
		"rssTicker": "RSS-Ticker",
		"activity": "Hoạt động",
		"photos": "Kho ảnh",
		"digitalClock": "Đồng hồ số",
		"unixClock": "Đồng hồ UNIX",
		"federation": "Liên hợp",
		"instanceCloud": "Instance cloud",
		"postForm": "Mẫu đăng",
		"slideshow": "Trình chiếu",
		"button": "Nút",
		"onlineUsers": "Ai đang online",
		"jobQueue": "Công việc chờ xử lý",
		"serverMetric": "Thống kê máy chủ",
		"aiscript": "AiScript console",
		"aiscriptApp": "AiScript App",
		"aichan": "Ai",
		"userList": "Danh sách người dùng",
		"_userList": {
			"chooseList": "Chọn danh sách"
		},
		"clicker": "clicker",
		"birthdayFollowings": "Today's Birthdays",
		"chat": "Chat with user"
	},
	"preview": "Xem trước"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"widgetsLabels": {
		"profile": "个人资料",
		"instanceInfo": "服务器信息",
		"memo": "便签",
		"notifications": "通知",
		"timeline": "时间线",
		"calendar": "日历",
		"trends": "趋势",
		"clock": "时钟",
		"rss": "RSS 阅读器",
		"rssTicker": "RSS Ticker",
		"activity": "活动",
		"photos": "照片",
		"digitalClock": "数字时钟",
		"unixClock": "UNIX 时钟",
		"federation": "联邦",
		"instanceCloud": "服务器球状列表",
		"postForm": "发帖窗口",
		"slideshow": "幻灯片展示",
		"button": "按钮",
		"onlineUsers": "在线用户数",
		"jobQueue": "作业队列",
		"serverMetric": "服务器指标",
		"aiscript": "AiScript 控制台",
		"aiscriptApp": "AiScript App",
		"aichan": "小蓝",
		"userList": "用户列表",
		"_userList": {
			"chooseList": "选择列表"
		},
		"clicker": "点击器",
		"birthdayFollowings": "今天是他们的生日",
		"chat": "私信"
	},
	"preview": "预览"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"widgetsLabels": {
		"profile": "個人檔案",
		"instanceInfo": "伺服器資訊",
		"memo": "備忘錄",
		"notifications": "通知",
		"timeline": "時間軸",
		"calendar": "行事曆",
		"trends": "熱門貼文",
		"clock": "時鐘",
		"rss": "RSS 閱讀器",
		"rssTicker": "RSS 跑馬燈",
		"activity": "動態",
		"photos": "照片",
		"digitalClock": "電子時鐘",
		"unixClock": "UNIX 時間",
		"federation": "聯邦宇宙",
		"instanceCloud": "伺服器雲",
		"postForm": "發文視窗",
		"slideshow": "幻燈片",
		"button": "按鈕",
		"onlineUsers": "上線使用者",
		"jobQueue": "佇列",
		"serverMetric": "伺服器指標 ",
		"aiscript": "AiScript 控制臺",
		"aiscriptApp": "AiScript App",
		"aichan": "小藍",
		"userList": "使用者列表",
		"_userList": {
			"chooseList": "選擇清單"
		},
		"clicker": "點擊器",
		"birthdayFollowings": "今天生日的使用者",
		"chat": "聊天"
	},
	"preview": "預覽"
}
</locale>
