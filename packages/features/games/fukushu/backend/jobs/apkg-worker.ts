/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFile } from 'node:fs/promises';
import { text } from 'node:stream/consumers';
import { ApkgMaterialError, readApkgImport } from '../apkg-material.js';

async function main() {
	const { path, name, sha256 } = JSON.parse(await text(process.stdin));
	try {
		const imported = await readApkgImport(await readFile(path), name, sha256);
		process.stdout.write(JSON.stringify(imported));
	} catch (error) {
		if (!(error instanceof ApkgMaterialError)) throw error;
		process.stdout.write(JSON.stringify({ error: error.code }));
	}
}

main().catch(() => { process.exitCode = 1; });
