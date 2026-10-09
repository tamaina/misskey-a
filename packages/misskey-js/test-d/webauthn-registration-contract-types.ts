// Compile-only fixture; never execute it.
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { I2faKeyDoneRequest } from '../src/entities.js';
import type { InferContractRouterInputs } from '@orpc/contract';
import type { authContract } from '../built/contracts/auth/backend/api.contract.js';
import type { PackedJsonValue } from '../built/contracts/users/backend/json-value.schema.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Native = InferContractRouterInputs<typeof authContract>['i/2fa/key-done'];
export type HonestNativeCredential = Assert<Equal<Native['credential'], PackedJsonValue>>;
export type NativeStillUntrusted = Assert<Native['credential'] extends RegistrationResponseJSON ? false : true>;
export type NativeGeneratedRequest = Assert<Equal<ContractEndpoints['i/2fa/key-done']['req']['credential'], PackedJsonValue>>;
export type ClientSpecializationPreserved = Assert<Equal<Endpoints['i/2fa/key-done']['req'], I2faKeyDoneRequest>>;
export type ClientCredentialPreserved = Assert<Equal<Endpoints['i/2fa/key-done']['req']['credential'], RegistrationResponseJSON>>;

export async function clientProof(client: APIClient, credential: RegistrationResponseJSON): Promise<void> {
	const result: { id: string; name: string } = await client.request('i/2fa/key-done', { password: 'test', name: 'Key', credential });
	const honestNative: Native = { password: 'test', name: 'Key', credential: {} };
	// @ts-expect-error The client convenience specialization remains richer than the wire validator.
	await client.request('i/2fa/key-done', honestNative);
	void result;
}
