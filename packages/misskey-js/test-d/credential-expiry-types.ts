// Compile-only synthetic fixture; never execute it.
import type { ContractEndpoints } from '../src/contract.types.js';
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export type OptionalExplicitExpiry = Assert<Equal<ContractEndpoints['miauth/gen-token']['req']['expiresAt'], string | null | undefined>>;
export type ListExpiryIsNullable = Assert<Equal<ContractEndpoints['i/apps']['res'][number]['expiresAt'], string | null>>;
export function explicitExpiryInputs() {
 const legacy: ContractEndpoints['miauth/gen-token']['req'] = { session: null, permission: [] };
 const bounded: ContractEndpoints['miauth/gen-token']['req'] = { ...legacy, expiresAt: '2099-01-01T00:00:00.000Z' };
 // @ts-expect-error The browser cannot supply an elevation receipt or choose another owner.
 const forged: ContractEndpoints['miauth/gen-token']['req'] = { ...legacy, sudoUntil: '2099-01-01T00:00:00Z', userId: 'other' };
 // @ts-expect-error Durations are not an alternate server policy or implicit expiry API.
 const duration: ContractEndpoints['auth/accept']['req'] = { token: 'synthetic', expiresIn: 60 };
 void bounded; void forged; void duration;
}
