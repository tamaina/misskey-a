// Compile-only synthetic fixture; never execute it.
import type { ContractEndpoints } from '../src/contract.types.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Start = ContractEndpoints['oidc/start'];
type Callback = ContractEndpoints['oidc/callback'];
type PublicProvider = ContractEndpoints['oidc/providers']['res'][number];
type AdminProvider = ContractEndpoints['admin/oidc/providers']['res'][number];
export type ServerOwnedProviderSelection = Assert<Equal<keyof Start['req'], 'providerId'>>;
export type NoBrowserSecretResponse = Assert<Equal<keyof Start['res'], 'url'>>;
export type CallbackHasNoSelectedOwner = Assert<Equal<keyof Callback['req'], 'providerId' | 'state' | 'code'>>;
export type OnlyPublicProviderMetadata = Assert<Equal<keyof PublicProvider, 'id' | 'name'>>;
export type SecretNeverReadable = Assert<Equal<Extract<keyof AdminProvider, 'clientSecret'>, never>>;

export function finiteOidcInputs() {
	// @ts-expect-error The browser cannot select an arbitrary issuer or redirect URI.
	const forgedStart: Start['req'] = { providerId: 'synthetic', issuer: 'https://other.invalid', redirectUri: 'https://other.invalid/callback' };
	// @ts-expect-error Local identity is derived from fresh individual-session authentication.
	const forgedLink: ContractEndpoints['i/oidc/link/complete']['req'] = { ticket: 'synthetic', agree: true, userId: 'other' };
	void forgedStart; void forgedLink;
}
