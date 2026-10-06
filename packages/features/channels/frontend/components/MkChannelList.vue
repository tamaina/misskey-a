<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :paginator="paginator">
	<template #empty><MkResult type="empty"/></template>

	<template #default="{ items }">
		<MkChannelPreview v-for="item in items" :key="item.id" class="_margin" :channel="extractor(item)"/>
	</template>
</MkPagination>
</template>

<script lang="ts" setup generic="P extends IPaginator">
import * as Misskey from 'misskey-js';
import type { IPaginator, ExtractorFunction } from '@features/ui/frontend/utility/paginator.js';
import MkChannelPreview from '@features/channels/frontend/components/MkChannelPreview.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';

const props = withDefaults(defineProps<{
	paginator: P;
	noGap?: boolean;
	extractor?: ExtractorFunction<P, Misskey.entities.Channel>;
}>(), {
	extractor: (item: any) => item as Misskey.entities.Channel,
});
</script>
