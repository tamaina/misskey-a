<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkDraggable
	:modelValue="editableBlocks"
	direction="vertical"
	withGaps
	canNest
	manualDragStart
	group="pageBlocks"
	@update:modelValue="updateBlocks"
>
	<template #default="{ item, dragStart }">
		<div>
			<!-- divが無いとエラーになる -->
			<component
				:is="getComponent(item.type)"
				:modelValue="item"
				:dragStartCallback="dragStart"
				@update:modelValue="updateItem"
				@remove="() => removeItem(item)"
			/>
		</div>
	</template>
</MkDraggable>
</template>

<script lang="ts" setup>
import type { Component } from 'vue';
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import XSection from '@features/pages/frontend/pages/page-editor/els/page-editor.el.section.vue';
import XText from '@features/pages/frontend/pages/page-editor/els/page-editor.el.text.vue';
import XImage from '@features/pages/frontend/pages/page-editor/els/page-editor.el.image.vue';
import XNote from '@features/pages/frontend/pages/page-editor/els/page-editor.el.note.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { getKnownPageBlocks, replaceKnownPageBlocks } from '@features/pages/frontend/page-blocks.js';

function getComponent(type: Misskey.entities.Page['content'][number]['type']): Component {
	switch (type) {
		case 'section': return XSection;
		case 'text': return XText;
		case 'image': return XImage;
		case 'note': return XNote;
		default: return XText;
	}
}

const props = defineProps<{
	modelValue: Misskey.entities.Page['content'];
}>();

const editableBlocks = computed(() => getKnownPageBlocks(props.modelValue));

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.Page['content']): void;
}>();

function updateItem(v: Misskey.entities.PageBlock) {
	const i = editableBlocks.value.findIndex(x => x.id === v.id);
	if (i < 0) return;

	const newBlocks = [...editableBlocks.value];
	newBlocks[i] = v;
	updateBlocks(newBlocks);
}

function removeItem(v: Misskey.entities.PageBlock) {
	const i = editableBlocks.value.findIndex(x => x.id === v.id);
	if (i < 0) return;

	const newBlocks = [...editableBlocks.value];
	newBlocks.splice(i, 1);
	updateBlocks(newBlocks);
}

function updateBlocks(blocks: Misskey.entities.PageBlock[]) {
	emit('update:modelValue', replaceKnownPageBlocks(props.modelValue, blocks));
}
</script>
