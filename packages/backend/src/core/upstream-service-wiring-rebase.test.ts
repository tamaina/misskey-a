/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { restoreUpstreamConstructorBaseline } from './upstream-service-wiring-rebase.js';
import { wiringRebases as rebases } from './upstream-service-wiring-rebase.js';

test.each(rebases)('pinned $feature/$service preserves every old dependency and rejects source or port drift', rebase => {
	const source = readFileSync(new URL(`../../../../${rebase.file}`, import.meta.url), 'utf8');
	expect(restoreUpstreamConstructorBaseline(rebase.feature, rebase.service, rebase.current, source)).toEqual(rebase.baseline);
	expect(() => restoreUpstreamConstructorBaseline(rebase.feature, rebase.service, rebase.current.slice(0, -1), source)).toThrow('boundary differs');
	expect(() => restoreUpstreamConstructorBaseline(rebase.feature, rebase.service, [...rebase.current].reverse(), source)).toThrow('boundary differs');
	expect(() => restoreUpstreamConstructorBaseline(rebase.feature, rebase.service, rebase.current, source + '\n')).toThrow('source differs');
});
