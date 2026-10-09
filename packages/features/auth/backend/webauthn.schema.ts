/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';

// The registration-start producer uses the installed SimpleWebAuthn defaults and credProps.
// Credential shape validation runs in the domain after password and stored-challenge checks.
export const webAuthnTransportSchema = v.picklist(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']);
export const webAuthnRegistrationOptionsSchema = v.strictObject({
	challenge: v.string(),
	rp: v.strictObject({ name: v.string(), id: v.exactOptional(v.string()) }),
	user: v.strictObject({ id: v.string(), name: v.string(), displayName: v.string() }),
	pubKeyCredParams: v.array(v.strictObject({ type: v.literal('public-key'), alg: v.pipe(v.number(), v.finite()) })),
	timeout: v.exactOptional(v.pipe(v.number(), v.finite())),
	attestation: v.exactOptional(v.picklist(['none', 'indirect', 'direct', 'enterprise'])),
	excludeCredentials: v.exactOptional(v.array(v.strictObject({
		id: v.string(), type: v.literal('public-key'), transports: v.exactOptional(v.array(webAuthnTransportSchema)),
	}))),
	authenticatorSelection: v.exactOptional(v.strictObject({
		authenticatorAttachment: v.exactOptional(v.picklist(['platform', 'cross-platform'])),
		residentKey: v.exactOptional(v.picklist(['discouraged', 'preferred', 'required'])),
		requireResidentKey: v.exactOptional(v.boolean()),
		userVerification: v.exactOptional(v.picklist(['discouraged', 'preferred', 'required'])),
	})),
	extensions: v.exactOptional(v.strictObject({ appid: v.exactOptional(v.string()), credProps: v.exactOptional(v.boolean()), hmacCreateSecret: v.exactOptional(v.boolean()), minPinLength: v.exactOptional(v.boolean()) })),
	attestationFormats: v.exactOptional(v.array(v.string())),
	hints: v.exactOptional(v.array(v.picklist(['security-key', 'client-device', 'hybrid']))),
});
export type WebAuthnRegistrationOptions = v.InferOutput<typeof webAuthnRegistrationOptionsSchema>;

const nativeRegistrationOptionsSchema = v.strictObject({
	challenge: v.string(),
	rp: v.strictObject({ name: v.string(), id: v.optional(v.string()) }),
	user: v.strictObject({ id: v.string(), name: v.string(), displayName: v.string() }),
	pubKeyCredParams: v.array(v.strictObject({ type: v.literal('public-key'), alg: v.pipe(v.number(), v.finite()) })),
	timeout: v.optional(v.pipe(v.number(), v.finite())),
	attestation: v.optional(v.picklist(['none', 'indirect', 'direct', 'enterprise'])),
	excludeCredentials: v.optional(v.array(v.strictObject({
		id: v.string(), type: v.literal('public-key'), transports: v.optional(v.array(webAuthnTransportSchema)),
	}))),
	authenticatorSelection: v.optional(v.strictObject({
		authenticatorAttachment: v.optional(v.picklist(['platform', 'cross-platform'])),
		residentKey: v.optional(v.picklist(['discouraged', 'preferred', 'required'])),
		requireResidentKey: v.optional(v.boolean()),
		userVerification: v.optional(v.picklist(['discouraged', 'preferred', 'required'])),
	})),
	extensions: v.optional(v.strictObject({ appid: v.optional(v.string()), credProps: v.optional(v.boolean()), hmacCreateSecret: v.optional(v.boolean()), minPinLength: v.optional(v.boolean()) })),
	attestationFormats: v.optional(v.array(v.string())),
	hints: v.optional(v.array(v.picklist(['security-key', 'client-device', 'hybrid']))),
});

/** Omit the native producer's explicit optional undefined fields at the JSON wire boundary. */
export function toWebAuthnRegistrationOptions(input: v.InferInput<typeof nativeRegistrationOptionsSchema>): WebAuthnRegistrationOptions {
	const { rp, excludeCredentials, authenticatorSelection, extensions, hints, timeout, attestation, attestationFormats, ...required } = input;
	const { id: rpId, ...rpRequired } = rp;
	let selection;
	if (authenticatorSelection !== undefined) {
		const { authenticatorAttachment, residentKey, requireResidentKey, userVerification, ...rest } = authenticatorSelection;
		selection = { ...rest,
			...(authenticatorAttachment === undefined ? {} : { authenticatorAttachment }),
			...(residentKey === undefined ? {} : { residentKey }),
			...(requireResidentKey === undefined ? {} : { requireResidentKey }),
			...(userVerification === undefined ? {} : { userVerification }),
		};
	}
	let extensionValues;
	if (extensions !== undefined) {
		const { appid, credProps, hmacCreateSecret, minPinLength, ...rest } = extensions;
		extensionValues = { ...rest,
			...(appid === undefined ? {} : { appid }), ...(credProps === undefined ? {} : { credProps }),
			...(hmacCreateSecret === undefined ? {} : { hmacCreateSecret }), ...(minPinLength === undefined ? {} : { minPinLength }),
		};
	}
	return v.parse(webAuthnRegistrationOptionsSchema, {
		...required, rp: { ...rpRequired, ...(rpId === undefined ? {} : { id: rpId }) },
		...(excludeCredentials === undefined ? {} : { excludeCredentials: excludeCredentials.map(({ transports, ...credential }) => ({ ...credential, ...(transports === undefined ? {} : { transports }) })) }),
		...(selection === undefined ? {} : { authenticatorSelection: selection }),
		...(extensionValues === undefined ? {} : { extensions: extensionValues }),
		...(hints === undefined ? {} : { hints }), ...(timeout === undefined ? {} : { timeout }),
		...(attestation === undefined ? {} : { attestation }), ...(attestationFormats === undefined ? {} : { attestationFormats }),
	});
}

// These finite protocol fields match the installed library. Unknown protocol fields
// are ignored by domain construction, as the verification library ignores them.
export const webAuthnRegistrationResponseSchema = objectInput({
	id: v.string(), rawId: v.string(), type: v.literal('public-key'),
	authenticatorAttachment: v.optional(v.picklist(['platform', 'cross-platform'])),
	response: objectInput({
		clientDataJSON: v.string(), attestationObject: v.string(),
		authenticatorData: v.optional(v.string()), transports: v.optional(v.array(webAuthnTransportSchema)),
		publicKeyAlgorithm: v.optional(v.pipe(v.number(), v.finite())), publicKey: v.optional(v.string()),
	}),
	clientExtensionResults: objectInput({
		appid: v.optional(v.boolean()), hmacCreateSecret: v.optional(v.boolean()),
		credProps: v.optional(objectInput({ rk: v.optional(v.boolean()) })),
	}),
});
export type WebAuthnRegistrationResponse = v.InferOutput<typeof webAuthnRegistrationResponseSchema>;

export const webAuthnAuthenticationOptionsSchema = v.strictObject({
	challenge: v.string(), timeout: v.exactOptional(v.pipe(v.number(), v.finite())), rpId: v.exactOptional(v.string()),
	allowCredentials: v.exactOptional(v.array(v.strictObject({ id: v.string(), type: v.literal('public-key'), transports: v.exactOptional(v.array(webAuthnTransportSchema)) }))),
	userVerification: v.exactOptional(v.picklist(['discouraged', 'preferred', 'required'])),
	hints: v.exactOptional(v.array(v.picklist(['security-key', 'client-device', 'hybrid']))),
	extensions: v.exactOptional(v.strictObject({ appid: v.exactOptional(v.string()), credProps: v.exactOptional(v.boolean()), hmacCreateSecret: v.exactOptional(v.boolean()), minPinLength: v.exactOptional(v.boolean()) })),
});
export const webAuthnAuthenticationResponseSchema = objectInput({
	id: v.string(), rawId: v.string(), type: v.literal('public-key'),
	authenticatorAttachment: v.optional(v.picklist(['platform', 'cross-platform'])),
	response: objectInput({ clientDataJSON: v.string(), authenticatorData: v.string(), signature: v.string(), userHandle: v.optional(v.string()) }),
	clientExtensionResults: objectInput({ appid: v.optional(v.boolean()), hmacCreateSecret: v.optional(v.boolean()), credProps: v.optional(objectInput({ rk: v.optional(v.boolean()) })) }),
});

const nativeAuthenticationOptionsSchema = v.strictObject({
	challenge: v.string(), timeout: v.optional(v.pipe(v.number(), v.finite())), rpId: v.optional(v.string()),
	allowCredentials: v.optional(v.array(v.strictObject({ id: v.string(), type: v.literal('public-key'), transports: v.optional(v.array(webAuthnTransportSchema)) }))),
	userVerification: v.optional(v.picklist(['discouraged', 'preferred', 'required'])),
	hints: v.optional(v.array(v.picklist(['security-key', 'client-device', 'hybrid']))),
	extensions: v.optional(v.strictObject({ appid: v.optional(v.string()), credProps: v.optional(v.boolean()), hmacCreateSecret: v.optional(v.boolean()), minPinLength: v.optional(v.boolean()) })),
});

export function toWebAuthnAuthenticationOptions(input: v.InferInput<typeof nativeAuthenticationOptionsSchema>): v.InferOutput<typeof webAuthnAuthenticationOptionsSchema> {
	const { timeout, rpId, allowCredentials, userVerification, hints, extensions, ...required } = input;
	let extensionValues;
	if (extensions !== undefined) {
		const { appid, credProps, hmacCreateSecret, minPinLength, ...rest } = extensions;
		extensionValues = { ...rest, ...(appid === undefined ? {} : { appid }), ...(credProps === undefined ? {} : { credProps }), ...(hmacCreateSecret === undefined ? {} : { hmacCreateSecret }), ...(minPinLength === undefined ? {} : { minPinLength }) };
	}
	return v.parse(webAuthnAuthenticationOptionsSchema, {
		...required, ...(timeout === undefined ? {} : { timeout }), ...(rpId === undefined ? {} : { rpId }),
		...(allowCredentials === undefined ? {} : { allowCredentials: allowCredentials.map(({ transports, ...credential }) => ({ ...credential, ...(transports === undefined ? {} : { transports }) })) }),
		...(userVerification === undefined ? {} : { userVerification }), ...(hints === undefined ? {} : { hints }),
		...(extensionValues === undefined ? {} : { extensions: extensionValues }),
	});
}
