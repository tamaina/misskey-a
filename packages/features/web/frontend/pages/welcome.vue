<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance">
	<XSetup v-if="instance.requireSetup"/>
	<XEntranceClassic v-else-if="(instance.clientOptions.entrancePageStyle ?? 'classic') === 'classic'"/>
	<XEntranceSimple v-else/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { instanceName } from '@features/boot/frontend/shared/config.js';
import XSetup from '@features/boot/frontend/pages/welcome.setup.vue';
import XEntranceClassic from '@features/web/frontend/pages/welcome.entrance.classic.vue';
import XEntranceSimple from '@features/web/frontend/pages/welcome.entrance.simple.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { fetchInstance } from '@features/instance/frontend/instance.js';

const instance = ref<Misskey.entities.MetaDetailed | null>(null);

fetchInstance(true).then((res) => {
	instance.value = res;
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: instanceName,
	icon: null,
}));
</script>
