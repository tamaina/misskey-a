<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :naked="true" :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-apps" style="margin-right: 8px;"></i>{{ column.name || copyLocaleDictionary($locale.sfc.deckColumnsLabels)[props.column.type] }}</template>

	<div :class="$style.root">
		<div v-if="!(column.widgets && column.widgets.length > 0) && !edit" :class="$style.intro">{{ $locale.sfc.deckWidgetsIntroduction }}</div>
		<XWidgets :edit="edit" :widgets="column.widgets ?? []" @addWidget="addWidget" @removeWidget="removeWidget" @updateWidget="updateWidget" @updateWidgets="updateWidgets" @exit="edit = false"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XColumn from './column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { Widget } from '@features/ui/frontend/components/MkWidgets.vue';
import { addColumnWidget, removeColumnWidget, setColumnWidgets, updateColumnWidget } from '@features/preferences/frontend/deck.js';
import XWidgets from '@features/ui/frontend/components/MkWidgets.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const edit = ref(false);

function addWidget(widget: Widget) {
	addColumnWidget(props.column.id, widget);
}

function removeWidget(widget: Widget) {
	removeColumnWidget(props.column.id, widget);
}

function updateWidget(widget: { id: Widget['id']; data: Widget['data']; }) {
	updateColumnWidget(props.column.id, widget.id, widget.data);
}

function updateWidgets(widgets: Widget[]) {
	setColumnWidgets(props.column.id, widgets);
}

function func() {
	edit.value = !edit.value;
}

const menu = [{
	icon: 'ti ti-pencil',
	text: $locale.value.sfc.editWidgets,
	action: func,
}];
</script>

<style lang="scss" module>
.root {
	--MI-margin: 8px;
	--MI_THEME-panelBorder: none;

	padding: 0 var(--MI-margin);
}

