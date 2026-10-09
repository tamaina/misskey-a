<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<RouterView/>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, ref } from 'vue';
import { instanceName } from '@features/boot/frontend/shared/config.js';
import XCommon from '../../../navigation/frontend/ui/_common_/common.vue';
import type { PageMetadata } from '@features/navigation/frontend/page.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@features/navigation/frontend/page.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { DI } from '@features/ui/frontend/di.js';

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const pageMetadata = ref<null | PageMetadata>(null);

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			window.document.title = pageMetadata.value.title;
		} else {
			window.document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);
</script>

<style lang="scss" module>
.root {
	position: relative;
	height: 100dvh;
}
</style>
