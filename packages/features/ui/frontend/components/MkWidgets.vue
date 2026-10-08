<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps_s">
	<template v-if="edit">
		<header :class="$style.editHeader">
			<MkSelect v-model="widgetAdderSelected" :items="widgetAdderSelectedDef" style="margin-bottom: var(--MI-margin)" data-testid="widget-select">
				<template #label>{{ $locale.sfc.selectWidget }}</template>
			</MkSelect>
			<MkButton inline primary data-testid="widget-add" @click="addWidget"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
			<MkButton inline @click="emit('exit')">{{ $locale.sfc.close }}</MkButton>
		</header>
		<MkDraggable
			:modelValue="props.widgets"
			direction="vertical"
			withGaps
			group="MkWidgets"
			@update:modelValue="v => emit('updateWidgets', v)"
		>
			<template #default="{ item }">
				<div :class="[$style.widget, $style.customizeContainer]" data-testid="customize-container">
					<button :class="$style.customizeContainerConfig" class="_button" @click.prevent.stop="configWidget(item.id)"><i class="ti ti-settings"></i></button>
					<button :class="$style.customizeContainerRemove" data-testid="customize-container-remove" class="_button" @click.prevent.stop="removeWidget(item)"><i class="ti ti-x"></i></button>
					<component :is="`widget-${item.name}`" :ref="(el: any) => widgetRefs[item.id] = el" :class="$style.customizeContainerHandleWidget" :widget="item" @updateProps="updateWidget(item.id, $event)"/>
				</div>
			</template>
		</MkDraggable>
	</template>
	<component :is="`widget-${widget.name}`" v-for="widget in _widgets" v-else :key="widget.id" :ref="(el: any) => widgetRefs[widget.id] = el" :class="$style.widget" :widget="widget" @updateProps="updateWidget(widget.id, $event)" @contextmenu.stop="onContextmenu(widget, $event)"/>
</div>
</template>

<script lang="ts">
export type Widget = {
	name: string;
	id: string;
	data: Record<string, any>;
};
export type DefaultStoredWidget = {
	place: string | null;
} & Widget;
</script>

<script lang="ts" setup>
import { computed } from 'vue';
import { isLink } from '@features/ui/frontend/shared/is-link.js';
import type { Component } from 'vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { widgets as widgetDefs, federationWidgets } from '@features/index/frontend/widgets.js';
import * as os from '@features/ui/frontend/os.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { instance } from '@features/instance/frontend/instance.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

const props = defineProps<{
	widgets: Widget[];
	edit: boolean;
}>();

const _widgetDefs = computed(() => {
	if (instance.federation === 'none') {
		return widgetDefs.filter(x => !federationWidgets.includes(x as any));
	} else {
		return widgetDefs;
	}
});

const _widgets = computed(() => props.widgets.filter(x => _widgetDefs.value.includes(x.name as any)));

const emit = defineEmits<{
	(ev: 'updateWidgets', widgets: Widget[]): void;
	(ev: 'addWidget', widget: Widget): void;
	(ev: 'removeWidget', widget: Widget): void;
	(ev: 'updateWidget', widget: { id: Widget['id']; data: Widget['data']; }): void;
	(ev: 'exit'): void;
}>();

const widgetRefs = {} as Record<string, Component & { configure: () => void }>;

function configWidget(id: string) {
	widgetRefs[id].configure();
}

const {
	model: widgetAdderSelected,
	def: widgetAdderSelectedDef,
} = useMkSelect({
	items: computed(() => [{ label: $locale.value.sfc.none, value: null }, ..._widgetDefs.value.map(x => ({ label: copyLocaleDictionary($locale.value.sfc.widgetsLabels)[x], value: x }))]),
	initialValue: null,
});

function addWidget() {
	if (widgetAdderSelected.value == null) return;

	emit('addWidget', {
		name: widgetAdderSelected.value,
		id: genId(),
		data: {},
	});

	widgetAdderSelected.value = null;
}

function removeWidget(widget: Widget) {
	emit('removeWidget', widget);
}

function updateWidget(id: Widget['id'], data: Widget['data']) {
	emit('updateWidget', { id, data });
}

function onContextmenu(widget: Widget, ev: PointerEvent) {
	const element = ev.target as HTMLElement | null;
	if (element && isLink(element)) return;
	if (element && (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(element.tagName) || element.attributes.getNamedItem('contenteditable') != null)) return;
	if (window.getSelection()?.toString() !== '') return;

	os.contextMenu([{
		type: 'label',
		text: copyLocaleDictionary($locale.value.sfc.widgetsLabels)[widget.name as typeof widgetDefs[number]],
	}, {
		icon: 'ti ti-settings',
		text: $locale.value.sfc.settings,
		action: () => {
			configWidget(widget.id);
		},
	}], ev);
}
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
}

.widget {
	contain: content;
}

.edit {
	&Header {
		margin: 16px 0;

		> * {
			width: 100%;
			padding: 4px;
		}
	}
}

