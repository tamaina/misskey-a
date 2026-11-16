/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Compile-only: maintained aliases and the public client carry both continuations.
import type { SigninFlowResponse, SigninProgressChallenge } from '../src/entities.js';
import type { APIClient } from '../src/api.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export type ManualTotpContinuation = Assert<Equal<Extract<SigninFlowResponse, { next: 'totp' }>['authenticationProgress'], SigninProgressChallenge | undefined>>;
export type ManualPasskeyContinuation = Assert<Equal<Extract<SigninFlowResponse, { next: 'passkey' }>['authenticationProgress'], SigninProgressChallenge | undefined>>;

export async function clientProgress(client: APIClient): Promise<SigninProgressChallenge | undefined> {
	const response = await client.request('signin-flow', { username: 'synthetic', progressMode: 'v1' });
	if (!response.finished && (response.next === 'totp' || response.next === 'passkey')) return response.authenticationProgress;
	return undefined;
}
