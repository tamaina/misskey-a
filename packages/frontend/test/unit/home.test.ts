/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, assert, describe, test } from 'vitest';
import { cleanup, render } from '@testing-library/vue';
import type { RenderResult } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import * as Misskey from 'misskey-js';
import { directives } from '@/directives/index.js';
import { components } from '@/components/index.js';
import XHome from '@features/users/frontend/pages/user/home.vue';
import 'intersection-observer';

describe('XHome', () => {
	const renderHome = async (user: Partial<Misskey.entities.UserDetailed>): Promise<RenderResult> => {
		const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
		await internationalization.ready;
		await internationalization.loadLocale('ja-JP');
		return render(XHome, {
			props: { user: user as Misskey.entities.UserDetailed, disableNotes: true },
			global: { directives, components, plugins: [internationalization] },
		});
	};

	afterEach(() => {
		cleanup();
	});

	test('Should render the remote caution when user.host exists', async () => {
		const home = await renderHome({
			id: 'blobcat',
			name: 'blobcat',
			host: 'example.com',
			uri: 'https://example.com/@user',
			url: 'https://example.com/@user/profile',
			roles: [],
			createdAt: '1970-01-01T00:00:00.000Z',
			fields: [],
			pinnedNotes: [],
			avatarUrl: 'https://example.com',
			avatarDecorations: [],
		});

		const anchor = home.container.querySelector<HTMLAnchorElement>('a[href^="https://example.com/"]');
		assert.exists(anchor, 'anchor to the remote exists');
		assert.strictEqual(anchor?.href, 'https://example.com/@user/profile');
	});

	test('The remote caution should fall back to uri if url is null', async () => {
		const home = await renderHome({
			id: 'blobcat',
			name: 'blobcat',
			host: 'example.com',
			uri: 'https://example.com/@user',
			url: null,
			roles: [],
			createdAt: '1970-01-01T00:00:00.000Z',
			fields: [],
			pinnedNotes: [],
			avatarUrl: 'https://example.com',
			avatarDecorations: [],
		});

		const anchor = home.container.querySelector<HTMLAnchorElement>('a[href^="https://example.com/"]');
		assert.exists(anchor, 'anchor to the remote exists');
		assert.strictEqual(anchor?.href, 'https://example.com/@user');
	});
});
