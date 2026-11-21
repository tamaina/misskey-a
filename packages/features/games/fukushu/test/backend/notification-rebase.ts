/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import rebases from './notification-rebase.json';

function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
	if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`;
	return JSON.stringify(value);
}

function hash(value: unknown): string {
	return createHash('sha256').update(stableJson(value)).digest('hex');
}

/** Keep the frozen public API oracle; reverse only the pinned export enum addition. */
export function restoreFukushuNotificationBaseline(kind: 'operation' | 'schema', name: string, value: unknown): unknown {
	const rebase = rebases.find(row => row.kind === kind && row.name === name);
	if (!rebase) return value;
	// Match the generator's JSON representation, including omission of undefined fields.
	const restored: unknown = JSON.parse(JSON.stringify(value));
	if (hash(restored) !== rebase.currentSha256) throw new Error(`Fukushu notification boundary differs: ${name}`);
	let target: unknown = restored;
	for (const key of rebase.path) {
		if (target === null || typeof target !== 'object' || !(key in target)) throw new Error(`Fukushu notification path differs: ${name}`);
		target = Reflect.get(target, key);
	}
	if (!Array.isArray(target) || target[6] !== 'fukushu' || target.filter(x => x === 'fukushu').length !== 1) throw new Error(`Fukushu notification enum differs: ${name}`);
	target.splice(6, 1);
	if (hash(restored) !== rebase.baselineSha256) throw new Error(`Fukushu notification baseline differs: ${name}`);
	return restored;
}
