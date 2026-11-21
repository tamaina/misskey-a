<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<iframe v-show="body" ref="frame" sandbox="allow-same-origin" referrerpolicy="no-referrer" :title="$locale.sfc.title" :srcdoc="cardDocument" :class="$style.frame" :style="{ height: height + 'px' }" @load="loaded"></iframe>
<Teleport v-if="body" :to="body"><slot :isolated="true"/></Teleport>
<slot v-else :isolated="false"/>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watchEffect } from 'vue';
import { cardStyles } from '../anki-card-css.js';

const props = defineProps<{ css: string; forceLight?: boolean }>();
const frame = ref<HTMLIFrameElement>();
const body = shallowRef<HTMLElement>();
const height = ref(40);
// This document is constant. Source markup, URLs, and CSS never enter srcdoc.
const cardDocument = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; base-uri 'none'; form-action 'none'"><style>
html,body{margin:0}body{box-sizing:border-box;padding:4px;overflow-wrap:anywhere;color:var(--card-fg);background:var(--card-bg)}
img,audio{max-width:100%}pre{overflow-x:auto}[data-fukushu-cloze=blank]{display:inline-block;border:1px solid;min-width:3em;text-align:center}
[data-fukushu-cloze=label]{font-weight:bold}[data-fukushu-cloze=hint]{font-size:.75em}
</style><style id="card-rules"></style></head><body class="card"></body></html>`;
let sizeObserver: ResizeObserver | undefined;
let themeObserver: MutationObserver | undefined;

function syncTheme() {
	const target = body.value;
	if (!target || !frame.value) return;
	const host = getComputedStyle(frame.value);
	target.style.setProperty('--card-fg', props.forceLight ? '#222' : host.color);
	target.style.setProperty('--card-bg', props.forceLight ? '#fff' : host.getPropertyValue('--MI_THEME-panel'));
	target.style.fontFamily = host.fontFamily;
	const dark = !props.forceLight && window.document.documentElement.dataset.colorScheme === 'dark';
	target.classList.toggle('nightMode', dark);
	target.ownerDocument.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function loaded() {
	sizeObserver?.disconnect();
	themeObserver?.disconnect();
	const doc = frame.value?.contentDocument;
	// Ignore the initial about:blank document and provide the normal text fallback.
	body.value = doc?.getElementById('card-rules') ? doc.body : undefined;
	const target = body.value;
	if (!target) return;
	sizeObserver = new ResizeObserver(() => {
		height.value = Math.max(40, Math.min(1024, Math.ceil(target.getBoundingClientRect().height)));
	});
	sizeObserver.observe(target);
	themeObserver = new MutationObserver(syncTheme);
	themeObserver.observe(window.document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-color-scheme'] });
}

watchEffect(() => {
	const style = body.value?.ownerDocument.getElementById('card-rules');
	if (style) style.textContent = cardStyles(props.css);
	syncTheme();
});

onBeforeUnmount(() => { sizeObserver?.disconnect(); themeObserver?.disconnect(); });
</script>
<style module>
.frame { display: block; width: 100%; border: 0; color: inherit; font-family: inherit; }
</style>
<locale locale="ja-JP" lang="json">
{ "title": "Anki カード" }
</locale>
<locale locale="en-US" lang="json">
{ "title": "Anki card" }
</locale>
