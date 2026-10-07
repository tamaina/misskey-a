// Compile-only fixture; never execute it.
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { I2faKeyDoneRequest } from '../src/entities.js';
import type { NativeInlineEndpoints } from '../built/contracts/auth/contract/endpoint-definitions.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Native = NativeInlineEndpoints['i/2fa/key-done']['req'];
export type HonestNativeCredential = Assert<Equal<Native['credential'], Record<string, unknown>>>;
export type NativeStillUntrusted = Assert<Native['credential'] extends RegistrationResponseJSON ? false : true>;
export type NativeGeneratedRequest = Assert<Equal<ContractEndpoints['i/2fa/key-done']['req']['credential'], Record<string, unknown>>>;
export type ClientSpecializationPreserved = Assert<Equal<Endpoints['i/2fa/key-done']['req'], I2faKeyDoneRequest>>;
export type ClientCredentialPreserved = Assert<Equal<Endpoints['i/2fa/key-done']['req']['credential'], RegistrationResponseJSON>>;

export async function clientProof(client: APIClient, credential: RegistrationResponseJSON): Promise<void> {
	const result: { id: string; name: string } = await client.request('i/2fa/key-done', { password: 'test', name: 'Key', credential });
	const honestNative: Native = { password: 'test', name: 'Key', credential: {} };
	// @ts-expect-error The client convenience specialization remains richer than the wire validator.
	await client.request('i/2fa/key-done', honestNative);
	void result;
}
