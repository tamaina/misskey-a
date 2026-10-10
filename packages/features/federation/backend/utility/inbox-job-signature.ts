/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { UnrecoverableError } from 'bullmq';
import type { ParsedDraftSignature } from '@misskey-dev/node-http-message-signatures';
import type { InboxJobData } from '@features/runtime/backend/queue/types.js';
import { getApId } from '../protocol/type.js';

/** Decode retained queue formats before applying the ordinary signature checks. */
export function normalizeInboxJobSignature(signature: unknown): ParsedDraftSignature['value'] | null {
	if (signature == null) return null;
	if (typeof signature !== 'object' || Array.isArray(signature)) throw new UnrecoverableError('skip: malformed inbox HTTP signature');
	if ('version' in signature) {
		if (signature.version === 'rfc9421') {
			throw new UnrecoverableError('skip: RFC9421 HTTP Message Signatures are not supported for inbox verification yet');
		}
		if (signature.version !== 'draft' || !('value' in signature)) throw new UnrecoverableError('skip: unsupported inbox HTTP signature version');
		if (isDraftSignatureValue(signature.value)) return signature.value;
	} else if (isDraftSignatureValue(signature)) {
		return signature;
	}
	throw new UnrecoverableError('skip: malformed inbox HTTP signature');
}

function isDraftSignatureValue(value: unknown): value is ParsedDraftSignature['value'] {
	if (value == null || typeof value !== 'object' || !('params' in value)) return false;
	const params = value.params;
	return 'scheme' in value && value.scheme === 'Signature'
		&& 'keyId' in value && typeof value.keyId === 'string' && value.keyId.length > 0
		&& 'signingString' in value && typeof value.signingString === 'string'
		&& (!('algorithm' in value) || value.algorithm === undefined || typeof value.algorithm === 'string')
		&& params != null && typeof params === 'object'
		&& 'keyId' in params && typeof params.keyId === 'string'
		&& 'signature' in params && typeof params.signature === 'string'
		&& 'headers' in params && Array.isArray(params.headers) && params.headers.every(header => typeof header === 'string')
		&& (!('algorithm' in params) || params.algorithm === undefined || typeof params.algorithm === 'string');
}

/** Queue diagnostics also count unsigned/unsupported jobs by their Actor host. */
export function getInboxJobHost(job: InboxJobData): string {
	try {
		const signature = normalizeInboxJobSignature(job.signature);
		if (signature != null) return new URL(signature.keyId).host;
	} catch {
		// Diagnostic fallback only; the processor still rejects unsupported jobs.
	}
	try {
		return new URL(getApId(job.activity.actor)).host;
	} catch {
		return '(invalid actor)';
	}
}
