<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<span>{{ globalLocale.env.search }} ({{ engine }})</span>
</template>
<script setup lang="ts">
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { Locale } from 'i18n';

defineProps<{ engine: string }>();
const globalLocale = useLocale<Locale>(import.meta.url);
</script>
