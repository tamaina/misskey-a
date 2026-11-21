/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as v from 'valibot';
import { ankiMediaAssetSchema, MAX_ANKI_MEDIA_BYTES } from '../shared/anki-media.schema.js';

/** Never accept a caller-supplied URL: publish only verified bytes of the expected type. */
export function staticAnkiMediaUrl(value: unknown, id: string, mimeType: 'image/png' | 'audio/wav'): string {
	const parsed = v.parse(ankiMediaAssetSchema, value);
	if (parsed.id !== id || parsed.mimeType !== mimeType) throw new Error('Unexpected Anki asset');
	const raw = atob(parsed.data);
	if (!raw.length || raw.length > MAX_ANKI_MEDIA_BYTES || btoa(raw) !== parsed.data
		|| (mimeType === 'image/png' ? !raw.startsWith('\x89PNG\r\n\x1a\n') : !raw.startsWith('RIFF') || raw.slice(8, 12) !== 'WAVE')
		|| bytesToHex(sha256(Uint8Array.from(raw, char => char.charCodeAt(0)))) !== id) {
		throw new Error('Invalid Anki asset');
	}
	return 'data:' + mimeType + ';base64,' + parsed.data;
}
