/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

// The registration-start producer uses the installed SimpleWebAuthn defaults and credProps.
// Credential verification remains the separate, explicit legacy WebAuthn input boundary.
const transport = v.picklist(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']);
export const webAuthnRegistrationOptionsSchema = v.strictObject({
	challenge: v.string(),
	rp: v.strictObject({ name: v.string(), id: v.exactOptional(v.string()) }),
	user: v.strictObject({ id: v.string(), name: v.string(), displayName: v.string() }),
	pubKeyCredParams: v.array(v.strictObject({ type: v.literal('public-key'), alg: v.number() })),
	timeout: v.exactOptional(v.number()),
	attestation: v.exactOptional(v.picklist(['none', 'indirect', 'direct', 'enterprise'])),
	excludeCredentials: v.exactOptional(v.array(v.strictObject({
		id: v.string(), type: v.literal('public-key'), transports: v.exactOptional(v.array(transport)),
	}))),
	authenticatorSelection: v.exactOptional(v.strictObject({
		authenticatorAttachment: v.exactOptional(v.picklist(['platform', 'cross-platform'])),
		residentKey: v.exactOptional(v.picklist(['discouraged', 'preferred', 'required'])),
		requireResidentKey: v.exactOptional(v.boolean()),
		userVerification: v.exactOptional(v.picklist(['discouraged', 'preferred', 'required'])),
	})),
	extensions: v.exactOptional(v.strictObject({ credProps: v.exactOptional(v.boolean()) })),
	hints: v.exactOptional(v.array(v.picklist(['security-key', 'client-device', 'hybrid']))),
});
export type WebAuthnRegistrationOptions = v.InferOutput<typeof webAuthnRegistrationOptionsSchema>;
