/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createComponentLocale, createComponentLocalizer } from 'vite-vue-internationalization/runtime';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkUploaderItems from '@features/drive/frontend/components/MkUploaderItems.vue';
import MkUploaderDialog from '@features/drive/frontend/components/MkUploaderDialog.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';
import { createApp, nextTick, ref } from 'vue';
import { parse } from 'vue/compiler-sfc';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/vue';
import { languages, locales } from 'i18n';
import { I18n } from '../../../frontend-shared/js/i18n.js';
import { applyWithLocale } from '../../../frontend-builder/locale-inliner/apply-with-locale.js';
import { blankLogger } from '../../../frontend-builder/logger.js';
import type { UploaderItem } from '@features/drive/frontend/composables/use-uploader.js';
import type { Locale, ParameterizedString } from 'i18n';

const actions = vi.hoisted(() => ({
	confirm: vi.fn(), abortAll: vi.fn(), upload: vi.fn(), addFiles: vi.fn(), close: vi.fn(),
	popupMenu: vi.fn(), contextMenu: vi.fn(), popupAsyncWithDialog: vi.fn(), dispose: vi.fn(),
}));

const uploaderState = {
	items: ref<UploaderItem[]>([]), uploading: ref(false), readyForUpload: ref(true), allItemsUploaded: ref(false),
	abortAll: actions.abortAll, upload: actions.upload, addFiles: actions.addFiles,
	getMenu: () => [],
};

vi.mock('@features/drive/frontend/composables/use-uploader.js', () => ({
	useUploader: () => uploaderState,
	getUploadName: (item: UploaderItem) => item.name + (item.name.endsWith(item.suffix) ? '' : item.suffix),
}));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => ({ policies: { maxFileSizeMb: 10 } }) }));
vi.mock('@features/ui/frontend/os.js', () => actions);
vi.mock('@features/media/frontend/utility/lightbox.js', () => ({
	isPreviewable: (type: string) => type.startsWith('image/'), getType: () => 'image',
}));
vi.mock('@features/media/frontend/components/MkLightbox.vue', () => ({ default: {} }));
vi.mock('@features/ui/frontend/components/MkButton.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_, { slots }) => () => h('button', slots.default?.()) }) };
});
vi.mock('@features/ui/frontend/components/MkModalWindow.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return {
		default: defineComponent({
			setup(_, { slots, emit, expose }) {
				expose({ close: actions.close });
				return () => h('div', [h('button', { 'data-testid': 'dismiss', onClick: () => emit('close') }, 'dismiss'), slots.header?.(), slots.default?.(), slots.footer?.()]);
			},
		}),
	};
});

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const componentPath = 'packages/features/drive/frontend/components/MkUploaderItems.vue';
const requireBuilder = createRequire(resolve(repoRoot, 'packages/frontend-builder/package.json'));
const MagicString = requireBuilder('magic-string').default;
const raw = createComponentLocale('/features/drive/frontend/components/MkUploaderItems.vue');
const keys = ['compressedToX', 'savedXPercent', 'preprocessing'] as const;

async function internationalization(language: string) {
	const instance = createInternationalization({ initialLocale: language });
	await instance.ready;
	await instance.loadLocale(language);
	return instance;
}

function productionFormat(message: string, values: { x: string | number }) {
	const source = new MagicString('format');
	applyWithLocale(source, [{ type: 'parameterized-function', begin: 0, end: 6, localizationKey: ['message'], localizedOnly: true }], 'en-US', { message } as unknown as Locale, blankLogger);
	return (runInNewContext(source.toString()) as (input: { x: string | number }) => unknown)(values);
}

function item(overrides: Partial<UploaderItem> = {}): UploaderItem {
	return {
		id: 'first', name: 'photo', suffix: '.png', progress: { max: 100, value: 10 }, thumbnail: null,
		preprocessing: true, preprocessProgress: 0.2, uploading: false, uploaded: null, uploadFailed: false,
		aborted: false, compressionLevel: 1, compressedSize: 75, file: new File([new Uint8Array(100)], 'photo.png', { type: 'image/png' }),
		objectUrl: 'blob:photo', watermarkPreset: null, watermarkLayers: null, imageFrameParams: null,
		...overrides,
	};
}

async function settle() {
	await Promise.resolve();
	await nextTick();
	await Promise.resolve();
}

const globalComponents = {
	MkCondensedLine: { template: '<span><slot/></span>' },
	MkLoading: { template: '<span data-testid="loading"/>' },
	MkSystemIcon: { props: ['type'], template: '<span :data-status="type"/>' },
	MkTip: { template: '<span><slot/></span>' },
};

beforeEach(() => {
	vi.clearAllMocks();
	uploaderState.items.value = [];
	uploaderState.uploading.value = false;
	uploaderState.readyForUpload.value = true;
	uploaderState.allItemsUploaded.value = false;
	actions.popupAsyncWithDialog.mockResolvedValue({ dispose: actions.dispose });
});
afterEach(cleanup);

