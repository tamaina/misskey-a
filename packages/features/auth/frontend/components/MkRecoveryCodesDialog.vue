<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkModalWindow ref="dialog" :width="500" :height="450" @close="close" @esc="close" @closed="emit('closed')">
	<template #header>{{ $locale.sfc.title }}</template>
	<div class="_spacer _gaps">
		<MkInfo warn>{{ $locale.sfc.description }}</MkInfo>
		<div v-for="(code, i) in visibleCodes" :key="code" class="_gaps_s">
			<MkKeyValue :copy="code">
				<template #key>#{{ i + 1 }}</template>
				<template #value><code class="_monospace">{{ code }}</code></template>
			</MkKeyValue>
		</div>
		<div class="_buttonsCenter"><MkButton primary rounded gradate @click="close">{{ $locale.sfc.close }}</MkButton></div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref, useTemplateRef } from 'vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';

const props = defineProps<{ codes: string[] }>();
const emit = defineEmits<{ closed: [] }>();
const visibleCodes = ref([...props.codes]);
const dialog = useTemplateRef('dialog');

function close() { visibleCodes.value = []; dialog.value?.close(); }

onBeforeUnmount(() => { visibleCodes.value = []; });
</script>

<locale locale="ja-JP" lang="json">
{
	"title": "バックアップコード",
	"description": "このコードは再表示できません。それぞれ一度だけ使えます。安全な場所に保存してから閉じてください。再生成すると以前のコードは使えなくなります。",
	"close": "完了"
}
</locale>
