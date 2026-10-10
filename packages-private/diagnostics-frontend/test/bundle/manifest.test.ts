/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { collectBundleReport } from '../../src/bundle/manifest';

let workDir: string;

beforeAll(async () => {
	workDir = await mkdtemp(join(tmpdir(), 'diagnostics-frontend-test-'));
});

afterAll(async () => {
	await rm(workDir, { recursive: true, force: true });
});

test('fails loudly when the built output is missing', async () => {
	await expect(collectBundleReport(join(workDir, 'nonexistent'))).rejects.toThrow();
});

test('compares old localized artifacts and shared scripts according to host selection', async () => {
	for (const shared of [false, true]) {
		const repo = join(workDir, shared ? 'shared' : 'legacy');
		const output = join(repo, 'built/_frontend_vite_');
		await mkdir(join(output, 'scripts'), { recursive: true });
		await mkdir(join(output, 'ja-JP'), { recursive: true });
		await writeFile(join(output, 'manifest.json'), JSON.stringify({ 'src/_boot_.ts': { file: 'scripts/entry.js', isEntry: true, imports: ['_dep.js'] }, '_dep.js': { file: 'scripts/dep.js' } }));
		await writeFile(join(output, 'locale-entry-manifest.json'), JSON.stringify({ version: 1, entries: { 'ja-JP': `${shared ? 'scripts' : 'ja-JP'}/entry.js` } }));
		await writeFile(join(output, 'scripts/entry.js'), 'raw entry');
		await writeFile(join(output, 'scripts/dep.js'), 'raw dep');
		await writeFile(join(output, 'ja-JP/entry.js'), 'localized entry');
		await writeFile(join(output, 'ja-JP/dep.js'), 'localized dep');
		const report = await collectBundleReport(repo);
		const directory = shared ? 'scripts' : 'ja-JP';
		expect(report.startupFiles).toEqual([`${directory}/entry.js`, `${directory}/dep.js`]);
		expect(report.chunks.map(chunk => chunk.file)).toEqual(report.startupFiles);
		expect(report.chunks[0].size).toBe(shared ? 9 : 15);
		// A selected file must exist; raw scripts cannot mask a broken legacy build.
		await rm(join(output, directory, 'dep.js'));
		await expect(collectBundleReport(repo)).rejects.toThrow();
	}
});
