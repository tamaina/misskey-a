/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import reviewed from './bullmq-counts-source-rebase.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve('bullmq/package.json'));

/** Replay the frozen version guard only after checking the reviewed installed count implementation. */
export function restoreReviewedBullMqCountsVersion(version: string, readSource: (file: string) => string = file => readFileSync(resolve(packageRoot, file), 'utf8')): string {
	if (version !== reviewed.currentVersion) throw new Error('Unreviewed BullMQ counts version');
	for (const source of reviewed.sources) {
		const current = readSource(source.file);
		if (createHash('sha256').update(current).digest('hex') !== source.currentSha256) throw new Error(`Unreviewed BullMQ counts source: ${source.file}`);
	}
	return reviewed.baselineVersion;
}
