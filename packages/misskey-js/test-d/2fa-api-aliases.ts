/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import type { Endpoints } from '../src/api.types.js';
import type { I2faKeyDoneRequest, I2faPasskeyDoneRequest, I2faRegisterKeyResponse, I2faPasskeyRegisterResponse } from '../src/entities.js';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Pairs = [
	['i/2fa/done', 'i/2fa/totp/done'],
	['i/2fa/register', 'i/2fa/totp/register'],
	['i/2fa/unregister', 'i/2fa/totp/remove'],
	['i/2fa/key-done', 'i/2fa/passkey/done'],
	['i/2fa/register-key', 'i/2fa/passkey/register'],
	['i/2fa/remove-key', 'i/2fa/passkey/remove'],
	['i/2fa/update-key', 'i/2fa/passkey/update'],
	['i/2fa/password-less', 'i/2fa/passkey/password-less'],
];
type Parity = Assert<Equal<{ [K in keyof Pairs]: Pairs[K] extends [infer Old extends keyof Endpoints, infer New extends keyof Endpoints] ? Equal<Endpoints[Old], Endpoints[New]> : true }[number], true>>;
type Done = Assert<Equal<I2faPasskeyDoneRequest, I2faKeyDoneRequest>>;
type Register = Assert<Equal<I2faPasskeyRegisterResponse, I2faRegisterKeyResponse>>;
type FiniteEndpointKeys = Assert<Equal<string extends keyof Endpoints ? true : false, false>>;
type DoneNotAny = Assert<Equal<IsAny<Endpoints['i/2fa/passkey/done']['req']>, false>>;
declare const credential: RegistrationResponseJSON;
const done: Endpoints['i/2fa/passkey/done']['req'] = { credential, name: 'Synthetic key', password: 'Synthetic password' };
const publicDone: I2faPasskeyDoneRequest = done;
// @ts-expect-error Canonical routes retain required registration credentials.
const missingCredential: Endpoints['i/2fa/passkey/done']['req'] = { name: 'Synthetic key', password: 'Synthetic password' };
// @ts-expect-error Canonical routes retain required passwords.
const missingPassword: Endpoints['i/2fa/totp/register']['req'] = {};
