/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

/** Preserve the legacy JSON-object request semantics, including extra fields. */
export const objectParams = v.custom<Record<string, unknown>>(
	value => value !== null && typeof value === 'object' && !Array.isArray(value),
	'Expected a JSON object',
);

/** The existing Misskey identifier format, shared by portable contracts and the legacy validator. */
export const misskeyIdPattern = /^[a-zA-Z0-9]+$/;
export const misskeyId = v.custom<string>(
	value => typeof value === 'string' && misskeyIdPattern.test(value),
	'Expected a Misskey identifier',
);

/** Portable error description; the transport supplies the concrete error class. */
export interface ApiErrorDefinition {
	message: string;
	code: string;
	id: string;
	kind?: 'client' | 'server' | 'permission';
	httpStatusCode?: number;
}
