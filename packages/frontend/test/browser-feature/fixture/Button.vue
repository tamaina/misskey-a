<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template><button @click="emit('click')"><slot></slot></button></template>
<script setup lang="ts">
const emit = defineEmits<{ (event: 'click'): void }>();
</script>
