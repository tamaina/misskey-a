/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import juice from 'juice';
import * as mfm from 'mfm-js';
import { createMfmRenderer } from '../frontend/shared/mfm-renderer.js';
import { mfmStyles } from '../frontend/shared/mfm-styles.js';
import type { FunctionalComponent } from 'vue';

export type StandaloneMfmOptions = {
	instanceUrl: string;
	locale?: string;
	timeZone?: string;
	animated?: boolean;
	emojiUrls?: Record<string, string>;
	theme?: Partial<Record<'fg' | 'bg' | 'accent' | 'hashtag' | 'divider', string>>;
	/** Trusted syntax highlighter; returns Vue nodes, never untrusted HTML. */
	highlight?: (code: string, language?: string) => Promise<string | ReturnType<typeof h>>;
};

export type StandaloneMfmResult = {
	html: string;
	css: string;
	resources: { url: string; kind: 'emoji' }[];
};

/** No network, stores, timers, DOM, or application component dependencies. */
export async function renderStandaloneMfm(text: string, options: StandaloneMfmOptions): Promise<StandaloneMfmResult> {
	const instance = new URL(options.instanceUrl);
	if (!['https:', 'http:'].includes(instance.protocol) || instance.username || instance.password) throw new Error('Invalid instance URL');
	const base = instance.origin;
	const theme = { fg: '#333333', bg: '#ffffff', accent: '#86b300', hashtag: '#ff9156', divider: '#dddddd', ...options.theme };
	for (const value of Object.values(theme)) {
		if (!/^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value)) throw new Error('Theme colors must be hexadecimal');
	}
	const safeUrl = (value: string | undefined, image = false): string | undefined => {
		if (typeof value !== 'string' || !value) return undefined;
		try {
			const url = new URL(value, base);
			return (image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:']).includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
		} catch { return undefined; }
	};
	const resources = new Map<string, { url: string; kind: 'emoji' }>();
	const ast = mfm.parse(text);
	const codeByKey = new Map<string, string | ReturnType<typeof h>>();
	const highlight = options.highlight;
	if (highlight) {
		const resolve = async (nodes: mfm.MfmNode[]): Promise<void> => {
			for (const node of nodes) {
				if (node.type === 'blockCode') {
					const result = await highlight(node.props.code, node.props.lang ?? undefined);
					codeByKey.set(JSON.stringify([node.props.code, node.props.lang ?? '']), result);
				}
				if ('children' in node && node.children) await resolve(node.children);
			}
		};
		await resolve(ast);
	}
	const Link: FunctionalComponent<{ url?: string; to?: string }> = (props, { slots }) => {
		const href = safeUrl(props.url ?? props.to);
		return h(href ? 'a' : 'span', href ? { href, rel: 'nofollow noopener noreferrer' } : {}, slots.default?.() ?? props.url ?? '');
	};
	const Emoji: FunctionalComponent<{ emoji: string }> = props => h('span', { class: 'mfm-emoji' }, props.emoji);
	const CustomEmoji: FunctionalComponent<{ name: string; url?: string; normal?: boolean }> = props => {
		const url = safeUrl(props.url ?? options.emojiUrls?.[props.name], true);
		if (!url) return h('span', `:${props.name}:`);
		resources.set(url, { url, kind: 'emoji' });
		return h('img', { class: props.normal ? 'mfm-custom-emoji mfm-emoji-normal' : 'mfm-custom-emoji', src: url, alt: `:${props.name}:`, draggable: 'false' });
	};
	const Mention: FunctionalComponent<{ username: string; host: string }> = props => {
		// Host is parsed as an authority, never as an arbitrary URL/path.
		const validHost = props.host === instance.host || /^[a-z\d.-]+(?::\d+)?$/i.test(props.host);
		const href = validHost ? safeUrl(`${props.host === instance.host ? base : `https://${props.host}`}/@${encodeURIComponent(props.username)}`) : undefined;
		return h(href ? 'a' : 'span', { href, class: 'mfm-mention', rel: 'nofollow noopener noreferrer' }, `@${props.username}${props.host === instance.host ? '' : `@${props.host}`}`);
	};
	const dateFormat = new Intl.DateTimeFormat(options.locale ?? 'en-US', { dateStyle: 'long', timeStyle: 'medium', timeZone: options.timeZone ?? 'UTC' });
	const Time: FunctionalComponent<{ time: number }> = props => {
		const date = new Date(props.time);
		return Number.isFinite(date.valueOf()) ? h('time', { datetime: date.toISOString() }, dateFormat.format(date)) : h('span', '?');
	};
	const Code: FunctionalComponent<{ code: string; lang?: string }> = props => h('pre', { class: 'mfm-code' }, [h('code', [codeByKey.get(JSON.stringify([props.code, props.lang ?? ''])) ?? props.code])]);
	const CodeInline: FunctionalComponent<{ code: string }> = props => h('code', { class: 'mfm-code-inline' }, props.code);
	const Search: FunctionalComponent<{ q: string }> = props => h('a', { href: `https://www.google.com/search?q=${encodeURIComponent(props.q)}`, rel: 'nofollow noopener noreferrer', class: 'mfm-search' }, `${props.q} 🔍`);
	const Sparkle: FunctionalComponent = (_, { slots }) => h('span', { class: 'mfm-sparkle' }, slots.default?.());
	const renderer = createMfmRenderer({
		host: instance.host,
		components: () => ({ Url: Link, Link, A: Link, Emoji, CustomEmoji, Mention, Time, Code, CodeInline, Search, Sparkle }),
		getOptions: () => ({ advancedMfm: true, animatedMfm: options.animated ?? true }),
	});
	const node = renderer({ text, parsedNodes: ast }, { emit: () => {} });
	let html = await renderToString(createSSRApp({ render: () => h('div', { class: 'misskey-mfm' }, [node]) }));
	// Resolve theme variables in inline styles as well as the shared stylesheet.
	const resolveTheme = (value: string) => value.replace(/var\(--MI_THEME-(fg|bg|accent|hashtag|divider)\)/g, (_, name: keyof typeof theme) => theme[name]);
	const css = resolveTheme(mfmStyles.replace(/^(\.[^{]+|:is[^\n{]+)\{/gm, '.misskey-mfm $1{') + `
.misskey-mfm { color: var(--MI_THEME-fg); background: var(--MI_THEME-bg); font-family: sans-serif; font-size: 14px; line-height: 1.5; overflow-wrap: anywhere; }
.misskey-mfm a { color: var(--MI_THEME-accent); text-decoration: none; }
.misskey-mfm .mfm-custom-emoji { height: 2em; max-width: 100%; vertical-align: middle; object-fit: contain; }
.misskey-mfm .mfm-emoji-normal { height: 1.25em; }
.misskey-mfm .mfm-emoji { font-size: 1.25em; vertical-align: middle; }
.misskey-mfm .mfm-code { display: block; padding: 1em; border: 1px solid var(--MI_THEME-divider); white-space: pre-wrap; overflow-wrap: anywhere; }
.misskey-mfm .mfm-code-inline { padding: .1em .3em; border-radius: .3em; background: #eeeeee; color: #333333; }
.misskey-mfm .mfm-mention { font-weight: bold; }
.misskey-mfm .mfm-sparkle { position: relative; display: inline-block; }
.misskey-mfm .mfm-sparkle::before, .misskey-mfm .mfm-sparkle::after { content: '✦'; position: absolute; color: #ffcc00; pointer-events: none; animation: mfm-sparkle 1.5s ease-in-out infinite; }
.misskey-mfm .mfm-sparkle::before { top: -.5em; left: 0; }
.misskey-mfm .mfm-sparkle::after { bottom: -.5em; right: 0; animation-delay: .75s; }
@keyframes mfm-sparkle { 0%, 100% { opacity: 0; transform: scale(.2); } 50% { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .misskey-mfm *, .misskey-mfm *::before, .misskey-mfm *::after { animation: none !important; } }
`);
	// Do not substitute theme-looking text in the user's prose or URL attributes.
	html = html.replace(/(<[^>]*\sstyle=")([^"]*)"/g, (_, prefix: string, style: string) => `${prefix}${resolveTheme(style)}"`);
	html = juice.inlineContent(html, css, { removeStyleTags: false, preserveMediaQueries: true, preserveKeyFrames: true, applyWidthAttributes: false, applyHeightAttributes: false });
	// Preserve effects/pseudo-elements even when the inliner cannot apply them.
	return { html: `<style>${css}</style>${html}`, css, resources: [...resources.values()] };
}
