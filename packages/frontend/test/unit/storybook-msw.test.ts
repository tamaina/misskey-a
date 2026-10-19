/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { HttpNetworkFrame } from 'msw/experimental';
import { onUnhandledFrame } from '../../.storybook/mocks.js';

// Use MSW's public frame constructor; no transport is needed for warning policy.
class HttpFrame extends HttpNetworkFrame {
	public override respondWith(): void { throw new Error('Unexpected response'); }
	public override passthrough(): void { throw new Error('Unexpected transport'); }
	public override errorWith(): void { throw new Error('Unexpected transport error'); }
}

function check(url: string) {
	const warn = vi.fn();
	const error = vi.fn();
	onUnhandledFrame({ frame: new HttpFrame({ request: new Request(url) }), defaults: { warn, error } });
	return { warn, error };
}

describe('Storybook MSW 3 warning policy', () => {
	test.each(['/client-assets/logo.png', '/fluent-emoji/1f600.png', '/iframe.html', '/node_modules/module.js', '/src/component.vue', '/sb-preview/runtime.js', '/static-assets/font.woff2', '/vite/module.js'])('allows Storybook assets: %s', asset => {
		const { warn, error } = check(`http://localhost:6006${asset}`);
		expect(warn).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
	});

	test('allows external assets', () => {
		expect(check('https://example.test/image.png').warn).not.toHaveBeenCalled();
	});

	test('warns for unmocked local API calls', () => {
		const { warn, error } = check('http://localhost:6006/api/users/show');
		expect(warn).toHaveBeenCalledOnce();
		expect(error).not.toHaveBeenCalled();
	});
});
