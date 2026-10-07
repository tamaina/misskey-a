/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getGlobalDefs } from '@valibot/to-json-schema';
import { metadata } from 'valibot';
import { getLegacyOutputOneOfRegistration, hasLegacyOutputOneOfOptions, assertLegacyOutputOneOfOptionsStatic } from '../contract/legacy-output-one-of.js';
import { isMisskeyIdOrIds, hasMisskeyIdOrIdsOptions } from '../contract/misskey-id-or-ids.js';

import { isMuteWordInputItem, hasMuteWordInputItemOptions } from '../contract/mute-word-input-item.js';
import { isNotificationReceiveRule, hasNotificationReceiveRuleOptions } from '@features/users/contract/notification-receive-config.js';
import { isJsonObjectNoopMetadata } from './json-object-projection.js';

const annotationKeys = new Set([
	'title', 'description', 'example', 'examples', '$comment', 'deprecated',
	'readOnly', 'writeOnly', 'externalDocs',
]);

function isOwnedUnion(value: object): boolean {
	return getLegacyOutputOneOfRegistration(value) !== undefined || hasLegacyOutputOneOfOptions(value)
		|| isMisskeyIdOrIds(value) || hasMisskeyIdOrIdsOptions(value)
		|| isMuteWordInputItem(value) || hasMuteWordInputItemOptions(value)
		|| isNotificationReceiveRule(value) || hasNotificationReceiveRuleOptions(value);
}

/** These bounded union projections do not support being returned from any lazy factory. */
export function assertOwnedUnionLazyReturn(value: object, seen = new Set<object>()): void {
	if (seen.has(value)) return;
	seen.add(value);
	if (isOwnedUnion(value)) throw new Error('Owned union projections cannot be returned from lazy schemas');
	if (Array.isArray(value)) {
		for (const child of value) if (child !== null && typeof child === 'object') assertOwnedUnionLazyReturn(child, seen);
		return;
	}
	for (const [key, child] of Object.entries(value)) {
		if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)
			&& child !== null && typeof child === 'object') assertOwnedUnionLazyReturn(child, seen);
	}
	if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
		for (const child of Object.values(value.entries)) {
			if (child !== null && typeof child === 'object') assertOwnedUnionLazyReturn(child, seen);
		}
	}
}

/** Protect every containing pipeline, including shared, lazy and global-definition contexts. */
function assertOwnedUnionMetadata(schema: object, isOwned: (value: object) => boolean, label: string, definitions = getGlobalDefs()): void {
	const nodes = new Set<object>();
	const parents = new Map<object, Set<object>>();
	const affected = new Set<object>();
	const lazyReturns = new Map<object, unknown>();

	function collect(value: unknown, parent?: object): void {
		if (value === null || typeof value !== 'object') return;
		if (parent !== undefined) {
			const ancestors = parents.get(value) ?? new Set<object>();
			ancestors.add(parent);
			parents.set(value, ancestors);
		}
		if (nodes.has(value)) return;
		nodes.add(value);
		if (hasLegacyOutputOneOfOptions(value) && 'options' in value) assertLegacyOutputOneOfOptionsStatic(value.options);
		if (isOwned(value)) affected.add(value);
		if (Array.isArray(value)) {
			for (const child of value) collect(child, value);
			return;
		}
		for (const [key, child] of Object.entries(value)) {
			if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'pipe', 'options'].includes(key)) collect(child, value);
		}
		if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
			for (const child of Object.values(value.entries)) collect(child, value);
		}
		if ('type' in value && value.type === 'lazy' && 'getter' in value && typeof value.getter === 'function') {
			if (!lazyReturns.has(value.getter)) lazyReturns.set(value.getter, Reflect.apply(value.getter, undefined, [undefined]));
			collect(lazyReturns.get(value.getter), value);
		}
	}

	collect(schema);
	for (const definition of Object.values(definitions ?? {})) collect(definition);
	const pending = [...affected];
	for (const node of pending) {
		for (const parent of parents.get(node) ?? []) {
			if (affected.has(parent)) continue;
			affected.add(parent);
			pending.push(parent);
		}
	}

	function checkPipe(pipe: unknown[], owner: object, seen = new Set<object>()): void {
		for (const item of pipe) {
			if (item === null || typeof item !== 'object' || seen.has(item)) continue;
			seen.add(item);
			if ('pipe' in item && Array.isArray(item.pipe)) checkPipe(item.pipe, item, seen);
			if ('type' in item && item.type === 'metadata') {
				if (!('kind' in item) || item.kind !== 'metadata' || !('reference' in item) || item.reference !== metadata) {
					throw new Error(`${label} pipelines cannot use disguised metadata predicates`);
				}
				if (isJsonObjectNoopMetadata(owner, item)) continue;
				if (!('metadata' in item) || item.metadata === null || typeof item.metadata !== 'object'
					|| Object.keys(item.metadata).some(key => !annotationKeys.has(key))) {
					throw new Error(`${label} pipelines require annotation-only metadata`);
				}
			}
		}
	}

	for (const node of affected) {
		if ('pipe' in node && Array.isArray(node.pipe)) checkPipe(node.pipe, node);
	}
}

export function assertLegacyOutputOneOfMetadata(schema: object, definitions = getGlobalDefs()): void {
	assertOwnedUnionMetadata(schema, value => getLegacyOutputOneOfRegistration(value) !== undefined || hasLegacyOutputOneOfOptions(value), 'Legacy output oneOf', definitions);
}

export function assertMisskeyIdOrIdsMetadata(schema: object, definitions = getGlobalDefs()): void {
	assertOwnedUnionMetadata(schema, value => isMisskeyIdOrIds(value) || hasMisskeyIdOrIdsOptions(value), 'Misskey identifier-or-identifiers', definitions);
}

export function assertClosedUserInputUnionMetadata(schema: object, definitions = getGlobalDefs()): void {
	assertOwnedUnionMetadata(schema, value => isMuteWordInputItem(value) || hasMuteWordInputItemOptions(value)
		|| isNotificationReceiveRule(value) || hasNotificationReceiveRuleOptions(value), 'Closed user input union', definitions);
}
