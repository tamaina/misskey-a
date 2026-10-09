/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PackedJsonValue } from '../../users/backend/json-value.schema.js';

/** HTTP effects used by session applications; transport owns the actual Fastify reply. */
export interface AuthSessionEffects {
	code(status: number): void;
	header(name: string, value: string): void;
}
export interface AuthSessionRequest {
	ip: string;
	headers: Record<string, string | string[] | undefined>;
}
export type AuthSessionBody = PackedJsonValue | undefined;

/** Match property reads of the legacy parsed JSON body, retaining its failure order. */
export function sessionField(body: AuthSessionBody, key: string): PackedJsonValue | undefined {
	if (body === null || body === undefined) throw new TypeError('Cannot read properties of null or undefined');
	if (typeof body === 'object' && !Array.isArray(body)) return body[key];
	return undefined;
}
export function sessionText(value: PackedJsonValue | undefined): string {
	if (typeof value !== 'string') throw new TypeError('Expected a string');
	return value;
}
export function sessionErrorMessage(error: unknown): string {
	return typeof error === 'string' ? error : String(error);
}
