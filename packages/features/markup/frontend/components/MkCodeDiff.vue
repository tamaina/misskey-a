<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkCode v-bind="props"/>
</template>

<script lang="ts" setup>
import MkCode from './MkCode.vue';

const props = withDefaults(defineProps<{
	code: string;
	diffBase: string;
	lang?: string;
	maxHeight?: number | null;
	forceShow?: boolean;
	copyButton?: boolean;
	withOuterStyle?: boolean;
}>(), {
	copyButton: true,
	forceShow: false,
	withOuterStyle: true,
});
</script>
