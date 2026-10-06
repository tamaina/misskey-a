<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="tab === 'overview'" class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 20px;">
		<XOverview/>
	</div>
	<div v-else-if="tab === 'emojis'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<XEmojis/>
	</div>
	<div v-else-if="instance.federation !== 'none' && tab === 'federation'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<XFederation/>
	</div>
	<div v-else-if="tab === 'charts'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<MkInstanceStats/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import { i18n } from '@features/runtime/frontend/i18n.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { loadEmojiCatalog } from '@features/index/frontend';

const XOverview = defineAsyncComponent(() => import('@features/instance/frontend/pages/about.overview.vue'));
const XEmojis = defineAsyncComponent(loadEmojiCatalog);
const XFederation = defineAsyncComponent(() => import('@features/instance/frontend/pages/about.federation.vue'));
const MkInstanceStats = defineAsyncComponent(() => import('@features/statistics/frontend/components/MkInstanceStats.vue'));

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

const tab = ref(props.initialTab);

watch(tab, () => {
	if (tab.value === 'charts') {
		claimAchievement('viewInstanceChart');
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
}, {
	key: 'emojis',
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
}, ...(instance.federation !== 'none' ? [{
	key: 'federation',
	title: i18n.ts.federation,
	icon: 'ti ti-whirl',
}] : []), {
	key: 'charts',
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}]);

definePage(() => ({
	title: i18n.ts.instanceInfo,
	icon: 'ti ti-info-circle',
}));
</script>
