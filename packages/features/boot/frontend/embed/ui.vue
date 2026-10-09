<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[
		$style.rootForEmbedPage,
		{
			[$style.rounded]: embedRounded,
			[$style.noBorder]: embedNoBorder,
		}
	]"
	:style="maxHeight > 0 ? { maxHeight: `${maxHeight}px`, '--embedMaxHeight': `${maxHeight}px` } : {}"
>
	<div
		:class="$style.routerViewContainer"
	>
		<Suspense :timeout="0">
			<EmNotePage v-if="page === 'notes'" :noteId="contentId"/>
			<EmUserTimelinePage v-else-if="page === 'user-timeline'" :userId="contentId"/>
			<EmClipPage v-else-if="page === 'clips'" :clipId="contentId"/>
			<EmTagPage v-else-if="page === 'tags'" :tag="contentId"/>
			<XNotFound v-else/>
			<template #fallback>
				<EmLoading/>
			</template>
		</Suspense>
	</div>
</div>
</template>

<script lang="ts" setup>
import { safeURIDecode } from '@features/web/frontend/shared/url.js';
import { ref, shallowRef, onMounted, onUnmounted, inject } from 'vue';
import { postMessageToParentWindow } from '@features/web/frontend/embed/post-message.js';
import { DI } from '@features/boot/frontend/embed/di.js';
import { defaultEmbedParams } from '@features/web/frontend/shared/embed-page.js';
import EmNotePage from '@features/notes/frontend/embed/pages/note.vue';
import EmUserTimelinePage from '@features/users/frontend/embed/pages/user-timeline.vue';
import EmClipPage from '@features/collections/frontend/embed/pages/clip.vue';
import EmTagPage from '@features/discovery/frontend/embed/pages/tag.vue';
import XNotFound from '@features/web/frontend/embed/pages/not-found.vue';
import EmLoading from '@features/ui/frontend/embed/components/EmLoading.vue';

const page = window.location.pathname.split('/')[2];
const contentId = safeURIDecode(window.location.pathname.split('/')[3]);
if (_DEV_) console.log(page, contentId);

const embedParams = inject(DI.embedParams, defaultEmbedParams);

//#region Embed Style
const embedRounded = ref(embedParams.rounded);
const embedNoBorder = ref(!embedParams.border);
const maxHeight = ref(embedParams.maxHeight ?? 0);
//#endregion

//#region Embed Resizer
const rootEl = shallowRef<HTMLElement | null>(null);

let previousHeight = 0;
const resizeObserver = new ResizeObserver(async () => {
	const height = rootEl.value!.scrollHeight + (embedNoBorder.value ? 0 : 2); // border 上下1px
	if (Math.abs(previousHeight - height) < 1) return; // 1px未満の変化は無視
	postMessageToParentWindow('misskey:embed:changeHeight', {
		height: (maxHeight.value > 0 && height > maxHeight.value) ? maxHeight.value : height,
	});
	previousHeight = height;
});
onMounted(() => {
	resizeObserver.observe(rootEl.value!);
});
onUnmounted(() => {
	resizeObserver.disconnect();
});
//#endregion
</script>

<style lang="scss" module>
.rootForEmbedPage {
	box-sizing: border-box;
	border: 1px solid var(--MI_THEME-divider);
	background-color: var(--MI_THEME-bg);
	overflow: hidden;
	position: relative;
	height: auto;

	&.rounded {
		border-radius: var(--MI-radius);
	}

	&.noBorder {
		border: none;
	}
}

.routerViewContainer {
	container-type: inline-size;
	max-height: var(--embedMaxHeight, none);
}
</style>
