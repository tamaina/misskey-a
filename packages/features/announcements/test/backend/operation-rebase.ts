/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import rebases from './operation-rebase.json';

function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
	if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`;
	return JSON.stringify(value);
}

export function operationHash(value: unknown): string {
	return createHash('sha256').update(stableJson(JSON.parse(JSON.stringify(value)))).digest('hex');
}

/** Reverse only the three pinned admin deadline additions; public schemas stay untouched. */
export function restoreAnnouncementOperationBaseline(path: string, operation: unknown): unknown {
	const rebase = rebases.find(entry => entry.path === path);
	if (!rebase) return operation;
	if (operationHash(operation) !== rebase.currentSha256) throw new Error(`Announcement operation differs: ${path}`);
	const restored: unknown = structuredClone(operation);
	for (const removal of rebase.removals) {
		let parent: unknown = restored;
		for (const part of removal.parent) {
			if (parent === null || typeof parent !== 'object' || !(part in parent)) throw new Error(`Announcement operation parent differs: ${path}`);
			parent = Reflect.get(parent, part);
		}
		if (typeof removal.key === 'number') {
			if (!Array.isArray(parent) || parent.length !== removal.key + 1 || stableJson(parent[removal.key]) !== stableJson(removal.current)) throw new Error(`Announcement operation array boundary differs: ${path}`);
			parent.pop();
		} else {
			if (parent === null || typeof parent !== 'object' || Array.isArray(parent) || !Object.hasOwn(parent, removal.key) || stableJson(Reflect.get(parent, removal.key)) !== stableJson(removal.current)) throw new Error(`Announcement operation property boundary differs: ${path}`);
			Reflect.deleteProperty(parent, removal.key);
		}
	}
	if (operationHash(restored) !== rebase.baselineSha256) throw new Error(`Announcement operation baseline differs: ${path}`);
	return restored;
}
