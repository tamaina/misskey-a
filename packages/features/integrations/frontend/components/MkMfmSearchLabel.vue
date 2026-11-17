<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template><span>{{ $l.sfc.searchWithEngine({ engine }) }}</span></template>
<script setup lang="ts">defineProps<{ engine: string }>(); </script>
<locale locale="ja-JP" lang="json">{ "searchWithEngine": "{engine} で検索" }</locale>
<locale locale="en-US" lang="json">{ "searchWithEngine": "Search with {engine}" }</locale>