describe('uploader locale-tag migration', () => {
	test('keeps all 84 decoded strings and reconstructs every original source byte', () => {
		const source = readFileSync(resolve(repoRoot, componentPath), 'utf8');
		const blocks = parse(source).descriptor.customBlocks.filter(block => block.type === 'locale');
		expect(blocks.map(block => block.attrs.locale)).toEqual(languages);
		let checked = 0;
		for (const block of blocks) {
			const locale = locales[block.attrs.locale as string];
			const dictionary = JSON.parse(block.content);
			expect(Object.keys(dictionary)).toEqual(keys);
			for (const key of keys) {
				const original = key === 'preprocessing' ? locale.preprocessing : locale._uploader[key];
				expect(Buffer.from(dictionary[key])).toEqual(Buffer.from(original));
				checked++;
			}
		}
		expect(checked).toBe(84);
		const original = source.split('\n<locale lang="json"')[0]
			.replace('import { interpolateLocaleParameters } from \'@features/runtime/frontend/interpolate-locale-parameters.js\';', 'import { i18n } from \'@features/runtime/frontend/i18n.js\';')
			.replace('interpolateLocaleParameters($locale.sfc.compressedToX, ', 'i18n.tsx._uploader.compressedToX(')
			.replace('interpolateLocaleParameters($locale.sfc.savedXPercent, ', 'i18n.tsx._uploader.savedXPercent(')
			.replace('$locale.sfc.preprocessing', 'i18n.ts.preprocessing');
		expect(createHash('sha256').update(original).digest('hex')).toBe('d0af9aae9171d12151d091601c6931ad9d15951c77f1a3365e402f1ee6d7e250');
	});

	test('loads all actual VVI dictionaries and agrees with both oracles on 392 formatter cases', async () => {
		let checks = 0;
		let rawChecks = 0;
		for (const language of languages) {
			(await internationalization(language)).install(createApp({}));
			for (const key of keys) {
				const message = key === 'preprocessing' ? locales[language].preprocessing : locales[language]._uploader[key];
				expect(raw[key]).toBe(message);
				rawChecks++;
				if (key === 'preprocessing') continue;
				for (const x of [0, 25, -1, 99.5, '123 KiB', NaN, Infinity]) {
					const legacy = new I18n({ message: message as ParameterizedString<'x'> }).tsx.message({ x });
					expect(interpolateLocaleParameters(raw[key], { x })).toBe(legacy);
					expect(productionFormat(message, { x })).toBe(legacy);
					checks++;
				}
			}
		}
		expect(rawChecks).toBe(84);
		expect(checks).toBe(392);
		(await internationalization('ca-ES')).install(createApp({}));
		expect(interpolateLocaleParameters(raw.savedXPercent, { x: 25 })).toBe('25% d\'estalvi ');
		const nativeFormatter = createComponentLocalizer('/features/drive/frontend/components/MkUploaderItems.vue').savedXPercent;
		if (typeof nativeFormatter !== 'function') throw new Error('Missing native formatter');
		expect(nativeFormatter({ x: 25 })).toBe('25% d\'estalvi');
	}, 30000);

	test('preserves repeated parameters and explicitly excludes known production coercion disagreements', () => {
		expect(interpolateLocaleParameters(' {x}|{x} d\'estalvi ', { x: '$&' })).toBe(' $&|$& d\'estalvi ');
		expect(interpolateLocaleParameters('{x}{x}', { x: 2 })).toBe('22');
		expect(productionFormat('{x}{x}', { x: 2 })).toBe(4);
		expect(interpolateLocaleParameters('{x}', { x: 2 })).toBe('2');
		expect(productionFormat('{x}', { x: 2 })).toBe(2);
	});

	test('preserves runtime edge/coercion contracts without applying native message syntax', () => {
		const cases: readonly (readonly [string, Record<string, unknown>])[] = [
			['{x}% d\'estalvi ', { x: 25 }], [' \t{x}\n', { x: 0 }], ['{x}/{x}', { x: '$&' }],
			['It\'s {x}; l\'apostrophe', { x: 'ok' }], ['one | {x} others', { x: 2 }], ['@.upper:foo {x}', { x: 'ok' }],
			['{"x"} {x}', { '"x"': 'quoted', x: 'ok' }], ['{0}/{0}', { 0: 9 }], ['{ x }', { ' x ': 'spaced' }],
			['{x}', { x: null }], ['{x}', {}], ['{x}', { x: false }], ['{x}', { x: 12n }],
			['{x}', { x: new Date('2024-01-01T00:00:00Z') }], ['{x}{x}', { x: 2 }],
			['{x}', { x: { [Symbol.toPrimitive](hint: string) { return hint === 'default' ? 'default' : 'string'; } } }],
			['{x}', { x: Symbol('x') }], ['{x}', { x: '{x}' }],
		];

		function outcome(run: () => unknown) {
			try { return { value: run() }; } catch (error) { return { error: (error as Error).name }; }
		}

		for (const [message, values] of cases) {
			// Deliberately probe out-of-contract inputs without widening the public API.
			const params = values as Record<string, string | number>;
			const legacy = new I18n({ message: message as ParameterizedString<string> });
			expect(outcome(() => interpolateLocaleParameters(message, params))).toEqual(outcome(() => legacy.tsx.message(params)));
		}
		expect(() => interpolateLocaleParameters('{unclosed', {})).toThrow('Unclosed locale parameter');
		let reads = 0;
		const parameters = { get x() { return ++reads; } };
		expect(interpolateLocaleParameters('{x}/{x}', parameters)).toBe('1/2');
		expect(reads).toBe(2);
	});

	test('mounts compression/progress states, repeats menu/preview, and removes then re-adds items', async () => {
		const first = item();
		const view = render(MkUploaderItems, {
			props: { items: [first] },
			global: { plugins: [await internationalization('ca-ES')], components: globalComponents, directives: { panel: {} } },
		});
		expect(view.container.textContent).toContain('(Comprimit a 75B = 25% d\'estalvi )');
		expect(view.container.textContent).toContain(locales['ca-ES'].preprocessing);
		expect(view.container.innerHTML).toContain('--p: 10%');
		expect(view.container.innerHTML).toContain('--pp: 20%');
		await fireEvent.click(view.getByRole('button'));
		await fireEvent.click(view.getByRole('button'));
		expect(view.emitted().showMenu).toHaveLength(2);
		const firstEmission = view.emitted().showMenu[0];
			if (!Array.isArray(firstEmission)) throw new Error('Missing menu event');
			expect(firstEmission[0]).toEqual(first);
		const row = view.container.querySelector('[style*="--p:"]')!;
		await fireEvent.contextMenu(row);
		expect(view.emitted().showMenuViaContextmenu).toHaveLength(1);
		const thumbnail = view.container.querySelector('[style*="background-image"]')!;
		await fireEvent.click(thumbnail);
		await settle();
		expect(actions.popupAsyncWithDialog).toHaveBeenCalledTimes(1);
		actions.popupAsyncWithDialog.mock.calls[0][2].closed();
		expect(actions.dispose).toHaveBeenCalledTimes(1);
		await fireEvent.click(thumbnail);
		await settle();
		expect(actions.popupAsyncWithDialog).toHaveBeenCalledTimes(2);
		actions.popupAsyncWithDialog.mock.calls[1][2].closed();
		expect(actions.dispose).toHaveBeenCalledTimes(2);
		await view.rerender({ items: [item({ preprocessing: false, uploading: true, progress: { max: 100, value: 80 }, compressedSize: null })] });
		expect(view.container.innerHTML).toContain('--p: 80%');
		expect(view.container.querySelector('[data-status="waiting"]')).not.toBeNull();
		expect(view.container.textContent).toContain(bytes(100));
		expect(view.container.textContent).not.toContain('estalvi');
		await view.rerender({ items: [item({ preprocessing: false, uploadFailed: true })] });
		expect(view.container.querySelector('[data-status="error"]')).not.toBeNull();
		await view.rerender({ items: [item({ preprocessing: false, uploaded: { id: 'uploaded' } as UploaderItem['uploaded'] })] });
		expect(view.container.querySelector('[data-status="success"]')).not.toBeNull();
		await view.rerender({ items: [] });
		expect(view.queryByRole('button')).toBeNull();
		await view.rerender({ items: [item({ id: 'second', name: 'renamed', compressedSize: 50 })] });
		expect(view.container.textContent).toContain('renamed.png');
		expect(view.container.textContent).toContain('50% d\'estalvi ');
	});

	test('keeps the unchanged parent dialog cancel-decline/accept and retry/progress behavior', async () => {
		uploaderState.items.value = [item({ preprocessing: false })];
		const view = render(MkUploaderDialog, {
			props: { files: [uploaderState.items.value[0].file] },
			global: { plugins: [await internationalization('ca-ES')], components: globalComponents, directives: { panel: {} } },
		});
		expect(actions.addFiles).toHaveBeenCalledTimes(1);
		expect(view.container.textContent).toContain('25% d\'estalvi ');
		actions.confirm.mockResolvedValueOnce({ canceled: true });
		await fireEvent.click(view.getByTestId('dismiss'));
		await settle();
		expect(actions.abortAll).not.toHaveBeenCalled();
		expect(actions.close).not.toHaveBeenCalled();
		expect(view.emitted().canceled).toBeUndefined();
		await fireEvent.click(view.getByRole('button', { name: locales['en-US'].upload }));
		expect(actions.upload).toHaveBeenCalledTimes(1);
		await fireEvent.click(view.getByRole('button', { name: locales['en-US'].retry }));
		expect(actions.upload).toHaveBeenCalledTimes(2);
		uploaderState.items.value[0].progress = { max: 100, value: 60 };
		await nextTick();
		expect(view.container.innerHTML).toContain('--op: 60%');
		expect(view.container.innerHTML).toContain('--p: 60%');
		actions.confirm.mockResolvedValueOnce({ canceled: false });
		await fireEvent.click(view.getByTestId('dismiss'));
		await settle();
		expect(actions.abortAll).toHaveBeenCalledTimes(1);
		expect(actions.close).toHaveBeenCalledTimes(1);
		expect(view.emitted().canceled).toHaveLength(1);
	});
});
