<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSuspense v-slot="{ result }" :p="_fetch_">
	<XRoot :post="result"/>
</MkSuspense>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XRoot from '@features/gallery/frontend/pages/gallery/edit.root.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { i18n } from '@features/runtime/frontend/i18n.js';
import { definePage } from '@features/navigation/frontend/page.js';

const props = defineProps<{
	postId?: string,
}>();

function _fetch_() {
	if (props.postId == null) {
		return Promise.resolve(null);
	} else {
		return misskeyApi('gallery/posts/show', {
			postId: props.postId,
		});
	}
}

definePage(() => ({
	title: props.postId ? i18n.ts.edit : i18n.ts.postToGallery,
	icon: 'ti ti-pencil',
}));
</script>
