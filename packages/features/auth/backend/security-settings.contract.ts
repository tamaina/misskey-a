/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { sudoErrors } from './sudo.contract.js';
import { webAuthnAuthenticationOptionsSchema, webAuthnAuthenticationResponseSchema,
	webAuthnRegistrationOptionsSchema, webAuthnRegistrationResponseSchema } from './webauthn.schema.js';

const ticket = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/));
const name = v.pipe(v.string(), v.minLength(1), v.maxLength(30));
const keyId = v.pipe(v.string(), v.minLength(1), v.maxLength(2048));
const codes = v.strictObject({ backupCodes: v.array(v.string()) });
const errors = { ...sudoErrors, INCORRECT_PASSWORD: { status: 400, data: apiErrorData }, UNAVAILABLE: { status: 400, data: apiErrorData }, EMAIL_REQUIRED: { status: 400, data: apiErrorData }, CONFIRMATION_FAILED: { status: 403, data: apiErrorData }, LAST_AUTHENTICATION_FACTOR: { status: 400, data: apiErrorData } } as const;
const route = <const Name extends string>(requestName: Name) => oc.$meta({ requestName,
	requireCredential: true, secure: true, limit: { duration: 60_000, max: 20, key: 'security-settings' } })
	.route({ method: 'POST', path: `/${requestName}`, tags: ['account'] }).errors(errors);

export const securitySettingsContract = {
	'i/security/account/delete': route('i/security/account/delete').input(objectInput({ acknowledged: v.boolean() })).output(v.void()),
	'i/security/passkey/passwordless/start': route('i/security/passkey/passwordless/start').input(objectInput({})).output(v.strictObject({ ticket, options: webAuthnAuthenticationOptionsSchema })),
	'i/security/passkey/passwordless/complete': route('i/security/passkey/passwordless/complete').input(objectInput({ ticket, credential: webAuthnAuthenticationResponseSchema })).output(v.void()),
	'i/security/password-login/disable/start': route('i/security/password-login/disable/start').input(objectInput({})).output(v.strictObject({ ticket, options: webAuthnAuthenticationOptionsSchema })),
	'i/security/password-login/disable/complete': route('i/security/password-login/disable/complete').input(objectInput({ ticket, credential: webAuthnAuthenticationResponseSchema })).output(v.void()),
	'i/security/password': route('i/security/password').input(objectInput({ newPassword: v.pipe(v.string(), v.minLength(1), v.maxLength(1024)) })).output(v.void()),
	'i/security/email': route('i/security/email').input(objectInput({ email: v.nullable(v.pipe(v.string(), v.maxLength(320), v.email())) })).output(v.void()),
	'i/security/regenerate-token': route('i/security/regenerate-token').input(objectInput({})).output(v.void()),
	'i/security/state': route('i/security/state').input(objectInput({})).output(v.strictObject({
		totpEnabled: v.boolean(), passkeyMfaEnabled: v.boolean(), passwordlessEnabled: v.boolean(), passwordLoginDisabled: v.boolean(), hasVerifiedRecoveryEmail: v.boolean(),
		passkeyCount: v.number(), recoveryCodesRemaining: v.number(),
	})),
	'i/security/keys/list': route('i/security/keys/list').input(objectInput({})).output(v.array(v.strictObject({ id: v.string(), name: v.string(), lastUsedAt: v.string() }))),
	'i/security/passkey/register/start': route('i/security/passkey/register/start').input(objectInput({ name }))
		.output(v.strictObject({ ticket, options: webAuthnRegistrationOptionsSchema })),
	'i/security/passkey/register/complete': route('i/security/passkey/register/complete').input(objectInput({ ticket, credential: webAuthnRegistrationResponseSchema }))
		.output(v.strictObject({ id: v.string(), name: v.string() })),
	'i/security/passkey/mfa/start': route('i/security/passkey/mfa/start').input(objectInput({}))
		.output(v.strictObject({ ticket, options: webAuthnAuthenticationOptionsSchema, backupCodes: v.array(v.string()) })),
	'i/security/passkey/mfa/complete': route('i/security/passkey/mfa/complete').input(objectInput({
		ticket, credential: webAuthnAuthenticationResponseSchema, recoveryAcknowledged: v.boolean(),
	})).output(v.void()),
	'i/security/passkey/mfa/disable': route('i/security/passkey/mfa/disable').input(objectInput({ acknowledged: v.boolean() })).output(v.void()),
	'i/security/passkey/remove': route('i/security/passkey/remove').input(objectInput({ credentialId: keyId })).output(v.void()),
	'i/security/passkey/rename': route('i/security/passkey/rename').input(objectInput({ credentialId: keyId, name })).output(v.void()),
	'i/security/passkey/passwordless': route('i/security/passkey/passwordless').input(objectInput({ enabled: v.boolean() })).output(v.void()),
	'i/security/totp/start': route('i/security/totp/start').input(objectInput({})).output(v.strictObject({ secret: v.string(), url: v.string() })),
	'i/security/totp/complete': route('i/security/totp/complete').input(objectInput({ token: v.pipe(v.string(), v.minLength(1), v.maxLength(256)) })).output(codes),
	'i/security/totp/remove': route('i/security/totp/remove').input(objectInput({ confirmDisableMfa: v.boolean() })).output(v.void()),
	'i/security/recovery-codes': route('i/security/recovery-codes').input(objectInput({ regenerate: v.optional(v.boolean(), false) })).output(codes),
};
