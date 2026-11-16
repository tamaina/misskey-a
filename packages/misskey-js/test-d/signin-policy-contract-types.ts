// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { SigninFlowResponse, SigninWithPasskeyResponse } from '../src/entities.js';
import type { ContractEndpoints } from '../src/contract.types.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Native = ContractEndpoints['signin-with-passkey']['res'];
export type FinitePasswordFlow = Assert<Equal<Extract<Native, { passwordFlowRequired: true }>, { passwordFlowRequired: true }>>;
export type RecoveryFactor = Assert<'recovery' extends NonNullable<Extract<SigninFlowResponse, { next: 'passkey' }>['availableFactors']>[number] ? true : false>;

export async function clientProof(client: APIClient): Promise<void> {
	const result = await client.request('signin-with-passkey', { context: 'synthetic', credential: {} as never });
	const explicit: SigninWithPasskeyResponse = { passwordFlowRequired: true };
	if (result.passwordFlowRequired) {
		// @ts-expect-error A password-flow redirect is not a completed login credential.
		const token: string = result.signinResponse.i;
		void token;
	} else {
		const token: string = result.signinResponse.i;
		void token;
	}
	// @ts-expect-error Both outcomes are mutually exclusive.
	const mixed: SigninWithPasskeyResponse = { passwordFlowRequired: true, signinResponse: { finished: true, id: 'synthetic', i: 'synthetic' } };
	void explicit; void mixed;
}