.customizeContainer {
	position: relative;
	cursor: move;

	&Config,
	&Remove {
		position: absolute;
		z-index: 10000;
		top: 8px;
		width: 32px;
		height: 32px;
		color: #fff;
		background: rgba(#000, 0.7);
		border-radius: 4px;
	}

	&Config {
		right: 8px + 8px + 32px;
	}

	&Remove {
		right: 8px;
	}

	&Handle {

		&Widget {
			pointer-events: none;
		}
	}

}

</style>

<locale lang="json" locale="ar-SA">
{
	"selectWidget": "اختر ودجة",
	"add": "إضافة",
	"close": "اغلق",
	"none": "لا شيء",
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
	"settings": "الاعدادات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"selectWidget": "Triar un giny",
	"add": "Afegir",
	"close": "Tanca",
	"none": "Res",
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
	"settings": "Preferències"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"selectWidget": "Zvolte widget",
	"add": "Přidat",
	"close": "Zavřít",
	"none": "Žádný",
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
	"settings": "Nastavení"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"selectWidget": "Select a widget",
	"add": "Add",
	"close": "Close",
	"none": "None",
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
	"settings": "Settings"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"selectWidget": "Widget auswählen",
	"add": "Hinzufügen",
	"close": "Schließen",
	"none": "Nichts",
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
	"settings": "Einstellungen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"selectWidget": "Select a widget",
	"add": "Add",
	"close": "Close",
	"none": "None",
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
	"settings": "Settings"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"selectWidget": "Seleccionar widget",
	"add": "Agregar",
	"close": "Cerrar",
	"none": "Ninguna",
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
	"settings": "Configuración"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"selectWidget": "Sélectionner un widget",
	"add": "Ajouter",
	"close": "Fermer",
	"none": "Rien",
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
	"settings": "Paramètres"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"selectWidget": "Pilih gawit",
	"add": "Tambahkan",
	"close": "Tutup",
	"none": "Tidak ada",
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
	"settings": "Pengaturan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"selectWidget": "Seleziona il riquadro",
	"add": "Aggiungi",
	"close": "Chiudi",
	"none": "Nessuna",
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
	"settings": "Impostazioni"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"selectWidget": "ウィジェットを選択",
	"add": "追加",
	"close": "閉じる",
	"none": "なし",
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
	"settings": "設定"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"selectWidget": "ウィジェットを選ぶ",
	"add": "増やす",
	"close": "さいなら",
	"none": "なし",
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
	"settings": "設定"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"selectWidget": "Select a widget",
	"add": "Add",
	"close": "Close",
	"none": "None",
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
	"settings": "Iɣewwaṛen"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"selectWidget": "Select a widget",
	"add": "Add",
	"close": "Close",
	"none": "None",
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
	"settings": "ಸಿದ್ಧತೆಗಳು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"selectWidget": "위젯 선택",
	"add": "추가",
	"close": "닫기",
	"none": "없음",
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
	"settings": "설정"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"selectWidget": "Kies een widget",
	"add": "Toevoegen",
	"close": "Sluiten",
	"none": "Niets",
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
	"settings": "Instellingen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"selectWidget": "Velg en widget",
	"add": "Legg til",
	"close": "Lukk",
	"none": "Ingen",
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
	"settings": "Innstillinger"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"selectWidget": "Wybierz widżet",
	"add": "Dodaj",
	"close": "Zamknij",
	"none": "Brak",
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
	"settings": "Ustawienia"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"selectWidget": "Selecione um widget",
	"add": "Adicionar",
	"close": "Fechar",
	"none": "Nenhum",
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
	"settings": "Configurações"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"selectWidget": "Выберите виджет",
	"add": "Добавить",
	"close": "Закрыть",
	"none": "Ничего",
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
	"settings": "Настройки"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"selectWidget": "Vyberte widget",
	"add": "Pridať",
	"close": "Zavrieť",
	"none": "Žiadne",
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
	"settings": "Nastavenia"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"selectWidget": "เลือกวิดเจ็ต",
	"add": "เพิ่ม",
	"close": "ปิด",
	"none": "ไม่มี",
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
	"settings": "การตั้งค่า"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"selectWidget": "Araç seç",
	"add": "Ekle",
	"close": "Kapat",
	"none": "Hiçbiri",
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
	"settings": "Ayarlar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"selectWidget": "Select a widget",
	"add": "Add",
	"close": "Close",
	"none": "None",
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
	"settings": "Settings"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"selectWidget": "Виберіть віджет",
	"add": "Додати",
	"close": "Закрити",
	"none": "Відсутній",
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
	"settings": "Налаштування"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"selectWidget": "Chọn tiện ích",
	"add": "Thêm",
	"close": "Đóng",
	"none": "Không",
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
	"settings": "Cài đặt"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"selectWidget": "选择小工具",
	"add": "添加",
	"close": "关闭",
	"none": "无",
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
	"settings": "设置"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"selectWidget": "選擇小工具",
	"add": "新增",
	"close": "關閉",
	"none": "無",
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
	"settings": "設定"
}
</locale>
