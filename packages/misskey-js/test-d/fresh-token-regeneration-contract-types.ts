// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { ContractEndpoints } from '../src/contract.types.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Start = ContractEndpoints['i/regenerate-token/passkey/start'];
type Complete = ContractEndpoints['i/regenerate-token/passkey/complete'];
export type ExactStartKeys = Assert<Equal<keyof Start['res'], 'ticket' | 'options'>>;
export type NoCredentialResponse = Assert<Equal<Complete['res'], null>>;
export type ExactCompletion = Assert<Equal<keyof Complete['req'], 'ticket' | 'credential'>>;

export async function scopedTokenRegeneration(client: APIClient, credential: Complete['req']['credential']): Promise<void> {
	const started = await client.request('i/regenerate-token/passkey/start', { currentPassword: 'synthetic' });
	const result = await client.request('i/regenerate-token/passkey/complete', { ticket: started.ticket, credential });
	const completed: null = result;
	// @ts-expect-error Completion returns no replacement credential.
	const token: string = result.token;
	// @ts-expect-error The finite request shape carries no selectable fresh purpose.
	const wrongPurpose: Complete['req'] = { ticket: started.ticket, credential, purpose: 'change-password' };
	void completed; void token; void wrongPurpose;
}
