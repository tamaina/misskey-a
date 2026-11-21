<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<FormulaFallback v-if="isFormulaTooComplex(formula)" :formula="formula" :block="block"/>
<FormulaCore v-else :formula="formula" :block="block"/>
</template>
<script lang="ts">
import { defineAsyncComponent } from 'vue';
import FormulaFallback from './FormulaFallback.vue';
import { isFormulaTooComplex } from './formula-safety.js';

// A single async component shares its load across notes and both host adapters.
const FormulaCore = defineAsyncComponent({
	loader: () => import('./MkFormulaCore.vue').then(module => module.default, () => FormulaFallback),
	delay: 0,
	loadingComponent: FormulaFallback,
	errorComponent: FormulaFallback,
});
</script>
<script lang="ts" setup>
defineProps<{ formula: string; block: boolean }>();
</script>
