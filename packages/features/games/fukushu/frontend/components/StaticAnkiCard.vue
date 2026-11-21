<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<iframe v-if="html != null" sandbox="" referrerpolicy="no-referrer" :title="fallback" :srcdoc="documentHtml" :class="$style.frame"></iframe>
<p v-else :class="$style.text">{{ fallback }}</p>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { staticAnkiDocument } from '../static-anki-document.js';

const props = defineProps<{ fallback: string; html?: string; css?: string }>();
const documentHtml = computed(() => staticAnkiDocument(props.html ?? '', props.css ?? ''));
</script>
<style module>
.frame { display: block; width: 100%; height: 12rem; border: 0; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
