<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<!-- Only KaTeX output with trust:false reaches innerHTML; input/errors use text interpolation. -->
<!-- eslint-disable vue/no-v-html -->
<div v-if="compiled !== null && block" :class="$style.block" v-html="compiled"></div>
<span v-else-if="compiled !== null" v-html="compiled"></span>
<FormulaFallback v-else :formula="formula" :block="block"/>
</template>
<script lang="ts" setup>
import { computed } from 'vue';
import katex from 'katex';
// Fixed KaTeX classes and fonts must remain global, but live in this lazy chunk.
import 'katex/dist/katex.min.css';
import FormulaFallback from './FormulaFallback.vue';
import { FORMULA_MAX_HTML_LENGTH, isFormulaTooComplex } from './formula-safety.js';

const props = defineProps<{ formula: string; block: boolean }>();
const compiled = computed((): string | null => {
	if (isFormulaTooComplex(props.formula)) return null;
	try {
		const html = katex.renderToString(props.formula, {
			displayMode: props.block,
			throwOnError: true,
			strict: true,
			trust: false,
			maxSize: 20,
			maxExpand: 1000,
			macros: {},
		});
		// Limit generated markup as well as source braces (e.g. unbraced roots/macros).
		return html.length <= FORMULA_MAX_HTML_LENGTH ? html : null;
	} catch {
		return null;
	}
});
</script>
<style lang="scss" module>
.block {
	max-width: 100%;
	overflow-x: auto;
}
</style>
