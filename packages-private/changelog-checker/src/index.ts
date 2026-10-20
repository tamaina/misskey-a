/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as process from 'process';
import * as fs from 'fs';
import { parseChangeLog } from './parser.js';
import { checkNewRelease, checkNewTopic, checkReleasePromotion } from './checker.js';

function abort(message?: string) {
	if (message) {
		console.error(message);
	}

	process.exit(1);
}

function main() {
	if (!fs.existsSync('./CHANGELOG-base.md') || !fs.existsSync('./CHANGELOG-head.md')) {
		abort('CHANGELOG-base.md or CHANGELOG-head.md is missing.');
		return;
	}

	const base = parseChangeLog('./CHANGELOG-base.md');
	const head = parseChangeLog('./CHANGELOG-head.md');

	// このフラグは同一リポジトリの develop -> stable PR にだけ workflow が設定する。
	const promotion = process.env.RELEASE_PR === 'true'
		&& base[0]?.releaseName === 'Unreleased'
		&& head[0]?.releaseName !== 'Unreleased';
	const packageVersion: string = promotion
		? JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version
		: '';

	const result = promotion
		? checkReleasePromotion(base, head, packageVersion)
		: (base.length < head.length)
			? checkNewRelease(base, head)
			: checkNewTopic(base, head);

	if (!result.success) {
		abort(result.message);
		return;
	}
}

main();
