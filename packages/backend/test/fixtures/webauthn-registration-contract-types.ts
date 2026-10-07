/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type * as v from 'valibot';
import type { inlineI2faKeyDoneInput, inlineI2faKeyDoneOutput } from '@features/auth/contract/endpoint-definitions.js';
import type { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import type { LegacyWebAuthnRegistrationConsumerInput } from '@features/auth/backend/legacy-webauthn-registration-consumer-endpoint.js';

type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Native = v.InferOutput<typeof inlineI2faKeyDoneInput>;
type Credential = Parameters<WebAuthnService['verifyRegistration']>[1];
export type HonestObject = Assert<Native['credential'] extends Record<string, unknown> ? true : false>;
export type NotAny = Assert<IsAny<Native['credential']> extends false ? true : false>;
export type NotWebAuthnValidation = Assert<Native['credential'] extends Credential ? false : true>;
export type ExplicitUncheckedBoundary = Assert<LegacyWebAuthnRegistrationConsumerInput['credential'] extends Credential ? true : false>;
export type DoesNotLeakBackToNative = Assert<Native extends LegacyWebAuthnRegistrationConsumerInput ? false : true>;
export type OptionalToken = Assert<undefined extends Native['token'] ? true : false>;
export type RequiredCredential = Assert<undefined extends Native['credential'] ? false : true>;
export type OutputFields = Assert<v.InferOutput<typeof inlineI2faKeyDoneOutput> extends { id: string; name: string } ? true : false>;
