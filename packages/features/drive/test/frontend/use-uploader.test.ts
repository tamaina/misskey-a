/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp } from 'vue';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useUploader } from '@features/drive/frontend/composables/use-uploader.js';
import type { ImageFrameParams } from '@features/drive/frontend/utility/image-frame-renderer/ImageFrameRenderer.js';

const actions = vi.hoisted(() => ({
	watermarkRender: vi.fn(), watermarkDestroy: vi.fn(), watermarkOptions: vi.fn(),
	frameRender: vi.fn(), frameDestroy: vi.fn(), frameOptions: vi.fn(),
	compress: vi.fn(), animated: vi.fn(), upload: vi.fn(),
}));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => ({ policies: { watermarkAvailable: true } }) }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: { s: {
	watermarkPresets: [{ id: 'watermark', layers: [] }], defaultWatermarkPresetId: 'watermark',
	keepOriginalFilename: true, defaultImageCompressionLevel: 0, defaultVideoCompressionLevel: 0,
	imageFramePresets: [],
} } }));
vi.mock('@features/drive/frontend/ts-messages.vue', () => ({ default: { $locale: new Proxy({}, { get: (_, key) => key }) } }));
vi.mock('@features/ui/frontend/os.js', () => ({}));
vi.mock('@features/drive/frontend/utility/lightbox.js', () => ({ isPreviewable: () => true, getType: () => 'image' }));
vi.mock('@features/drive/frontend/utility/isWebpSupported.js', () => ({ isWebpSupported: () => true }));
vi.mock('@misskey-dev/browser-image-resizer', () => ({ readAndCompressImage: actions.compress }));
vi.mock('is-file-animated', () => ({ default: actions.animated }));
vi.mock('exifreader', () => ({ load: async () => ({ Model: { description: 'Camera' } }) }));
vi.mock('@features/drive/frontend/utility/drive.js', () => ({ uploadFile: actions.upload, UploadAbortedError: class extends Error {} }));
vi.mock('@features/drive/frontend/utility/watermark/WatermarkRenderer.js', () => ({ WatermarkRenderer: class {
	constructor(options: unknown) { actions.watermarkOptions(options); }
	render(layers: unknown) { return actions.watermarkRender(layers); }
	destroy() { actions.watermarkDestroy(); }
} }));
vi.mock('@features/drive/frontend/utility/image-frame-renderer/ImageFrameRenderer.js', () => ({ ImageFrameRenderer: class {
	constructor(options: unknown) { actions.frameOptions(options); }
	render(params: unknown) { return actions.frameRender(params); }
	destroy() { actions.frameDestroy(); }
} }));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
	return { promise, resolve, reject };
}

const frame: ImageFrameParams = {
	borderThickness: 10, labelTop: { enabled: false, scale: 1, padding: 1, textBig: '', textSmall: '', centered: false, withQrCode: false },
	labelBottom: { enabled: false, scale: 1, padding: 1, textBig: '', textSmall: '', centered: false, withQrCode: false },
	bgColor: [0, 0, 0], fgColor: [1, 1, 1], font: 'serif', borderRadius: 0,
};
const bitmaps: { width: number; height: number; close: ReturnType<typeof vi.fn> }[] = [];
const apps: ReturnType<typeof createApp>[] = [];
let canvasCallbacks: BlobCallback[];
let createUrl: ReturnType<typeof vi.fn<(object: Blob | MediaSource) => string>>;
let consoleError: ReturnType<typeof vi.spyOn>;

function uploader(watermark = true) {
	let instance!: ReturnType<typeof useUploader>;
	const app = createApp({ setup() { instance = useUploader({ features: { watermark } }); return () => null; } });
	app.mount(window.document.createElement('div'));
	apps.push(app);
	return instance;
}

function file() { return new File([new Uint8Array(100)], 'photo.png', { type: 'image/png' }); }

async function settled(item: ReturnType<typeof useUploader>['items']['value'][number]) {
	await vi.waitFor(() => expect(item.preprocessing).toBe(false));
}

