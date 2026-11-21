<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
Adapted from upstream PR #13112 hand-tiles.vue. Asset/source provenance: ../../README.md.
-->
<template>
<span :class="$style.tile" :title="label" role="img" :aria-label="label">
	<span :class="$style.tileInner">
		<span :class="$style.tileBg1"></span><span :class="$style.tileBg2"></span><span :class="$style.tileBg3"></span>
		<img v-if="face" :src="`/client-assets/mahjong/tiles/${face.t}${face.red ? 'r' : ''}.png`" :class="$style.tileFg1" alt=""/>
		<span :class="$style.tileFg2"></span>
	</span>
</span>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { coreTileToDisplay } from '../../shared/tiles.js';
const props = defineProps<{ tile: string }>();
const face = computed(() => coreTileToDisplay(props.tile));
const label = computed(() => face.value ? props.tile : '🀫');
</script>
<style module>
.tile { display: inline-block; vertical-align: bottom; position: relative; width: 30px; aspect-ratio: .7; }
.tileInner { display: block; position: relative; width: 100%; height: 100%; overflow: clip; border-radius: 4px; }
.tileBg1 { position: absolute; inset: 0; background: #E38A45; }
.tileBg2 { position: absolute; bottom: 0; left: 0; width: 100%; height: 95%; background: #DFDEDD; border-radius: 3px 3px 0 0; }
.tileBg2::after { content: ''; position: absolute; bottom: 78%; width: 100%; height: 6%; background: linear-gradient(0deg, #fff, #fff0); }
.tileBg3 { position: absolute; bottom: 0; left: 0; width: 100%; height: 75%; background: white; }
.tileFg1 { position: absolute; bottom: 5%; left: 0; width: 100%; height: 65%; object-fit: contain; pointer-events: none; }
.tileFg2 { position: absolute; inset: 0; box-shadow: 0 0 1px #000 inset; pointer-events: none; }
</style>
