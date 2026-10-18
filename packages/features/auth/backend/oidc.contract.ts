/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { localUsernameSchema, passwordSchema } from '../../users/backend/user-validation.schema.js';
import { webAuthnAuthenticationOptionsSchema, webAuthnAuthenticationResponseSchema } from './webauthn.schema.js';

const id = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/), v.maxLength(32));
const opaque = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/));
const text = (max: number) => v.pipe(v.string(), v.minLength(1), v.maxLength(max));
const errors = { ...commonErrors, OIDC_FAILED: { status: 400, data: apiErrorData } } as const;
const base = { secure: true, limit: { duration: 60_000, max: 10, key: 'oidc' } } as const;
const route = <Name extends string>(name: Name, policy: ApiProcedureMetadata = {}) => oc.$meta({ ...base, ...policy, requestName: name } as const).route({ method: 'POST', path: `/${name}`, tags: ['auth'] }).errors(errors);
const flow = v.union([
	v.strictObject({ next: v.literal('link'), providerId: id, issuer: v.string(), subject: v.string() }),
	v.strictObject({ next: v.literal('onboarding'), emailSent: v.boolean(), termsUrl: v.nullable(v.string()) }),
	v.strictObject({ next: v.literal('login'), factors: v.array(v.picklist(['totp', 'recovery', 'passkey'])), options: v.exactOptional(webAuthnAuthenticationOptionsSchema) }),
]);
const provider = v.strictObject({ id, name: text(100) });
export const oidcContract = {
	'oidc/providers': route('oidc/providers', { secure: false }).input(objectInput({})).output(v.array(provider)),
	'oidc/start': route('oidc/start', { secure: false }).input(objectInput({ providerId: id })).output(v.strictObject({ url: v.string() })),
	'oidc/callback': route('oidc/callback', { secure: false }).input(objectInput({ providerId: id, state: opaque, code: v.exactOptional(text(4096)) })).output(v.union([v.strictObject({ canceled: v.literal(true) }), v.strictObject({ ticket: opaque, flow })])),
	'oidc/status': route('oidc/status', { secure: false }).input(objectInput({ ticket: opaque })).output(flow),
	'oidc/cancel': route('oidc/cancel', { secure: false }).input(objectInput({ ticket: opaque })).output(v.void()),
	'oidc/login': route('oidc/login', { secure: false }).input(objectInput({ ticket: opaque, token: v.exactOptional(text(128)), credential: v.exactOptional(webAuthnAuthenticationResponseSchema) })).output(v.strictObject({ finished: v.literal(true), id, i: v.string() })),
	'oidc/onboarding': route('oidc/onboarding', { secure: false, limit: { duration: 3_600_000, max: 3, key: 'oidc-onboarding' } }).input(objectInput({ ticket: opaque, username: localUsernameSchema, password: passwordSchema, email: v.pipe(text(128), v.email()), agree: v.boolean(), invitationCode: v.exactOptional(text(128)), captcha: v.exactOptional(v.record(v.string(), v.string())) })).output(v.void()),
	'oidc/onboarding/verify': route('oidc/onboarding/verify', { secure: false }).input(objectInput({ ticket: opaque, code: v.pipe(v.string(), v.regex(/^[a-f0-9]{32}$/)) })).output(v.strictObject({ finished: v.literal(true), id, i: v.string() })),
	'i/oidc/links': route('i/oidc/links', { requireCredential: true }).input(objectInput({})).output(v.array(v.strictObject({ id, providerId: id, providerName: v.string(), issuer: v.string(), createdAt: v.string() }))),
	'i/oidc/link/start': route('i/oidc/link/start', { requireCredential: true }).input(objectInput({ providerId: id })).output(v.strictObject({ url: v.string() })),
	'i/oidc/link/complete': route('i/oidc/link/complete', { requireCredential: true }).input(objectInput({ ticket: opaque, agree: v.boolean() })).output(v.void()),
	'i/oidc/unlink': route('i/oidc/unlink', { requireCredential: true }).input(objectInput({ id })).output(v.void()),
	'admin/oidc/providers': route('admin/oidc/providers', { requireCredential: true, requireAdmin: true }).input(objectInput({})).output(v.array(v.strictObject({ ...provider.entries, version: opaque, enabled: v.boolean(), issuer: v.string(), clientId: v.string(), redirectUri: v.string() }))),
	'admin/oidc/create': route('admin/oidc/create', { requireCredential: true, requireAdmin: true }).input(objectInput({ name: text(100) })).output(v.strictObject({ id, redirectUri: v.string() })),
	'admin/oidc/update': route('admin/oidc/update', { requireCredential: true, requireAdmin: true }).input(objectInput({ id, version: opaque, name: text(100), issuer: v.pipe(v.string(), v.maxLength(2048), v.regex(/^[\x21-\x7E]*$/)), clientId: v.pipe(v.string(), v.maxLength(2048)), clientSecret: v.exactOptional(text(2048)), clearClientSecret: v.exactOptional(v.literal(true)), enabled: v.boolean() })).output(v.strictObject({ version: opaque })),
};
