/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { validateMailAddress } from './outgoing.js';
import type { MailEnvelope, MailState } from './outgoing.js';

export type ForwardSettings = {
	enabled: boolean;
	destination: string | null;
	verifiedAt: Date | null;
	revision: number;
	keepLocalCopy: boolean;
};

export function validateForwardDestination(destination: string, managedDomains: string[]): string {
	const address = validateMailAddress(destination);
	const domain = address.slice(address.lastIndexOf('@') + 1);
	if (managedDomains.some(managed => managed.toLowerCase() === domain)) throw new Error('Forward destination must be external');
	return address;
}

/** Check within the same DB lock that claims queued -> sending; changes cannot cancel an already-started submission. */
export function canStartForward(settings: ForwardSettings, snapshot: { revision: number; destination: string; state: MailState }): boolean {
	return snapshot.state === 'queued' && settings.enabled && settings.verifiedAt !== null &&
		Number.isFinite(settings.verifiedAt.getTime()) && settings.revision === snapshot.revision && settings.destination === snapshot.destination;
}

/**
 * Trusted ingress/relay contract, never derived from raw Authentication-Results or other public headers:
 * - ingress authenticates the MTA and rejects over-hop or verified self-forward loops;
 * - MTA authenticates its own loop marker, strips spoofed auth-result headers, and enforces hop limits;
 * - relay performs SRS/reverse SRS, including null senders, and preserves DKIM-signed bytes;
 * - ARC verification/sealing, if configured, belongs to that trusted MTA, not the application.
 * A deployment must explicitly opt in after configuring these protections. Raw is not reconstructed.
 */
export type ForwardMtaContract = { trustedIngress: boolean; loopChecked: boolean; forwardingRelay: boolean };

export function buildForwardMail(
	raw: Buffer,
	originalEnvelopeFrom: string,
	settings: ForwardSettings,
	managedDomains: string[],
	contract: ForwardMtaContract,
	maxBytes: number,
): { raw: Buffer; envelope: MailEnvelope } {
	if (!contract.trustedIngress || !contract.loopChecked || !contract.forwardingRelay) throw new Error('Forwarding MTA contract not satisfied');
	if (!settings.enabled || !settings.destination || !settings.verifiedAt || !Number.isFinite(settings.verifiedAt.getTime())) throw new Error('Forward destination is not verified');
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Buffer.isBuffer(raw) || !raw.length || raw.length > maxBytes) throw new Error('Invalid forwarding raw size');
	const to = validateForwardDestination(settings.destination, managedDomains);
	const from = originalEnvelopeFrom === '' ? '' : validateMailAddress(originalEnvelopeFrom);
	return { raw, envelope: { from, to: [to] } };
}
