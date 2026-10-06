<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<MkAntennaEditor @created="onAntennaCreated"/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { i18n } from '@features/runtime/frontend/i18n.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { antennasCache } from '@features/runtime/frontend/cache.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import MkAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';

const router = useRouter();

function onAntennaCreated() {
	antennasCache.delete();
	router.push('/my/antennas');
}

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.createAntenna,
	icon: 'ti ti-antenna',
}));
</script>
