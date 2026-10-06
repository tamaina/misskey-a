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
