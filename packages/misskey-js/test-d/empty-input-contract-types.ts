import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { EmptyInputEndpoints as AuthEndpoints } from '../built/contracts/auth/contract/empty-input-endpoint-definitions.js';
import type { EmptyInputEndpoints as GamesEndpoints } from '../built/contracts/games/contract/empty-input-endpoint-definitions.js';
import type { CaptchaProvider } from '../built/contracts/auth/contract/captcha-providers.js';
import type { Packed } from '../built/contracts/index/contract/packed.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Native = AuthEndpoints & GamesEndpoints;
export type NativeCaptchaRequest = Assert<Equal<Native['admin/captcha/current']['req'], unknown>>;
export type NativeInvitationsRequest = Assert<Equal<Native['reversi/invitations']['req'], unknown>>;
export type ContractCaptchaRequest = Assert<Equal<ContractEndpoints['admin/captcha/current']['req'], unknown>>;
export type ContractInvitationsRequest = Assert<Equal<ContractEndpoints['reversi/invitations']['req'], unknown>>;
export type SdkCaptchaRequest = Assert<Equal<Endpoints['admin/captcha/current']['req'], unknown>>;
export type SdkInvitationsRequest = Assert<Equal<Endpoints['reversi/invitations']['req'], unknown>>;
export type NativeInvitationsResponse = Assert<Equal<Native['reversi/invitations']['res'], Packed<'UserLite'>[]>>;
export type SdkInvitationsResponse = Assert<Equal<Endpoints['reversi/invitations']['res'], Packed<'UserLite'>[]>>;
export type SdkCaptchaResponse = Assert<Equal<Endpoints['admin/captcha/current']['res'], Native['admin/captcha/current']['res']>>;

type CaptchaSetting = {
	provider: CaptchaProvider;
	hcaptcha: { siteKey: string | null; secretKey: string | null };
	mcaptcha: { siteKey: string | null; secretKey: string | null; instanceUrl: string | null };
	recaptcha: { siteKey: string | null; secretKey: string | null };
	turnstile: { siteKey: string | null; secretKey: string | null };
};
export function checkCaptchaShape(native: Native['admin/captcha/current']['res'], expected: CaptchaSetting): void {
	const toServiceShape: CaptchaSetting = native;
	const toNativeShape: Native['admin/captcha/current']['res'] = expected;
	void toServiceShape;
	void toNativeShape;
	// @ts-expect-error provider literals must remain the supported captcha tuple.
	const badProvider: Native['admin/captcha/current']['res']['provider'] = 'unrecognized';
	void badProvider;
}

export async function checkEmptyRequests(client: APIClient): Promise<void> {
	const captcha: Promise<Native['admin/captcha/current']['res']> = client.request('admin/captcha/current');
	const invitations: Promise<Packed<'UserLite'>[]> = client.request('reversi/invitations');
	void captcha;
	void invitations;
	for (const endpoint of ['admin/captcha/current', 'reversi/invitations'] as const) {
		await client.request(endpoint);
		await client.request(endpoint, {});
		await client.request(endpoint, { extra: { retained: true } });
		await client.request(endpoint, undefined);
		await client.request(endpoint, null);
		await client.request(endpoint, 42);
		await client.request(endpoint, 'ignored');
		await client.request(endpoint, false);
		await client.request(endpoint, ['ignored']);
		const value: unknown = null;
		await client.request(endpoint, value);
		const nativeRequest: Native[typeof endpoint]['req'] = value;
		void nativeRequest;
	}
}
