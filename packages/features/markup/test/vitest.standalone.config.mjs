/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const backend = createRequire(new URL('../../../backend/package.json', import.meta.url));
const frontend = createRequire(new URL('../../../frontend/package.json', import.meta.url));
// Deliberately no frontend Vite config, setup scripts, DOM or component mocks.
export default {
	resolve: {
		alias: {
			'vue/server-renderer': frontend.resolve('vue/server-renderer'),
			'vue': frontend.resolve('vue'),
			'mfm-js': backend.resolve('mfm-js'),
			'juice': backend.resolve('juice'),
			// The renderer only uses nyaize; resolve its real source without requiring SDK generation.
			'misskey-js': fileURLToPath(new URL('../../../misskey-js/src/nyaize.ts', import.meta.url)),
		},
	},
	test: {
		environment: 'node',
		include: [fileURLToPath(new URL('./backend/*mfm*.test.ts', import.meta.url)), fileURLToPath(new URL('./frontend/mfm-renderer.test.ts', import.meta.url))],
	},
};
