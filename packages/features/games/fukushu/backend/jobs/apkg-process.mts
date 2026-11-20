/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { StagedApkg } from '../backup-drive.js';
import type { FukushuMaterial } from '../../shared/material.schema.js';

/** Keep SQLite, decompression and untrusted deck data off the queue event loop. */
export function decodeStagedApkg(source: StagedApkg, entry = new URL('./fukushu-apkg-worker.js', import.meta.url)): Promise<FukushuMaterial> {
	return new Promise((resolve, reject) => {
		const child = execFile(process.execPath, ['--max-old-space-size=192', '--wasm-max-mem-pages=8192', fileURLToPath(entry)],
			{ env: {}, timeout: 60_000, killSignal: 'SIGKILL', maxBuffer: 2 * 1024 ** 2, encoding: 'utf8' },
			(error, stdout) => {
				// Never send stderr, card data, file paths or user-provided messages to Redis/API.
				if (error) return reject(new Error('APKG_DECODE_FAILED'));
				try {
					const result = JSON.parse(stdout);
					if (result.error === 'APKG_UNSUPPORTED' || result.error === 'APKG_INVALID') reject(new Error(result.error));
					else if (result.material) resolve(result.material); // validated again before persistence
					else reject(new Error('APKG_DECODE_FAILED'));
				} catch { reject(new Error('APKG_DECODE_FAILED')); }
			});
		// execFile's callback handles early child failure, including a closed input pipe.
		child.stdin?.on('error', () => {});
		child.stdin?.end(JSON.stringify(source));
	});
}
