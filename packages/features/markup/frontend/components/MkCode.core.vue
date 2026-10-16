<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- eslint-disable vue/no-v-html -->
<template>
<div
	:class="[$style.codeBlockRoot, {
		[$style.codeEditor]: codeEditor,
		[$style.outerStyle]: !codeEditor && withOuterStyle,
		[$style.dark]: darkMode,
		[$style.light]: !darkMode,
	}]" :style="maxHeight != null ? { maxHeight: `${maxHeight}px`, overflow: 'auto' } : undefined" v-html="html"></div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { bundledLanguagesInfo } from 'shiki/langs';
import type { BundledLanguage } from 'shiki/langs';
import { getHighlighter, getTheme } from '@features/markup/frontend/utility/code-highlighter.js';
import { getCodeDiff, codeDiffTransformer } from '../utility/code-diff.js';
import { store } from '@features/preferences/frontend/store.js';

const props = withDefaults(defineProps<{
	code: string;
	diffBase?: string;
	maxHeight?: number | null;
	lang?: string;
	codeEditor?: boolean;
	withOuterStyle?: boolean;
}>(), {
	codeEditor: false,
	withOuterStyle: true,
});

const highlighter = await getHighlighter();
const darkMode = store.r.darkMode;
const codeLang = ref<BundledLanguage | 'aiscript'>('js');

const [lightThemeName, darkThemeName] = await Promise.all([
	getTheme('light', true),
	getTheme('dark', true),
]);

const diffRows = computed(() => props.diffBase != null ? getCodeDiff(props.diffBase, props.code) : null);
const html = computed(() => highlighter.codeToHtml(diffRows.value ? diffRows.value.map(row => row.text).join('\n') : props.code, {
	transformers: diffRows.value ? [codeDiffTransformer(diffRows.value)] : [],
	lang: diffRows.value && !props.lang ? 'text' : codeLang.value,
	themes: {
		fallback: 'dark-plus',
		light: lightThemeName,
		dark: darkThemeName,
	},
	defaultColor: false,
	cssVariablePrefix: '--shiki-',
}));

async function fetchLanguage(to: string): Promise<void> {
	const language = to as BundledLanguage;

	// Check for the loaded languages, and load the language if it's not loaded yet.
	if (!highlighter.getLoadedLanguages().includes(language)) {
		// Check if the language is supported by Shiki
		const bundles = bundledLanguagesInfo.filter((bundle) => {
			// Languages are specified by their id, they can also have aliases (i. e. "js" and "javascript")
			return bundle.id === language || bundle.aliases?.includes(language);
		});
		if (bundles.length > 0) {
			if (_DEV_) console.log(`Loading language: ${language}`);
			await highlighter.loadLanguage(bundles[0].import);
			codeLang.value = language;
		} else {
			codeLang.value = 'js';
		}
	} else {
		codeLang.value = language;
	}
}

watch(() => props.lang, (to) => {
	if (codeLang.value === to || !to) return;
	return fetchLanguage(to);
}, { immediate: true });
</script>

<style module lang="scss">
.codeBlockRoot :global(.shiki) {
	overflow: auto;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;

	color: var(--shiki-fallback);

	& span {
		color: var(--shiki-fallback);
	}

	& pre,
	& code {
		font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	}
}

.outerStyle.codeBlockRoot :global(.shiki) {
	padding: 1em;
	margin: 0;
	border-radius: 8px;
	border: 1px solid var(--MI_THEME-divider);
	background-color: var(--shiki-fallback-bg);
}

.light.codeBlockRoot :global(.shiki) {
	color: var(--shiki-light);

	& span {
		color: var(--shiki-light);
	}
}

.light.outerStyle.codeBlockRoot :global(.shiki),
.light.codeEditor.codeBlockRoot :global(.shiki) {
	background-color: var(--shiki-light-bg);
}

.dark.codeBlockRoot :global(.shiki) {
	color: var(--shiki-dark);

	& span {
		color: var(--shiki-dark);
	}
}

.dark.outerStyle.codeBlockRoot :global(.shiki),
.dark.codeEditor.codeBlockRoot :global(.shiki) {
	background-color: var(--shiki-dark-bg);
}

.codeBlockRoot.codeEditor {
	min-width: 100%;
	height: 100%;

	& :global(.shiki) {
		padding: 12px;
		margin: 0;
		border-radius: 6px;
		border: none;
		min-height: 130px;
		pointer-events: none;
		min-width: calc(100% - 24px);
		height: 100%;
		display: inline-block;
		line-height: 1.5em;
		font-size: 1em;
		overflow: visible;
		text-rendering: inherit;
    text-transform: inherit;
    white-space: pre;

		& span {
			display: inline-block;
			min-height: 1em;
		}
	}
}

.codeBlockRoot :global(.diff) {
	display: inline-block;
	width: 100%;
	&:global(.add) { background: color-mix(in srgb, var(--MI_THEME-success) 18%, transparent); }
	&:global(.remove) { background: color-mix(in srgb, var(--MI_THEME-error) 18%, transparent); }
}

.codeBlockRoot :global(.diff-sign) {
	display: inline-block;
	width: 1.5em;
	user-select: none;
}

.codeBlockRoot :global(.diff-omit) {
	opacity: 0.6;
}
</style>
