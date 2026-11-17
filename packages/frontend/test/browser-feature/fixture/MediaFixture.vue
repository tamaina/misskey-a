<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<main>
	<h1>Media visibility — isolated component fixture</h1>
	<MkCwButton v-model="show" text="Content warning" :files="files"/>
	<section v-show="show" id="cw-content">
		<MkMediaList ref="list" :mediaList="files"/>
	</section>
	<div id="resize-probe"><MkBlurhash :blurhash="hash" :width="size" :height="100"/></div>
	<div id="average-probe"><MkBlurhash :blurhash="hash" :width="size" :height="100" onlyAvgColor/></div>
	<div v-if="popup" id="popup"><component :is="popup.component" v-bind="popup.props" v-on="popup.events"/></div>
</main>
</template>
<script setup>
import { ref } from 'vue';
import MkCwButton from '@features/notes/frontend/components/MkCwButton.vue';
import MkMediaList from '@features/drive/frontend/components/MkMediaList.vue';
import MkBlurhash from '@features/drive/frontend/components/MkBlurhash.vue';
import { popup } from './media-adapters.js';
const show = ref(false);
const size = ref(100);
const list = ref();
const hash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const files = ['ordinary', 'sensitive', 'visible'].map((id, index) => {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="400" height="240" fill="${['#aa4433', '#338855', '#3366aa'][index]}"/><text x="30" y="130" fill="white" font-size="36">${id}</text></svg>`;
	const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
	return { id, name: `${id}.svg`, url, thumbnailUrl: url, type: 'image/svg+xml', isSensitive: index === 1, blurhash: hash, properties: { width: 400, height: 240 }, size: 100, comment: id };
});
window.mediaFixture = { resize: value => { size.value = value; }, close: () => { popup.value = null; }, open: id => list.value.openGallery(id) };
</script>
<style scoped>
main { max-width: 720px; margin: auto; padding: 16px; }
#cw-content { margin-top: 16px; }
#resize-probe, #average-probe { width: 100px; height: 100px; display: inline-block; margin: 16px; }
</style>
