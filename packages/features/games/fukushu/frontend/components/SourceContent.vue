<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div :class="[$style.content, content.format === 'markdown' && $style.markdown]">
	<SourceAnkiFrame v-if="anki && (anki.ankiCss || anki.ankiForceLight)" v-slot="{ isolated }" :css="anki.ankiCss ?? ''" :forceLight="anki.ankiForceLight">
		<RenderContent :isolated="isolated"/>
	</SourceAnkiFrame>
	<RenderContent v-else/>
</div>
</template>
<script setup lang="ts">
import { marked } from 'marked';
import { computed, h, shallowRef, watch } from 'vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import SourceAnkiFrame from './SourceAnkiFrame.vue';
import SourceMathText from './SourceMathText.vue';
import type { VNodeChild } from 'vue';
import type { Content } from '../source-study.js';

const props = defineProps<{ content: Content; anki?: { ankiCss?: string; ankiForceLight?: boolean } }>();
const clozeRoles = ['blank', 'label', 'hint'] as const;
const allowed = new Set('p br b strong mark details summary i em u s sub sup ruby rt rp ul ol li span div table thead tbody tr th td blockquote pre code hr h1 h2 h3 h4 h5 h6'.split(' '));
const blocked = new Set('style script iframe frame object embed link svg math template noscript form video'.split(' '));
const mediaId = /^fukushu-media:([a-f0-9]{64})$/;
const mime = /^(?:image\/(?:png|jpeg|gif|webp|avif)|audio\/(?:mpeg|ogg|wav|x-wav|mp4|webm|flac))$/i;
const parsed = computed(() => {
	if (props.content.format !== 'html' && props.content.format !== 'markdown') return null;
	const template = window.document.createElement('template');
	template.innerHTML = props.content.format === 'markdown'
		? marked.parse(props.content.value, { async: false })
		: props.content.value;
	return template.content;
});
const sources = shallowRef(new Map<string, string>());
watch(parsed, async (fragment, _, cleanup) => {
	const controller = new AbortController();
	cleanup(() => controller.abort());
	const found = new Map<string, string>();
	sources.value = found;
	if (!fragment) return;
	const ids = new Set([...fragment.querySelectorAll('img[src],audio[src],audio source[src]')]
		.flatMap(el => mediaId.exec(el.getAttribute('src') ?? '')?.slice(1) ?? []));
	for (const id of ids) {
		if (controller.signal.aborted) return;
		try {
			const data = await misskeyApi('fukushu/upstream/media', { id }, undefined, controller.signal);
			if (controller.signal.aborted) return;
			if (mime.test(data.mimeType)) found.set(id, 'data:' + data.mimeType + ';base64,' + data.base64);
			sources.value = new Map(found);
		} catch { /* Keep the original media's text alternative. */ }
	}
}, { immediate: true });

function mathText(text: string): VNodeChild {
	return text.includes('\\(') || text.includes('\\[') || text.includes('$$') ? h(SourceMathText, { text }) : text;
}

function renderNode(node: Node, isolated: boolean): VNodeChild {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent ?? '';
		return node.parentElement?.closest('code,pre') ? text : mathText(text);
	}
	if (!(node instanceof Element) && node.nodeType !== Node.ELEMENT_NODE) return null;
	const el = node as Element;
	const tag = el.localName.toLowerCase();
	if (blocked.has(tag)) return null;
	if (tag === 'img' || tag === 'audio') {
		const raw = el.getAttribute('src') ?? (tag === 'audio' ? el.querySelector('source')?.getAttribute('src') : '') ?? '';
		const id = mediaId.exec(raw)?.[1];
		const src = id ? sources.value.get(id) : /^data:(image\/(?:png|jpeg|gif|webp|avif)|audio\/(?:mpeg|wav|x-wav|ogg|mp4|webm|flac));base64,[a-zA-Z0-9+/=\s]+$/i.test(raw) ? raw : '';
		const alt = el.getAttribute('alt') || (tag === 'img' ? $locale.value.sfc.image : $locale.value.sfc.audio);
		if (!src?.startsWith(tag === 'img' ? 'data:image/' : 'data:audio/')) return h('span', alt);
		return tag === 'img' ? h('img', { src, alt }) : h('audio', { src, controls: true, preload: 'metadata', 'aria-label': alt });
	}
	const children = [...node.childNodes].map(child => renderNode(child, isolated));
	const attributes = isolated ? { class: el.getAttribute('class'), id: el.getAttribute('id') } : {};
	if (tag === 'span' && el.hasAttribute('class')) {
		const role = clozeRoles.find(role => el.classList.contains('cloze-' + role));
		return h('span', { ...attributes, 'data-fukushu-cloze': role }, children);
	}
	return allowed.has(tag) ? h(tag, attributes, children) : children;
}

function RenderContent({ isolated = false }: { isolated?: boolean }): VNodeChild {
	return parsed.value ? [...parsed.value.childNodes].map(node => renderNode(node, isolated)) : mathText(props.content.value);
}
</script>
<style module>
.content { white-space: pre-wrap; overflow-wrap: anywhere; }
.markdown { white-space: normal; max-width: 100%; overflow-x: auto; }
.markdown > * + * { margin-block-start: .6em; }
.markdown :global(table) { border-collapse: collapse; }
.markdown :global(th), .markdown :global(td) {
	padding: .3em .65em;
	border: 1px solid var(--MI_THEME-divider);
	text-align: start;
}
.markdown :global(pre) { overflow-x: auto; white-space: pre; }
.markdown > :first-child { margin-block-start: 0; }
.markdown > :last-child { margin-block-end: 0; }
.content :global([data-fukushu-cloze="blank"]) {
	display: inline-flex;
	align-items: baseline;
	justify-content: center;
	gap: .35em;
	min-width: 3em;
	padding-inline: .4em;
	border: 1px solid currentColor;
	border-radius: 2px;
}
.content :global([data-fukushu-cloze="label"]) { font-weight: bold; }
.content :global([data-fukushu-cloze="hint"]) { font-size: .75em; }
.content :global(audio) { display: block; margin-block: 6px; }
.content :global(img), .content :global(audio) { max-width: 100%; }
</style>
<locale locale="ja-JP" lang="json">
{
	"image": "画像",
	"audio": "音声"
}
</locale>
<locale locale="en-US" lang="json">
{
	"image": "Image",
	"audio": "Audio"
}
</locale>
