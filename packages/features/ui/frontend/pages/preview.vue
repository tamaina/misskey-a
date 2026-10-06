<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkSample/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSample from '@features/markup/frontend/components/MkPreview.vue';
import { i18n } from '@features/runtime/frontend/i18n.js';
import { definePage } from '@features/navigation/frontend/page.js';

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(computed(() => ({
	title: i18n.ts.preview,
	icon: 'ti ti-eye',
})));
</script>
