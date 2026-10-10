/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UnrecoverableError } from 'bullmq';
import type { ParsedDraftSignature, ParsedSignature } from '@misskey-dev/node-http-message-signatures';

/** Decode retained queue formats before applying the ordinary signature checks. */
export function normalizeInboxJobSignature(signature: ParsedDraftSignature['value'] | ParsedSignature | null | undefined): ParsedDraftSignature['value'] | null {
	if (signature == null) return null;
	if ('version' in signature) {
		if (signature.version === 'rfc9421') {
			throw new UnrecoverableError('skip: RFC9421 HTTP Message Signatures are not supported for inbox verification yet');
		}
		return signature.value;
	}
	return signature;
}
