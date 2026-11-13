/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createSSRApp, defineComponent, h, isVNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, test, vi } from 'vitest';
import { createMfmRenderer } from '../../frontend/shared/mfm-renderer.js';
import type { VNode } from 'vue';
import type { MfmBaseProps, MfmRendererConfig } from '../../frontend/shared/mfm-renderer.js';

vi.mock('@features/boot/frontend/shared/config.js', () => ({ host: 'synthetic.invalid' }));
const component = (name: string) => defineComponent({ name, setup: () => () => h('span') });
const components = { Url: component('Url'), Link: component('Link'), Mention: component('Mention'), A: component('A'), Time: component('Time'), Emoji: component('Emoji'), CustomEmoji: component('CustomEmoji'), Code: component('Code'), CodeInline: component('CodeInline'), Search: component('Search'), Sparkle: component('Sparkle') };

function render(text: string, config: Partial<MfmRendererConfig> = {}, props: Partial<MfmBaseProps> = {}) {
	const emit = vi.fn();
	const node = createMfmRenderer({ components: () => components, ...config })({ text, ...props }, { emit });
	const nodes: VNode[] = [];

	function visit(value: unknown): void {
		if (isVNode(value)) {
			nodes.push(value);
			visit(value.children);
		} else if (Array.isArray(value)) value.forEach(visit);
	}

	visit(node);
	return { node, nodes, emit };
}

describe('shared MFM renderer', () => {
	test('renders raw text safely and preserves line breaks', async () => {
		const { node } = render('<img src=x onerror=alert(1)>\nsecond');
		const html = await renderToString(createSSRApp({ render: () => node }));
		expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;<br>second');
		expect(html).not.toContain('<img');
		expect(render('').node).toBeUndefined();
	});

	test('keeps embedded code and search fallback without full application components', async () => {
		const { Code: _code, CodeInline: _inline, Search: _search, Sparkle: _sparkle, ...embedded } = components;
		const { node } = render('```js\n<script>\n```\n`inline`\nquery 検索', { components: () => embedded });
		const html = await renderToString(createSSRApp({ render: () => node }));
		expect(html).toContain('<code lang="js">&lt;script&gt;');
		expect(html).toContain('<code>inline</code>');
		expect(html).toContain('<div>query</div>');
	});

	test('uses supplied parsed AST and component callbacks', () => {
		const provider = vi.fn(() => components);
		const { nodes } = render('ignored', { components: provider }, { parsedNodes: [{ type: 'inlineCode', props: { code: 'provided' } }] });
		expect(provider).toHaveBeenCalledOnce();
		expect(nodes.find(node => node.type === components.CodeInline)?.props?.code).toBe('provided');
	});

	test('reads changed animation preferences on every render and preserves legacy class', () => {
		let enabled = true;
		const renderer = createMfmRenderer({ components: () => components, getOptions: () => ({ advancedMfm: enabled, animatedMfm: enabled }) });
		const emit = vi.fn();
		const first = renderer({ text: '$[rainbow text]' }, { emit });
		expect((first?.children as VNode[])[0].props?.style).toContain('animation: mfm-rainbow');
		enabled = false;
		const second = renderer({ text: '$[rainbow text]' }, { emit });
		expect((second?.children as VNode[])[0].props?.class).toBe('_mfm_rainbow_fallback_');
	});

	test('gates navigation and emoji menu props by the adapter capability', () => {
		const props = { text: '', linkNavigationBehavior: 'window', enableEmojiMenu: true, enableEmojiMenuReaction: true };
		const full = createMfmRenderer<typeof props>({ components: () => components, supports: { navigationBehavior: true, emojiMenu: true } });
		const embedded = createMfmRenderer<typeof props>({ components: () => components });
		for (const [renderer, supported] of [[full, true], [embedded, false]] as const) {
			const node = renderer({ ...props, text: 'https://example.invalid :test:' }, { emit: vi.fn() });
			const children = node?.children as VNode[];
			expect(children.find(child => child.type === components.Url)?.props?.navigationBehavior).toBe(supported ? 'window' : undefined);
			expect(children.find(child => child.type === components.CustomEmoji)?.props?.menuReaction).toBe(supported ? true : undefined);
		}
	});

	test('does not offer remote custom emoji as a reaction', () => {
		const { nodes } = render(':remote:', { supports: { emojiMenu: true } }, { author: { host: 'remote.invalid' } as MfmBaseProps['author'], emojiUrls: { remote: 'https://remote.invalid/emoji.png' } });
		const emoji = nodes.find(node => node.type === components.CustomEmoji);
		expect(emoji?.props?.menuReaction).toBe(false);
		expect(emoji?.props?.host).toBe('remote.invalid');
	});

	test('clickable MFM emits the named event and prevents link propagation', () => {
		const { nodes, emit } = render('$[clickable.ev=example press]');
		const clickable = nodes.find(node => node.props?.onClick);
		const event = { stopPropagation: vi.fn(), preventDefault: vi.fn() };
		clickable?.props?.onClick(event);
		expect(emit).toHaveBeenCalledWith('clickEv', 'example');
		expect(event.stopPropagation).toHaveBeenCalledOnce();
		expect(event.preventDefault).toHaveBeenCalledOnce();
	});
});
