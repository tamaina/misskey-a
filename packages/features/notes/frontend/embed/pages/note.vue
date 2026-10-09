<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.noteEmbedRoot">
	<EmNoteDetailed v-if="note && !prohibited" :note="note"/>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import * as Misskey from 'misskey-js';
import EmNoteDetailed from '@features/notes/frontend/embed/components/EmNoteDetailed.vue';
import XNotFound from '@features/web/frontend/embed/pages/not-found.vue';
import { DI } from '@features/boot/frontend/embed/di.js';
import { misskeyApi } from '@features/api/frontend/embed/misskey-api.js';
import { assertServerContext } from '@features/boot/frontend/embed/server-context.js';

const props = defineProps<{
	noteId: string;
}>();

const serverContext = inject(DI.serverContext)!;

const note = ref<Misskey.entities.Note | null>(null);

const prohibited = ref(false);

if (assertServerContext(serverContext, 'note')) {
	note.value = serverContext.note;
} else {
	note.value = await misskeyApi('notes/show', {
		noteId: props.noteId,
	}).catch(() => {
		return null;
	});
}

if (note.value?.url != null || note.value?.uri != null) {
	// リモートサーバーのノートは弾く
	prohibited.value = true;
}
</script>

<style lang="scss" module>
.noteEmbedRoot {
	background-color: var(--MI_THEME-panel);
}
</style>
