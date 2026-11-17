<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template><a :href="to"><slot></slot></a></template>
<script setup lang="ts">
defineProps<{ to: string }>();
</script>
