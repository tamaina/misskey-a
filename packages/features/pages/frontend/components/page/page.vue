<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="{ [$style.center]: page.alignCenter, [$style.serif]: page.font === 'serif' }" class="_gaps">
	<XBlock v-for="child in renderableBlocks" :key="child.id" :page="page" :block="child" :h="2"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import XBlock from '@features/pages/frontend/components/page/page.block.vue';
import { isKnownPageBlock } from '@features/pages/frontend/page-blocks.js';

const props = defineProps<{
	page: Misskey.entities.Page,
}>();

const renderableBlocks = computed(() => props.page.content.filter(isKnownPageBlock));
</script>

<style lang="scss" module>
.serif {
	font-family: serif;
}

.center {
	text-align: center;
}
</style>
