/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { deepStrictEqual, ok } from 'node:assert';
import proof from './fixtures/channel-federation-openapi-rebase.json';

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };

/** Undo only documented federation fields; frozen API hashes still check every other schema byte. */
export function restoreChannelFederationOpenapiBaseline<T extends { paths?: Record<string, unknown>; components?: { schemas?: Record<string, unknown> } }>(spec: T): T {
	// Normalize exactly as the frozen hash oracle does; preserve the caller's specification.
	const restored = JSON.parse(JSON.stringify(spec)) as T;
	const counts = { input: 0, channel: 0, noteChannel: 0, error: 0 };
	function visit(value: unknown, owner: string, path: string[]): void {
		if (Array.isArray(value)) { value.forEach((child, index) => visit(child, owner, [...path, String(index)])); return; }
		if (!record(value)) return;
		const props = value.properties;
		if (record(props) && 'isFederated' in props) {
			deepStrictEqual(props.isFederated, { type: 'boolean' }, `${owner}: federation flag differs`);
			if ('id' in props && 'name' in props && 'color' in props && 'isSensitive' in props && 'allowRenoteToExternal' in props) {
				deepStrictEqual(props.host, nullableString, `${owner}: channel host differs`);
				if ('createdAt' in props && 'bannerId' in props) {
					deepStrictEqual(props.uri, nullableString, `${owner}: channel URI differs`);
					ok(Array.isArray(value.required));
					for (const name of ['isFederated', 'host', 'uri']) ok(value.required.filter(key => key === name).length === 1);
					value.required = value.required.filter(name => !['isFederated', 'host', 'uri'].includes(String(name)));
					delete props.uri;
					counts.channel++;
				} else {
					ok(!('uri' in props));
					ok(!Array.isArray(value.required) || !value.required.some(name => ['isFederated', 'host'].includes(String(name))));
					counts.noteChannel++;
				}
				delete props.host;
			} else {
				ok(['/channels/create', '/channels/update'].includes(owner));
				ok(path.join('/') === 'post/requestBody/content/application/json/schema' || path.join('/') === 'post/requestBody/content/application/json/schema/allOf/0');
				ok('name' in props && 'isSensitive' in props && 'allowRenoteToExternal' in props);
				ok(!Array.isArray(value.required) || !value.required.includes('isFederated'));
				counts.input++;
			}
			delete props.isFederated;
		}
		if (Array.isArray(value.anyOf)) value.anyOf = value.anyOf.filter(child => {
			if (!record(child) || !record(child.properties) || !record(child.properties.code) || child.properties.code.const !== 'CHANNEL_FEDERATION_REQUIRES_PUBLIC') return true;
			ok(owner === '/notes/create' && path.join('/') === 'post/responses/400/content/application/json/schema/properties/error');
			deepStrictEqual(child, proof.errorSchema, 'Channel refusal schema differs');
			counts.error++;
			return false;
		});
		for (const [key, child] of Object.entries(value)) visit(child, owner, [...path, key]);
	}
	for (const name of proof.operations) { ok(restored.paths && name in restored.paths); visit(restored.paths[name], name, []); }
	for (const name of proof.schemas) { ok(restored.components?.schemas && name in restored.components.schemas); visit(restored.components.schemas[name], name, []); }
	deepStrictEqual(counts, proof.changeCounts, 'Documented channel API change inventory differs');
	return restored;
}
