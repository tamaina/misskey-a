<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<span ref="root">{{ text }}</span>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ text: string }>();
const root = ref<HTMLElement>();
const delimiters = [
	{ left: '\\(', right: '\\)', display: false },
	{ left: '\\[', right: '\\]', display: true },
	{ left: '$$', right: '$$', display: true },
];

watch([root, () => props.text], async ([target, value], _, cleanup) => {
	if (!target) return;
	target.textContent = value;
	if (value.length > 16_384) return;
	let active = true;
	cleanup(() => { active = false; });
	try {
		const { default: renderMath } = await import('katex/contrib/auto-render');
		if (!active) return;
		const container = window.document.createElement('span');
		container.textContent = value;
		let count = 0;
		renderMath(container, {
			delimiters, trust: false, output: 'mathml', throwOnError: true, strict: false,
			maxExpand: 1000, maxSize: 20, macros: {}, errorCallback: () => {},
			preProcess(source) {
				if (++count > 32 || source.length > 1000) throw new RangeError('Formula exceeds preview limit');
				return source;
			},
		});
		if (container.childElementCount && container.innerHTML.length <= 100_000) {
			target.replaceChildren(...container.childNodes);
		}
	} catch { /* Keep the original notation if unavailable or outside the preview budget. */ }
}, { flush: 'post' });
</script>
