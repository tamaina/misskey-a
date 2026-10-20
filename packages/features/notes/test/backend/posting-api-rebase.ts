/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import witnesses from './posting-api-rebase.json';

function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
	if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`;
	return JSON.stringify(value);
}

export function postingApiHash(value: unknown): string {
	return createHash('sha256').update(stableJson(JSON.parse(JSON.stringify(value)))).digest('hex');
}

function object(value: unknown): Record<string, unknown> {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Posting API inverse object differs');
	return value as Record<string, unknown>;
}

const postingFields = {
	canNote: { type: 'boolean' },
	renotePolicy: { enum: ['allow', 'renoteOnly', 'disallow'], type: 'string' },
	canCreateSpecifiedNote: { type: 'boolean' },
	canFederateNote: { type: 'boolean' },
	noteFilesLimit: { type: 'integer', minimum: 0, maximum: 16 },
};

function restorePolicies(schema: unknown): void {
	const policies = object(schema);
	const properties = object(policies.properties);
	for (const [name, shape] of Object.entries(postingFields)) {
		if (stableJson(properties[name]) !== stableJson(shape)) throw new Error(`Posting API policy differs: ${name}`);
		delete properties[name];
	}
	if (!Array.isArray(policies.required) || stableJson(policies.required.slice(-5)) !== stableJson(Object.keys(postingFields))) throw new Error('Posting API required fields differ');
	policies.required = policies.required.slice(0, -5);
}

function responseSchema(operation: unknown, status: string): Record<string, unknown> {
	const post = object(object(operation).post);
	const response = object(object(post.responses)[status]);
	return object(object(object(response.content)['application/json']).schema);
}

const postingErrors = ['CANNOT_CREATE_NOTE', 'CONTAINS_TOO_MANY_FILES', 'RENOTE_FORBIDDEN', 'QUOTE_FORBIDDEN', 'SPECIFIED_NOTE_CREATION_FORBIDDEN', 'REMOTE_SPECIFIED_NOTE_CREATION_FORBIDDEN'];

type Witness = { name: string; currentSha256: string; baselineSha256: string };

function restore(witness: Witness | undefined, value: unknown, inverse: (restored: unknown) => void): unknown {
	if (!witness) return value;
	if (postingApiHash(value) !== witness.currentSha256) throw new Error(`Posting API current differs: ${witness.name}`);
	const restored: unknown = structuredClone(value);
	inverse(restored);
	if (postingApiHash(restored) !== witness.baselineSha256) throw new Error(`Posting API baseline differs: ${witness.name}`);
	return restored;
}

/** Pin complete operations before reversing only the five policy fields or six new errors. */
export function restorePostingOperationBaseline(path: string, operation: unknown): unknown {
	return restore(witnesses.operations.find(entry => entry.name === path), operation, restored => {
		if (path === '/admin/show-user') {
			restorePolicies(object(responseSchema(restored, '200').properties).policies);
		} else if (path === '/notes/create') {
			const error = object(object(responseSchema(restored, '400').properties).error);
			if (!Array.isArray(error.anyOf)) throw new Error('Posting API error union differs');
			const code = (branch: unknown) => object(object(object(branch).properties).code).const;
			for (const name of postingErrors) {
				if (error.anyOf.filter(branch => code(branch) === name).length !== 1) throw new Error(`Posting API error differs: ${name}`);
			}
			error.anyOf = error.anyOf.filter(branch => !postingErrors.includes(String(code(branch))));
		} else {
			throw new Error(`Unexpected posting API operation: ${path}`);
		}
	});
}

/** Keep every pre-existing public schema hash; only pinned copies of RolePolicies change. */
export function restorePostingSchemaBaseline(name: string, schema: unknown): unknown {
	return restore(witnesses.schemas.find(entry => entry.name === name), schema, restorePolicies);
}
