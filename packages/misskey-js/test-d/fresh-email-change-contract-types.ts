// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { ContractEndpoints } from '../src/contract.types.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Start = ContractEndpoints['i/update-email/passkey/start'];
type Complete = ContractEndpoints['i/update-email/passkey/complete'];
export type ExactStartKeys = Assert<Equal<keyof Start['req'], 'currentPassword' | 'email'>>;
export type ExactStartResponse = Assert<Equal<keyof Start['res'], 'ticket' | 'options'>>;
export type ExactCompletion = Assert<Equal<keyof Complete['req'], 'ticket' | 'credential' | 'email'>>;
export type ExactTarget = Assert<Equal<Complete['req']['email'], string | null>>;
export type NoCredentialResponse = Assert<Equal<Complete['res'], null>>;

export async function scopedEmailChange(client: APIClient, credential: Complete['req']['credential']): Promise<void> {
	const started = await client.request('i/update-email/passkey/start', { currentPassword: 'synthetic', email: 'new@example.test' });
	const result = await client.request('i/update-email/passkey/complete', { ticket: started.ticket, credential, email: 'new@example.test' });
	const completed: null = result;
	// @ts-expect-error The target cannot be omitted.
	const missing: Complete['req'] = { ticket: started.ticket, credential };
	// @ts-expect-error Callers cannot select a purpose or substitute internal target state.
	const forged: Complete['req'] = { ticket: started.ticket, credential, email: null, purpose: 'change-password', targetStamp: 'forged' };
	// @ts-expect-error Completion returns no replacement credential.
	const token: string = result.token;
	void completed; void missing; void forged; void token;
}
