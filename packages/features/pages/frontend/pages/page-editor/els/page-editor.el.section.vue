<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" :dragStartCallback="dragStartCallback" @remove="() => emit('remove')">
	<template #header><i class="ti ti-note"></i> {{ props.modelValue.title }}</template>
	<template #func>
		<button class="_button" @click="rename()">
			<i class="ti ti-pencil"></i>
		</button>
	</template>

	<section class="ilrvjyvi">
		<XBlocks v-model="children" class="children"/>
		<MkButton rounded class="add" @click="add()"><i class="ti ti-plus"></i></MkButton>
	</section>
</XContainer>
</template>

<script lang="ts" setup>

import { defineAsyncComponent, inject, onMounted, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '@features/pages/frontend/pages/page-editor/page-editor.container.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import * as os from '@features/ui/frontend/os.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { getPageBlockList } from '@features/pages/frontend/pages/page-editor/common.js';

const XBlocks = defineAsyncComponent(() => import('@features/pages/frontend/pages/page-editor/page-editor.blocks.vue'));

const props = defineProps<{
	dragStartCallback?: (ev: DragEvent) => void;
	modelValue: Extract<Misskey.entities.PageBlock, { type: 'section'; }>,
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Extract<Misskey.entities.PageBlock, { type: 'section'; }>): void;
	(ev: 'remove'): void;
}>();

const children = ref(deepClone(props.modelValue.children ?? []));

watch(children, () => {
	emit('update:modelValue', {
		...props.modelValue,
		children: children.value,
	});
}, {
	deep: true,
});

async function rename() {
	const { canceled, result: title } = await os.inputText({
		title: $locale.value.sfc.enterSectionTitle,
		default: props.modelValue.title,
	});
	if (canceled || title == null) return;
	emit('update:modelValue', {
		...props.modelValue,
		title,
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		title: $locale.value.sfc.chooseBlock,
		items: getPageBlockList(),
	});
	if (canceled || type == null) return;

	const id = genId();

	// TODO: page-editor.vueのと共通化
	if (type === 'text') {
		children.value.push({
			id,
			type,
			text: '',
		});
	} else if (type === 'section') {
		children.value.push({
			id,
			type,
			title: '',
			children: [],
		});
	} else if (type === 'image') {
		children.value.push({
			id,
			type,
			fileId: null,
		});
	} else if (type === 'note') {
		children.value.push({
			id,
			type,
			detailed: false,
			note: null,
		});
	}
}

onMounted(() => {
	if (props.modelValue.title == null) {
		rename();
	}
});
</script>

<style lang="scss" scoped>
.ilrvjyvi {
	> .children {
		margin: 16px;

		&:empty {
			display: none;
		}
	}

	> .add {
		margin: 16px auto;
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "إضافة كتلة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"enterSectionTitle": "Escriu el títol de la secció",
	"chooseBlock": "Afegeix un bloc"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Přidat blok"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"enterSectionTitle": "Titel des Abschnitts eingeben",
	"chooseBlock": "Block hinzufügen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"enterSectionTitle": "Escribe el título de la sección",
	"chooseBlock": "Agregar bloque"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Ajouter un bloc"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Tambahkan blokir"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"enterSectionTitle": "Inserisci il titolo della sezione",
	"chooseBlock": "Aggiungi blocco"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"enterSectionTitle": "セクションタイトルを入力",
	"chooseBlock": "ブロックを追加"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"enterSectionTitle": "セクションタイトルを入れる",
	"chooseBlock": "ブロックを追加"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"enterSectionTitle": "섹션 타이틀을 입력하기",
	"chooseBlock": "블록 추가"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Dodaj blok"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"enterSectionTitle": "Insira um título à seção",
	"chooseBlock": "Adicionar bloco"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Добавить блок"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Pridať blok"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"enterSectionTitle": "ป้อนชื่อหัวข้อ",
	"chooseBlock": "เพิ่มบล็อก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"enterSectionTitle": "Bölüm başlığını girin",
	"chooseBlock": "Blok ekle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Add a block"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Додати блок"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"enterSectionTitle": "Enter a section title",
	"chooseBlock": "Thêm khối"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"enterSectionTitle": "输入会话标题",
	"chooseBlock": "添加内容块"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"enterSectionTitle": "輸入區段的標題",
	"chooseBlock": "新增方塊"
}
</locale>
