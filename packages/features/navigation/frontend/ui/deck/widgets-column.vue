<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :naked="true" :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-apps" style="margin-right: 8px;"></i>{{ column.name || copyLocaleDictionary(globalLocale.env._deck._columns)[props.column.type] }}</template>

	<div :class="$style.root">
		<div v-if="!(column.widgets && column.widgets.length > 0) && !edit" :class="$style.intro">{{ $locale.sfc.deckWidgetsIntroduction }}</div>
		<XWidgets :edit="edit" :widgets="column.widgets ?? []" @addWidget="addWidget" @removeWidget="removeWidget" @updateWidget="updateWidget" @updateWidgets="updateWidgets" @exit="edit = false"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref } from 'vue';
import { addColumnWidget, removeColumnWidget, setColumnWidgets, updateColumnWidget } from '@features/preferences/frontend/deck.js';
import XWidgets from '@features/ui/frontend/components/MkWidgets.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import XColumn from './column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';
import type { Widget } from '@features/ui/frontend/components/MkWidgets.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "عدّل الودجات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"deckWidgetsIntroduction": "Selecciona \"Editar ginys\" a la columna del menú i afegeix un.",
	"editWidgets": "Editar ginys"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"deckWidgetsIntroduction": "V nabídce sloupce vyberte možnost \"Upravit widgety\" a přidejte widget.",
	"editWidgets": "Upravit widget"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"deckWidgetsIntroduction": "Drücke bitte \"Widgets bearbeiten\" im Spaltenmenü und füge ein Widget hinzu.",
	"editWidgets": "Widgets bearbeiten"
}
</locale>

<locale lang="json" locale="en-US">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"deckWidgetsIntroduction": "Por favor selecciona \"Editar Widgets\" en el menú columna y agrega un widget.",
	"editWidgets": "Editar widgets"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Modifier les widgets"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"deckWidgetsIntroduction": "Mohon pilih \"Sunting gawit\" pada menu kolom dan tambahkan gawit.",
	"editWidgets": "Sunting gawit"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"deckWidgetsIntroduction": "Dal menu della colonna, selezionare \"Modifica i riquadri\" per aggiungere un un riquadro con funzionalità",
	"editWidgets": "Modifica i riquadri"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"deckWidgetsIntroduction": "カラムのメニューから、「ウィジェットの編集」を選択してウィジェットを追加してください",
	"editWidgets": "ウィジェットを編集"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"deckWidgetsIntroduction": "カラムのメニューから、「ウィジェットの編集」を選んでウィジェットを追加してなー",
	"editWidgets": "ウィジェットをいじる"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"deckWidgetsIntroduction": "칼럼 메뉴의 \"위젯 편집\"에서 위젯을 추가해 주세요",
	"editWidgets": "위젯 편집"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Bewerk widgets"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Rediger widgeter"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"deckWidgetsIntroduction": "Wybierz \"Edytuj widżety\" w menu kolumny i dodaj widżet.",
	"editWidgets": "Edytuj widżety"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"deckWidgetsIntroduction": "Por favor, selecione \"Editar widgets\" no menu em coluna e adicione um widget.",
	"editWidgets": "Editar widgets"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"deckWidgetsIntroduction": "Чтобы добавлять виджеты, выбирайте «Редактировать виджеты» в меню колонки.",
	"editWidgets": "Редактировать виджеты"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"deckWidgetsIntroduction": "V ponuke stĺpca vyberte možnosť \"Upraviť widget\" a pridajte widget",
	"editWidgets": "Upraviť widget"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"deckWidgetsIntroduction": "กรุณาเลือก \"แก้ไขวิดเจ็ต\" ในเมนูคอลัมน์และเพิ่มวิดเจ็ต",
	"editWidgets": "แก้ไขวิดเจ็ต"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"deckWidgetsIntroduction": "Lütfen sütun menüsünden “Widget'ları düzenle” seçeneğini seç ve bir widget ekle.",
	"editWidgets": "Araçları düzenle"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"deckWidgetsIntroduction": "Please select \"Edit widgets\" in the column menu and add a widget.",
	"editWidgets": "Edit widgets"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"deckWidgetsIntroduction": "Будь ласка, виберіть «Редагувати віджети» в меню стовпців і додайте віджет.",
	"editWidgets": "Редагувати віджети"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"deckWidgetsIntroduction": "Chọn \"Sửa widget\" trong menu cột và thêm một widget.",
	"editWidgets": "Sửa tiện ích"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"deckWidgetsIntroduction": "从列菜单中，选择 “小工具编辑” 来添加小工具",
	"editWidgets": "编辑小工具"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"deckWidgetsIntroduction": "請從欄位選單中選擇「編輯小工具」新增小工具。",
	"editWidgets": "編輯小工具"
}
</locale>
