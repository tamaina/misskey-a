import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { authContract } from '../built/contracts/auth/backend/api.contract.js';
import type { PackedJsonValue } from '../built/contracts/users/backend/json-value.schema.js';
import type { reversiInvitationsContract } from '../built/contracts/games/backend/endpoints/reversi/invitations.contract.js';
import type { supportedCaptchaProviders } from '../built/contracts/auth/backend/auth.schema.js';
type CaptchaProvider = typeof supportedCaptchaProviders[number];
import type { Packed } from '../built/contracts/index/backend/packed.schema.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type NativeRouter = typeof authContract & { 'reversi/invitations': typeof reversiInvitationsContract };
type NativeInputs = InferContractRouterInputs<NativeRouter>;
type NativeOutputs = InferContractRouterOutputs<NativeRouter>;
type Native = { [Name in keyof NativeRouter]: { req: NativeInputs[Name]; res: NativeOutputs[Name] } };
export type NativeCaptchaRequest = Assert<Equal<Native['admin/captcha/current']['req'], PackedJsonValue | undefined>>;
export type NativeInvitationsRequest = Assert<Equal<Native['reversi/invitations']['req'], PackedJsonValue | undefined>>;
export type ContractCaptchaRequest = Assert<Equal<ContractEndpoints['admin/captcha/current']['req'], PackedJsonValue | undefined>>;
export type ContractInvitationsRequest = Assert<Equal<ContractEndpoints['reversi/invitations']['req'], PackedJsonValue | undefined>>;
export type SdkCaptchaRequest = Assert<Equal<Endpoints['admin/captcha/current']['req'], PackedJsonValue | undefined>>;
export type SdkInvitationsRequest = Assert<Equal<Endpoints['reversi/invitations']['req'], PackedJsonValue | undefined>>;
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
		// @ts-expect-error Untrusted unknown must establish finite JSON before becoming a native DTO.
		const nativeRequest: Native[typeof endpoint]['req'] = value;
		void nativeRequest;
	}
}
