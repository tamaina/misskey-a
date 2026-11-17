/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import vue from '@vitejs/plugin-vue';
import pluginJson5 from '../../lib/vite-plugin-json5.js';
import { pluginVvi } from '../../lib/vite-plugin-vvi.ts';
import { pluginFeatureDependencies } from '../../lib/vite-plugin-feature-dependencies.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = resolve(root, 'test/browser-feature/fixture');
const output = await mkdtemp(resolve(tmpdir(), 'misskey-antenna-browser-'));
let server;
try {
	const result = await build({
		root, configFile: false, logLevel: 'warn', plugins: [pluginFeatureDependencies(root, resolve(root, '../features')), pluginVvi(), pluginJson5(), vue()], define: { _DEV_: 'false' },
		resolve: { dedupe: ['vue', 'vite-vue-internationalization'], alias: [
			...['@features/auth/frontend/i.js', '@features/ui/frontend/os.js', '@features/preferences/frontend/preferences.js', '@features/preferences/frontend/theme.js', '@features/preferences/frontend/local-storage.js', '@features/instance/frontend/instance.js', '@features/boot/frontend/shared/config.js', '@features/api/frontend/utility/misskey-api.js', '@features/discovery/frontend/utility/autocomplete.js'].map(find => ({ find, replacement: resolve(fixture, 'antenna-adapters.js') })),
			{ find: '@features/navigation/frontend/components/global/MkA.vue', replacement: resolve(fixture, 'AntennaLink.vue') },
			{ find: '@features', replacement: resolve(root, '../features') },
		] },
		build: { outDir: output, emptyOutDir: true, target: 'esnext', rolldownOptions: { input: resolve(fixture, 'antenna.html') } },
	});
	const html = (Array.isArray(result) ? result : [result]).flatMap(item => item.output).find(item => item.fileName.endsWith('.html'));
	assert.ok(html);
	if (process.argv.includes('--serve')) {
		server = await preview({ root, configFile: false, build: { outDir: output }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
		console.log(`Antenna fixture PID: ${process.pid}`);
		console.log(`Antenna fixture URL: http://127.0.0.1:${server.httpServer.address().port}/${html.fileName}`);
		await new Promise(done => { process.once('SIGTERM', done); process.once('SIGINT', done); });
	} else console.log('Antenna browser fixture build passed. Use --serve for manual browser inspection.');
} finally {
	if (server) await new Promise((done, reject) => server.httpServer.close(error => error ? reject(error) : done()));
	await rm(output, { recursive: true, force: true });
}
