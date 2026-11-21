<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<SearchMarker path="/settings/residence" :label="$locale.sfc.title" :keywords="['residence', 'billing']" icon="ti ti-map-pin">
	<ResidenceSettings :client="nativeResidenceClient"/>
</SearchMarker>
</template>
<script setup lang="ts">
import { definePage } from '@features/navigation/frontend/page.js';
import ResidenceSettings from '../../ResidenceSettings.vue';
import { nativeResidenceClient } from '../../native-residence-client.js';
definePage(() => ({ title: $locale.value.sfc.title, icon: 'ti ti-map-pin' }));
</script>
<locale lang="json" locale="ja-JP">
{"title":"支払い用の居住地"}
</locale>
