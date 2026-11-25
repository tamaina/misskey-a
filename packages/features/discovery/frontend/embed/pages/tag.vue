<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<EmTimelineContainer v-if="tag" :showHeader="embedParams.header">
		<template #header>
			<div :class="$style.clipHeader">
				<div :class="$style.headerClipIconRoot">
					<i class="ti ti-hash"></i>
				</div>
				<div :class="$style.headerTitle" @click="top">
					<div class="_nowrap"><a :href="`/tags/${tag}`" target="_blank" rel="noopener">#{{ tag }}</a></div>
					<div :class="$style.sub">{{ interpolateLocaleParameters(globalLocale.env.fromX, { x: instanceName }) }}</div>
				</div>
				<a :href="url" :class="$style.instanceIconLink" target="_blank" rel="noopener noreferrer">
					<img
						:class="$style.instanceIcon"
						:src="serverMetadata.iconUrl || '/favicon.ico'"
					/>
				</a>
			</div>
		</template>
		<template #body>
			<EmNotes
				ref="notesEl"
				:pagination="pagination"
				:disableAutoLoad="!embedParams.autoload"
				:noGap="true"
				:ad="false"
			/>
		</template>
	</EmTimelineContainer>
	<XNotFound v-else/>
</div>
</template>

<script setup lang="ts">
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, inject, useTemplateRef } from 'vue';
import { scrollToTop } from '@features/ui/frontend/shared/scroll.js';
import { url, instanceName } from '@features/boot/frontend/shared/config.js';
import { isLink } from '@features/ui/frontend/shared/is-link.js';
import { defaultEmbedParams } from '@features/web/frontend/shared/embed-page.js';
import EmNotes from '@features/notes/frontend/embed/components/EmNotes.vue';
import XNotFound from '@features/web/frontend/embed/pages/not-found.vue';
import EmTimelineContainer from '@features/timelines/frontend/embed/components/EmTimelineContainer.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { DI } from '@features/boot/frontend/embed/di.js';
import type { Paging } from '@features/ui/frontend/embed/components/EmPagination.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = defineProps<{
	tag: string;
}>();

const serverMetadata = inject(DI.serverMetadata)!;

const embedParams = inject(DI.embedParams, defaultEmbedParams);

const pagination = computed(() => ({
	endpoint: 'notes/search-by-tag',
	params: {
		tag: props.tag,
	},
} as Paging));

const notesEl = useTemplateRef('notesEl');

function top(ev: PointerEvent) {
	const target = ev.target as HTMLElement | null;
	if (target && isLink(target)) return;

	if (notesEl.value) {
		scrollToTop(notesEl.value.$el as HTMLElement, { behavior: 'smooth' });
	}
}
</script>

<style lang="scss" module>
.clipHeader {
	padding: 8px 16px;
	display: flex;
	min-width: 0;
	align-items: center;
	gap: var(--MI-margin);
	overflow: hidden;

	.headerClipIconRoot {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		line-height: 32px;
		font-size: 14px;
		text-align: center;
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		border-radius: 50%;
	}

	.headerTitle {
		flex-grow: 1;
		font-weight: 700;
		line-height: 1.1;
		min-width: 0;

		.sub {
			font-size: 0.8em;
			font-weight: 400;
			opacity: 0.7;
		}
	}

	.instanceIconLink {
		flex-shrink: 0;
		display: block;
		margin-left: auto;
		height: 24px;
	}

	.instanceIcon {
		height: 24px;
		border-radius: 3px;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{}
</locale>

<locale lang="json" locale="ca-ES">
{}
</locale>

<locale lang="json" locale="cs-CZ">
{}
</locale>

<locale lang="json" locale="da-DK">
{}
</locale>

<locale lang="json" locale="de-DE">
{}
</locale>

<locale lang="json" locale="en-US">
{}
</locale>

<locale lang="json" locale="es-ES">
{}
</locale>

<locale lang="json" locale="fr-FR">
{}
</locale>

<locale lang="json" locale="id-ID">
{}
</locale>

<locale lang="json" locale="it-IT">
{}
</locale>

<locale lang="json" locale="ja-JP">
{}
</locale>

<locale lang="json" locale="ja-KS">
{}
</locale>

<locale lang="json" locale="kab-KAB">
{}
</locale>

<locale lang="json" locale="kn-IN">
{}
</locale>

<locale lang="json" locale="ko-KR">
{}
</locale>

<locale lang="json" locale="nl-NL">
{}
</locale>

<locale lang="json" locale="no-NO">
{}
</locale>

<locale lang="json" locale="pl-PL">
{}
</locale>

<locale lang="json" locale="pt-PT">
{}
</locale>

<locale lang="json" locale="ru-RU">
{}
</locale>

<locale lang="json" locale="sk-SK">
{}
</locale>

<locale lang="json" locale="th-TH">
{}
</locale>

<locale lang="json" locale="tr-TR">
{}
</locale>

<locale lang="json" locale="ug-CN">
{}
</locale>

<locale lang="json" locale="uk-UA">
{}
</locale>

<locale lang="json" locale="vi-VN">
{}
</locale>

<locale lang="json" locale="zh-CN">
{}
</locale>

<locale lang="json" locale="zh-TW">
{}
</locale>
