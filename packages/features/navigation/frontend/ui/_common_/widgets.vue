<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XWidgets
		:edit="editMode"
		:widgets="widgets"
		@addWidget="addWidget"
		@removeWidget="removeWidget"
		@updateWidget="updateWidget"
		@updateWidgets="updateWidgets"
		@exit="editMode = false"
	/>

	<button v-if="editMode" class="_textButton" style="font-size: 0.9em;" @click="editMode = false"><i class="ti ti-check"></i> {{ $locale.sfc.editWidgetsExit }}</button>
	<button v-else class="_textButton" data-testid="widget-edit" :class="$style.edit" style="font-size: 0.9em; margin-top: 16px;" @click="editMode = true"><i class="ti ti-pencil"></i> {{ $locale.sfc.editWidgets }}</button>
</div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
const editMode = ref(false);
</script>

<script lang="ts" setup>
import type { DefaultStoredWidget, Widget } from '@features/ui/frontend/components/MkWidgets.vue';
import XWidgets from '@features/ui/frontend/components/MkWidgets.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';

const props = withDefaults(defineProps<{
	// null = 全てのウィジェットを表示
	// left = place: leftだけを表示
	// right = rightとnullを表示
	place?: 'left' | null | 'right';
}>(), {
	place: null,
});

const widgets = computed(() => {
	if (props.place === null) return prefer.r.widgets.value;
	if (props.place === 'left') return prefer.r.widgets.value.filter(w => w.place === 'left');
	return prefer.r.widgets.value.filter(w => w.place !== 'left');
});

function addWidget(widget: Widget) {
	prefer.commit('widgets', [{
		...widget,
		place: props.place,
	}, ...prefer.s.widgets]);
}

function removeWidget(widget: Widget) {
	prefer.commit('widgets', prefer.s.widgets.filter(w => w.id !== widget.id));
}

function updateWidget(widget: { id: Widget['id']; data: Widget['data']; }) {
	prefer.commit('widgets', prefer.s.widgets.map(w => w.id === widget.id ? {
		...w,
		data: widget.data,
		place: props.place,
	} : w));
}

function updateWidgets(thisWidgets: Widget[]) {
	if (props.place === null) {
		prefer.commit('widgets', thisWidgets as DefaultStoredWidget[]);
		return;
	}

	if (props.place === 'left') {
		prefer.commit('widgets', [
			...thisWidgets.map(w => ({ ...w, place: 'left' })),
			...prefer.s.widgets.filter(w => w.place !== 'left' && !thisWidgets.some(t => w.id === t.id)),
		]);
		return;
	}

	prefer.commit('widgets', [
		...prefer.s.widgets.filter(w => w.place === 'left' && !thisWidgets.some(t => w.id === t.id)),
		...thisWidgets.map(w => ({ ...w, place: 'right' })),
	]);
}
</script>

<style lang="scss" module>
.edit {
	width: 100%;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "editWidgetsExit": "تم",
  "editWidgets": "عدّل الودجات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "editWidgetsExit": "Fet",
  "editWidgets": "Editar ginys"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "editWidgetsExit": "Hotovo",
  "editWidgets": "Upravit widget"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "editWidgetsExit": "Done",
  "editWidgets": "Edit widgets"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "editWidgetsExit": "Fertig",
  "editWidgets": "Widgets bearbeiten"
}
</locale>

<locale locale="en-US" lang="json">
{
  "editWidgetsExit": "Done",
  "editWidgets": "Edit widgets"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "editWidgetsExit": "Hecho",
  "editWidgets": "Editar widgets"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "editWidgetsExit": "Valider les modifications",
  "editWidgets": "Modifier les widgets"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "editWidgetsExit": "Selesai",
  "editWidgets": "Sunting gawit"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "editWidgetsExit": "Conferma le modifiche",
  "editWidgets": "Modifica i riquadri"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "editWidgetsExit": "編集を終了",
  "editWidgets": "ウィジェットを編集"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "editWidgetsExit": "いじるのをやめる",
  "editWidgets": "ウィジェットをいじる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "editWidgetsExit": "Done",
  "editWidgets": "Edit widgets"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "editWidgetsExit": "Done",
  "editWidgets": "Edit widgets"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "editWidgetsExit": "편집 종료",
  "editWidgets": "위젯 편집"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "editWidgetsExit": "Klaar",
  "editWidgets": "Bewerk widgets"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "editWidgetsExit": "Ferdig",
  "editWidgets": "Rediger widgeter"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "editWidgetsExit": "Gotowe",
  "editWidgets": "Edytuj widżety"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "editWidgetsExit": "Pronto",
  "editWidgets": "Editar widgets"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "editWidgetsExit": "Готово",
  "editWidgets": "Редактировать виджеты"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "editWidgetsExit": "Hotovo",
  "editWidgets": "Upraviť widget"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "editWidgetsExit": "เรียบร้อย",
  "editWidgets": "แก้ไขวิดเจ็ต"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "editWidgetsExit": "Tamam",
  "editWidgets": "Araçları düzenle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "editWidgetsExit": "Done",
  "editWidgets": "Edit widgets"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "editWidgetsExit": "Готово",
  "editWidgets": "Редагувати віджети"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "editWidgetsExit": "Xong",
  "editWidgets": "Sửa tiện ích"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "editWidgetsExit": "完成编辑",
  "editWidgets": "编辑小工具"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "editWidgetsExit": "完成",
  "editWidgets": "編輯小工具"
}
</locale>
