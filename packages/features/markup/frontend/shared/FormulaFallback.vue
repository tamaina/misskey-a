<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<pre v-if="block">{{ formula }}</pre>
<code v-else>{{ formula }}</code>
</template>
<script lang="ts" setup>
defineOptions({ inheritAttrs: false });
defineProps<{ formula: string; block: boolean }>();
</script>
