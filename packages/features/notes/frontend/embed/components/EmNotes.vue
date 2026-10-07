<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<EmPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad">
	<template #empty>
		<div class="_fullinfo">
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div :class="[$style.root]">
			<EmNote v-for="note in notes" :key="note._featuredId_ || note._prId_ || note.id" :class="$style.note" :note="note as Misskey.entities.Note"/>
		</div>
	</template>
</EmPagination>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import EmNote from '@features/notes/frontend/embed/components/EmNote.vue';
import EmPagination from '@features/ui/frontend/embed/components/EmPagination.vue';
import type { Paging } from '@features/ui/frontend/embed/components/EmPagination.vue';
import { i18n } from '@features/runtime/frontend/embed/i18n.js';
import * as Misskey from 'misskey-js';

withDefaults(defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
	ad?: boolean;
}>(), {
	ad: true,
});

const pagingComponent = useTemplateRef('pagingComponent');

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	background: var(--MI_THEME-panel);
}

.note {
	border-bottom: 0.5px solid var(--MI_THEME-divider);
}
</style>