function compressMenu(instance: ReturnType<typeof useUploader>, level = 1) {
	for (const entry of instance.getMenu(instance.items.value[0])) {
		if (!('type' in entry) || entry.type !== 'parent' || !Array.isArray(entry.children)) continue;
		const choices = entry.children.filter(child => 'type' in child && child.type === 'radioOption');
		const choice = choices[level];
		if (!choice || !('type' in choice) || choice.type !== 'radioOption') continue;
		choice.action(new PointerEvent('click'));
		return;
	}
	throw new Error('Compression menu missing');
}

beforeEach(() => {
	vi.resetAllMocks();
	bitmaps.length = 0;
	canvasCallbacks = [];
	actions.watermarkRender.mockResolvedValue(undefined);
	actions.frameRender.mockResolvedValue(undefined);
	actions.animated.mockResolvedValue(false);
	actions.compress.mockResolvedValue(new Blob(['c'], { type: 'image/webp' }));
	vi.stubGlobal('createImageBitmap', vi.fn(async () => {
		const bitmap = { width: 100, height: 80, close: vi.fn() };
		bitmaps.push(bitmap);
		return bitmap;
	}));
	createUrl = vi.fn(() => `blob:${createUrl.mock.calls.length}`);
	vi.spyOn(URL, 'createObjectURL').mockImplementation(createUrl);
	vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
	vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => { canvasCallbacks.push(callback); });
	consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
	for (const app of apps.splice(0)) app.unmount();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('uploader image preprocessing resource lifetime', () => {
	test('keeps borrowed bitmap/renderer alive through export, then releases them and uploads the resulting blob with metadata', async () => {
		const instance = uploader();
		instance.addFiles([file()]);
		const item = instance.items.value[0];
		await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(1));
		expect(bitmaps[0].close).not.toHaveBeenCalled();
		expect(actions.watermarkDestroy).not.toHaveBeenCalled();
		const result = new Blob(['watermarked'], { type: 'image/png' });
		canvasCallbacks[0](result);
		await settled(item);
		expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
		expect(actions.watermarkDestroy).toHaveBeenCalledTimes(1);
		expect(item.preprocessedFile).toBe(result);
		item.caption = 'caption'; item.isSensitive = true;
		const uploaded = { id: 'uploaded' };
		actions.upload.mockReturnValue({ filePromise: Promise.resolve(uploaded), abort: vi.fn() });
		await instance.upload();
		expect(actions.upload).toHaveBeenCalledWith(result, expect.objectContaining({ name: 'photo.png', caption: 'caption', isSensitive: true }));
		expect(instance.items.value[0].uploaded).toEqual(uploaded);
	});

	test('null canvas export rejects the promise, releases resources and allows retry', async () => {
		const instance = uploader(); instance.addFiles([file()]);
		const item = instance.items.value[0];
		await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(1));
		expect(() => canvasCallbacks[0](null)).not.toThrow();
		await settled(item);
		expect(consoleError).toHaveBeenCalledWith('Failed to preprocess image', expect.objectContaining({ message: 'Failed to convert canvas to blob' }));
		expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
		expect(actions.watermarkDestroy).toHaveBeenCalledTimes(1);
		expect(item.preprocessedFile).toBeUndefined();
		compressMenu(instance);
		await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(2));
		canvasCallbacks[1](new Blob(['retry'], { type: 'image/png' }));
		await settled(item);
		expect(item.preprocessedFile?.type).toBe('image/webp');
		expect(item.suffix).toBe('.webp');
		expect(actions.compress).toHaveBeenCalledWith(expect.any(Blob), { mimeType: 'image/webp', maxWidth: 2000, maxHeight: 2000, quality: 0.85 });
	});

	test('render rejection releases resources without replacing the original error, even if cleanup throws', async () => {
		const original = new Error('render failed');
		actions.watermarkRender.mockRejectedValue(original);
		actions.watermarkDestroy.mockImplementation(() => { throw new Error('cleanup failed'); });
		const instance = uploader(); instance.addFiles([file()]);
		await settled(instance.items.value[0]);
		expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
		expect(actions.watermarkDestroy).toHaveBeenCalledTimes(1);
		expect(consoleError).toHaveBeenCalledWith('Failed to preprocess image', original);
	});

	test('renderer construction failure closes the owned bitmap without claiming a renderer instance', async () => {
		const original = new Error('WebGL unavailable');
		actions.watermarkOptions.mockImplementationOnce(() => { throw original; });
		const instance = uploader(); instance.addFiles([file()]);
		await settled(instance.items.value[0]);
		expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
		expect(actions.watermarkDestroy).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalledWith('Failed to preprocess image', original);
	});

	test('synchronous canvas export failure settles with the original error and releases resources', async () => {
		const original = new Error('canvas export failed');
		vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementationOnce(() => { throw original; });
		const instance = uploader(); instance.addFiles([file()]);
		await settled(instance.items.value[0]);
		expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
		expect(actions.watermarkDestroy).toHaveBeenCalledTimes(1);
		expect(consoleError).toHaveBeenCalledWith('Failed to preprocess image', original);
	});

	test.each(['reset', 'remove', 'unmount'])('%s during export releases only after consumption finishes and creates no late preview URL', async operation => {
		const instance = uploader(); instance.addFiles([file()]);
		const item = instance.items.value[0];
		await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(1));
		if (operation === 'reset') instance.reset();
		else if (operation === 'remove') instance.removeItem(item);
		else apps.pop()!.unmount();
		expect(bitmaps[0].close).not.toHaveBeenCalled();
		canvasCallbacks[0](new Blob(['late'], { type: 'image/png' }));
		await vi.waitFor(() => expect(bitmaps[0].close).toHaveBeenCalledTimes(1));
		expect(actions.watermarkDestroy).toHaveBeenCalledTimes(1);
		expect(createUrl).toHaveBeenCalledTimes(1);
		expect(item.preprocessedFile).toBeUndefined();
		expect(consoleError).not.toHaveBeenCalled();
	});

	test('cancel and retry while old rendering is pending does not clear or replace the new attempt', async () => {
		const rendering = deferred<void>();
		actions.watermarkRender.mockReturnValueOnce(rendering.promise);
		const instance = uploader(); instance.addFiles([file()]);
		const item = instance.items.value[0];
		await vi.waitFor(() => expect(actions.watermarkRender).toHaveBeenCalledTimes(1));
		const oldCancel = item.abortPreprocess!;
		instance.abortAll();
		expect(bitmaps[0].close).not.toHaveBeenCalled();
		compressMenu(instance);
		await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(1));
		oldCancel();
		expect(item.abortPreprocess).not.toBeNull();
		expect(item.preprocessing).toBe(true);
		rendering.resolve();
		await vi.waitFor(() => expect(bitmaps[0].close).toHaveBeenCalledTimes(1));
		expect(item.preprocessing).toBe(true);
		expect(canvasCallbacks).toHaveLength(1);
		canvasCallbacks[0](new Blob(['new'], { type: 'image/png' }));
		await settled(item);
		expect(bitmaps[1].close).toHaveBeenCalledTimes(1);
		expect(createUrl).toHaveBeenCalledTimes(2);
		expect(item.preprocessedFile?.type).toBe('image/webp');
	});

	test('cancellation while decoding waits for the owned bitmap and never starts rendering', async () => {
		const decoding = deferred<ImageBitmap>();
		vi.mocked(window.createImageBitmap).mockReturnValueOnce(decoding.promise);
		const instance = uploader(); instance.addFiles([file()]);
		const item = instance.items.value[0];
		instance.abortAll();
		const bitmap = { width: 100, height: 80, close: vi.fn() };
		decoding.resolve(bitmap as unknown as ImageBitmap);
		await vi.waitFor(() => expect(bitmap.close).toHaveBeenCalledTimes(1));
		expect(actions.watermarkOptions).not.toHaveBeenCalled();
		expect(item.preprocessedFile).toBeUndefined();
		expect(item.preprocessing).toBe(false);
		expect(createUrl).toHaveBeenCalledTimes(1);
	});

	test('cancellation while compressing cannot commit the late blob or filename suffix', async () => {
		const compression = deferred<Blob>();
		actions.compress.mockReturnValueOnce(compression.promise);
		const instance = uploader(false); instance.addFiles([file()]);
		const item = instance.items.value[0]; await settled(item);
		const original = item.preprocessedFile;
		compressMenu(instance);
		await vi.waitFor(() => expect(actions.compress).toHaveBeenCalledTimes(1));
		instance.abortAll();
		expect(bitmaps[1].close).not.toHaveBeenCalled();
		compression.resolve(new Blob(['c'], { type: 'image/webp' }));
		await vi.waitFor(() => expect(bitmaps[1].close).toHaveBeenCalledTimes(1));
		expect(item.preprocessedFile).toBe(original);
		expect(item.suffix).toBe('');
		expect(item.compressedSize).toBeNull();
		expect(createUrl).toHaveBeenCalledTimes(2);
	});

	test('decode failure settles and a new attempt succeeds', async () => {
		const original = new Error('decode failed');
		vi.mocked(window.createImageBitmap).mockRejectedValueOnce(original);
		const instance = uploader(false); instance.addFiles([file()]);
		const item = instance.items.value[0]; await settled(item);
		expect(consoleError).toHaveBeenCalledWith('Failed to preprocess image', original);
		expect(item.abortPreprocess).toBeNull();
		compressMenu(instance); await settled(item);
		expect(item.preprocessedFile?.type).toBe('image/webp');
		expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
	});

	test.each(['render', 'export'])('frame %s failure releases both owned bitmaps and settles', async failure => {
		const decoding = deferred<ImageBitmap>();
		vi.mocked(window.createImageBitmap).mockReturnValueOnce(decoding.promise);
		const original = new Error('frame failed');
		if (failure === 'render') actions.frameRender.mockRejectedValueOnce(original);
		const instance = uploader(false); instance.addFiles([file()]);
		const item = instance.items.value[0]; item.imageFrameParams = frame;
		const bitmap = { width: 100, height: 80, close: vi.fn() }; bitmaps.push(bitmap);
		decoding.resolve(bitmap as unknown as ImageBitmap);
		if (failure === 'export') {
			await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(1));
			expect(() => canvasCallbacks[0](null)).not.toThrow();
		}
		await settled(item);
		for (const owned of bitmaps) expect(owned.close).toHaveBeenCalledTimes(1);
		expect(actions.frameDestroy).toHaveBeenCalledTimes(1);
		expect(item.preprocessedFile).toBeUndefined();
		expect(consoleError).toHaveBeenCalledWith('Failed to preprocess image', failure === 'render' ? original : expect.objectContaining({ message: 'Failed to convert canvas to blob' }));
	});

	test('frame preprocessing owns a separate bitmap and preserves EXIF/filename/caption parameters', async () => {
		const decoding = deferred<{ width: number; height: number; close: ReturnType<typeof vi.fn> }>();
		vi.mocked(window.createImageBitmap).mockReturnValueOnce(decoding.promise as unknown as Promise<ImageBitmap>);
		const instance = uploader(false); instance.addFiles([file()]);
		const item = instance.items.value[0]; item.imageFrameParams = frame; item.caption = 'label';
		const original = { width: 100, height: 80, close: vi.fn() }; bitmaps.push(original); decoding.resolve(original);
		await vi.waitFor(() => expect(canvasCallbacks).toHaveLength(1));
		expect(actions.frameOptions).toHaveBeenCalledWith(expect.objectContaining({ image: bitmaps[1], filename: 'photo.png', caption: 'label', exif: { Model: { description: 'Camera' } } }));
		expect(bitmaps[1].close).not.toHaveBeenCalled();
		canvasCallbacks[0](new Blob(['frame'], { type: 'image/png' }));
		await settled(item);
		for (const bitmap of bitmaps) expect(bitmap.close).toHaveBeenCalledTimes(1);
		expect(actions.frameDestroy).toHaveBeenCalledTimes(1);
		expect(item.preprocessedFile?.type).toBe('image/png');
	});
});
