/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type { JsonLdDocument } from 'jsonld';

/** Preserve lazy loading while resolving from the backend package. */
export function loadJsonLd() {
	return import('jsonld');
}
