<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-mail"></i> {{ column.name || globalLocale.env._mail.title }}</template>
	<MkMailbox/>
</XColumn>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import XColumn from '@features/navigation/frontend/ui/deck/column.vue';
import MkMailbox from './MkMailbox.vue';
import type { Locale } from 'i18n';
import type { Column } from '@features/preferences/frontend/deck.js';

const globalLocale = useLocale<Locale>(import.meta.url);
defineProps<{ column: Column; isStacked: boolean }>();
</script>