.intro {
	padding: 16px;
	text-align: center;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"deckColumnsLabels": {
		"main": "الرئيسية",
		"widgets": "التطبيقات المُصغّرة",
		"notifications": "الإشعارات",
		"tl": "الخط الزمني",
		"antenna": "الهوائيات",
		"list": "القوائم",
		"channel": "القنوات",
		"mentions": "الإشارات",
		"direct": "مباشرة",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "عدّل الودجات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"deckColumnsLabels": {
		"main": "Principal",
		"widgets": "Ginys",
		"notifications": "Notificacions",
		"tl": "Línia de temps",
		"antenna": "Antena",
		"list": "Llistes",
		"channel": "Canals",
		"mentions": "Mencions",
		"direct": "Publicacions directes",
		"roleTimeline": "Línia de temps dels rols",
		"chat": "Xateja amb aquest usuari"
	},
	"deckWidgetsIntroduction": "Selecciona \"Editar ginys\" a la columna del menú i afegeix un.",
	"editWidgets": "Editar ginys"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"deckColumnsLabels": {
		"main": "Hlavní",
		"widgets": "Widgety",
		"notifications": "Oznámení",
		"tl": "Časová osa",
		"antenna": "Antény",
		"list": "Seznamy",
		"channel": "Kanály",
		"mentions": "Zmínění",
		"direct": "Přímé poznámky",
		"roleTimeline": "Časová osa role",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "V nabídce sloupce vyberte možnost \"Upravit widgety\" a přidejte widget.",
	"editWidgets": "Upravit widget"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"deckColumnsLabels": {
		"main": "Hauptspalte",
		"widgets": "Widgets",
		"notifications": "Benachrichtigungen",
		"tl": "Chronik",
		"antenna": "Antennen",
		"list": "Listen",
		"channel": "Kanal",
		"mentions": "Erwähnungen",
		"direct": "Direktnachrichten",
		"roleTimeline": "Rollenchronik",
		"chat": "Mit dem Benutzer chatten"
	},
	"deckWidgetsIntroduction": "Drücke bitte \"Widgets bearbeiten\" im Spaltenmenü und füge ein Widget hinzu.",
	"editWidgets": "Widgets bearbeiten"
}
</locale>

<locale lang="json" locale="en-US">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"deckColumnsLabels": {
		"main": "Principal",
		"widgets": "Widgets",
		"notifications": "Notificaciones",
		"tl": "Linea de tiempo",
		"antenna": "Antenas",
		"list": "Listas",
		"channel": "Canal",
		"mentions": "Menciones",
		"direct": "Notas directas",
		"roleTimeline": "Linea de tiempo del rol",
		"chat": "Chatear"
	},
	"deckWidgetsIntroduction": "Por favor selecciona \"Editar Widgets\" en el menú columna y agrega un widget.",
	"editWidgets": "Editar widgets"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"deckColumnsLabels": {
		"main": "Principale",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Fil",
		"antenna": "Antennes",
		"list": "Listes",
		"channel": "Canal",
		"mentions": "Mentions",
		"direct": "Direct",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Modifier les widgets"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"deckColumnsLabels": {
		"main": "Utama",
		"widgets": "Widget",
		"notifications": "Notifikasi",
		"tl": "Beranda",
		"antenna": "Antena",
		"list": "Daftar",
		"channel": "Kanal",
		"mentions": "Sebutan",
		"direct": "Langsung",
		"roleTimeline": "Lini masa peran",
		"chat": "Obrolan pengguna"
	},
	"deckWidgetsIntroduction": "Mohon pilih \"Sunting gawit\" pada menu kolom dan tambahkan gawit.",
	"editWidgets": "Sunting gawit"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"deckColumnsLabels": {
		"main": "Principale",
		"widgets": "Riquadri",
		"notifications": "Notifiche",
		"tl": "Timeline",
		"antenna": "Antenne",
		"list": "Liste",
		"channel": "Canali",
		"mentions": "Menzioni",
		"direct": "Note Dirette",
		"roleTimeline": "Timeline Ruolo",
		"chat": "Chatta con questa persona"
	},
	"deckWidgetsIntroduction": "Dal menu della colonna, selezionare \"Modifica i riquadri\" per aggiungere un un riquadro con funzionalità",
	"editWidgets": "Modifica i riquadri"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"deckColumnsLabels": {
		"main": "メイン",
		"widgets": "ウィジェット",
		"notifications": "通知",
		"tl": "タイムライン",
		"antenna": "アンテナ",
		"list": "リスト",
		"channel": "チャンネル",
		"mentions": "メンション",
		"direct": "指名",
		"roleTimeline": "ロールタイムライン",
		"chat": "ダイレクトメッセージ"
	},
	"deckWidgetsIntroduction": "カラムのメニューから、「ウィジェットの編集」を選択してウィジェットを追加してください",
	"editWidgets": "ウィジェットを編集"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"deckColumnsLabels": {
		"main": "メイン",
		"widgets": "ウィジェット",
		"notifications": "通知",
		"tl": "タイムライン",
		"antenna": "アンテナ",
		"list": "リスト",
		"channel": "チャンネル",
		"mentions": "あんた宛て",
		"direct": "ダイレクト",
		"roleTimeline": "ロールタイムライン",
		"chat": "チャットしよか"
	},
	"deckWidgetsIntroduction": "カラムのメニューから、「ウィジェットの編集」を選んでウィジェットを追加してなー",
	"editWidgets": "ウィジェットをいじる"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Ilɣuyen",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "Tibdarin",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "ಅಧಿಸೂಚನೆಗಳು",
		"tl": "ಸಮಯಸಾಲು",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "ಹೆಸರಿಸಿದ",
		"direct": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"deckColumnsLabels": {
		"main": "메인",
		"widgets": "위젯",
		"notifications": "알림",
		"tl": "타임라인",
		"antenna": "안테나",
		"list": "리스트",
		"channel": "채널",
		"mentions": "받은 멘션",
		"direct": "다이렉트",
		"roleTimeline": "역할 타임라인",
		"chat": "채팅하기"
	},
	"deckWidgetsIntroduction": "칼럼 메뉴의 \"위젯 편집\"에서 위젯을 추가해 주세요",
	"editWidgets": "위젯 편집"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Meldingen",
		"tl": "Tijdlijn",
		"antenna": "Antennes",
		"list": "Lijsten",
		"channel": "Kanalen",
		"mentions": "Vermeldingen",
		"direct": "Directe notities",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Bewerk widgets"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Varsler",
		"tl": "Tidslinje",
		"antenna": "Antenner",
		"list": "Lister",
		"channel": "Kanaler",
		"mentions": "Mentions",
		"direct": "Direkte",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Rediger widgeter"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"deckColumnsLabels": {
		"main": "Główna",
		"widgets": "Widżety",
		"notifications": "Powiadomienia",
		"tl": "Oś czasu",
		"antenna": "Anteny",
		"list": "Listy",
		"channel": "Kanały",
		"mentions": "Wspomnienia",
		"direct": "Bezpośredni",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Wybierz \"Edytuj widżety\" w menu kolumny i dodaj widżet.",
	"editWidgets": "Edytuj widżety"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"deckColumnsLabels": {
		"main": "Principal",
		"widgets": "Widgets",
		"notifications": "Notificações",
		"tl": "Timeline",
		"antenna": "Antenas",
		"list": "Listas",
		"channel": "Canais",
		"mentions": "Menções",
		"direct": "Notas diretas",
		"roleTimeline": "Linha do tempo do cargo",
		"chat": "Conversar com usuário"
	},
	"deckWidgetsIntroduction": "Por favor, selecione \"Editar widgets\" no menu em coluna e adicione um widget.",
	"editWidgets": "Editar widgets"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"deckColumnsLabels": {
		"main": "Основная",
		"widgets": "Виджеты",
		"notifications": "Уведомления",
		"tl": "Лента",
		"antenna": "Антенны",
		"list": "Списки",
		"channel": "Каналы",
		"mentions": "Упоминания",
		"direct": "Личное",
		"roleTimeline": "История Ролей",
		"chat": "Открыть личные сообщения"
	},
	"deckWidgetsIntroduction": "Чтобы добавлять виджеты, выбирайте «Редактировать виджеты» в меню колонки.",
	"editWidgets": "Редактировать виджеты"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"deckColumnsLabels": {
		"main": "Hlavný",
		"widgets": "Widgety",
		"notifications": "Oznámenia",
		"tl": "Časová os",
		"antenna": "Antény",
		"list": "Zoznam",
		"channel": "Kanály",
		"mentions": "Zmienky",
		"direct": "Priame poznámky",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "V ponuke stĺpca vyberte možnosť \"Upraviť widget\" a pridajte widget",
	"editWidgets": "Upraviť widget"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"deckColumnsLabels": {
		"main": "หลัก",
		"widgets": "วิดเจ็ต",
		"notifications": "การเเจ้งเตือน",
		"tl": "ไทม์ไลน์",
		"antenna": "เสาอากาศ",
		"list": "รายการ",
		"channel": "ช่อง",
		"mentions": "กล่าวถึงคุณ",
		"direct": "ไดเร็กต์",
		"roleTimeline": "บทบาทไทม์ไลน์",
		"chat": "แชตเลย"
	},
	"deckWidgetsIntroduction": "กรุณาเลือก \"แก้ไขวิดเจ็ต\" ในเมนูคอลัมน์และเพิ่มวิดเจ็ต",
	"editWidgets": "แก้ไขวิดเจ็ต"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"deckColumnsLabels": {
		"main": "Ana",
		"widgets": "Widget'lar",
		"notifications": "Bildirimler",
		"tl": "Pano",
		"antenna": "Antenler",
		"list": "Liste",
		"channel": "Kanal",
		"mentions": "Bahsetmeler",
		"direct": "Doğrudan notlar",
		"roleTimeline": "Rol Pano",
		"chat": "Sohbet"
	},
	"deckWidgetsIntroduction": "Lütfen sütun menüsünden “Widget'ları düzenle” seçeneğini seç ve bir widget ekle.",
	"editWidgets": "Araçları düzenle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"deckColumnsLabels": {
		"main": "Main",
		"widgets": "Widgets",
		"notifications": "Notifications",
		"tl": "Timeline",
		"antenna": "Antennas",
		"list": "List",
		"channel": "Channel",
		"mentions": "Mentions",
		"direct": "Direct notes",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"deckColumnsLabels": {
		"main": "Головна",
		"widgets": "Віджети",
		"notifications": "Сповіщення",
		"tl": "Стрічка",
		"antenna": "Антени",
		"list": "Списки",
		"channel": "Канали",
		"mentions": "Згадки",
		"direct": "Особисте",
		"roleTimeline": "Role Timeline",
		"chat": "Написати цьому користувачу"
	},
	"deckWidgetsIntroduction": "Будь ласка, виберіть «Редагувати віджети» в меню стовпців і додайте віджет.",
	"editWidgets": "Редагувати віджети"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"deckColumnsLabels": {
		"main": "Chính",
		"widgets": "Tiện ích",
		"notifications": "Thông báo",
		"tl": "Bảng tin",
		"antenna": "Trạm phát sóng",
		"list": "Danh sách",
		"channel": "Kênh",
		"mentions": "Lượt nhắc",
		"direct": "Nhắn riêng",
		"roleTimeline": "Role Timeline",
		"chat": "Chat with user"
	},
	"deckWidgetsIntroduction": "Chọn \"Sửa widget\" trong menu cột và thêm một widget.",
	"editWidgets": "Sửa tiện ích"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"deckColumnsLabels": {
		"main": "主列",
		"widgets": "小工具",
		"notifications": "通知",
		"tl": "时间线",
		"antenna": "天线",
		"list": "列表",
		"channel": "频道",
		"mentions": "提及",
		"direct": "指定用户",
		"roleTimeline": "角色时间线",
		"chat": "私信"
	},
	"deckWidgetsIntroduction": "从列菜单中，选择 “小工具编辑” 来添加小工具",
	"editWidgets": "编辑小工具"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"deckColumnsLabels": {
		"main": "主列",
		"widgets": "小工具",
		"notifications": "通知",
		"tl": "時間軸",
		"antenna": "天線",
		"list": "清單",
		"channel": "頻道",
		"mentions": "提及",
		"direct": "指定使用者",
		"roleTimeline": "角色時間軸",
		"chat": "聊天"
	},
	"deckWidgetsIntroduction": "請從欄位選單中選擇「編輯小工具」新增小工具。",
	"editWidgets": "編輯小工具"
}
</locale>
