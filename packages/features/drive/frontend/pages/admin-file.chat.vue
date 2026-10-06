<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._fileViewer.thisPageCanBeSeenFromTheAuthor }}</MkInfo>

	<MkPagination :paginator="paginator">
		<template #default="{ items }">
			<XMessage v-for="item in items" :key="item.id" :message="item" :isSearchResult="true"/>
		</template>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import { i18n } from '@/i18n.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';

const props = defineProps<{
	fileId: string;
}>();

const realFileId = computed(() => props.fileId);

const paginator = markRaw(new Paginator('drive/files/attached-chat-messages', {
	limit: 10,
	params: {
		fileId: realFileId.value,
	},
}));
</script>
