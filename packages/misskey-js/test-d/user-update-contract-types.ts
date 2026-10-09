// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { iUpdateContract } from '../built/contracts/users/backend/endpoints/i/update.contract.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Request = ContractEndpoints['i/update']['req'];
export type NativeNoAny = Assert<Equal<IsAny<InferContractRouterInputs<typeof iUpdateContract>>, false>>;
export type NativeResponseNoAny = Assert<Equal<IsAny<InferContractRouterOutputs<typeof iUpdateContract>>, false>>;
export type SdkNoAny = Assert<Equal<IsAny<Request>, false>>;
export type SdkRequestFromNative = Assert<Equal<Endpoints['i/update']['req'], Request>>;
export type MixedMuteWords = Assert<Equal<Request['mutedWords'], (string | string[])[] | undefined>>;
export type OptionalNameUndefined = Assert<Equal<Request['name'], string | null | undefined>>;
export type OptionalLanguageUndefined = Assert<Equal<undefined extends Required<Request>['lang'] ? true : false, true>>;
export type NotificationNoAny = Assert<Equal<IsAny<NonNullable<Request['notificationRecieveConfig']>['note']>, false>>;

export async function requestAndResponseFixtures(client: APIClient): Promise<void> {
	const empty: Request = {};
	const undefineds: Request = { name: undefined, lang: undefined, notificationRecieveConfig: { note: undefined } };
	const mixed: Request = { mutedWords: ['', [], ['x'], 'x'], notificationRecieveConfig: { note: { type: 'all' }, follow: { type: 'list', userListId: 'A' } } };
	const result: InferContractRouterOutputs<typeof iUpdateContract> = await client.request('i/update', mixed);
	// @ts-expect-error Native list rules require a userListId.
	const absentList: Request = { notificationRecieveConfig: { note: { type: 'list' } } };
	// @ts-expect-error Native mute items remain strings or string arrays.
	const badMute: Request = { mutedWords: [1] };
	// @ts-expect-error Unknown language values are excluded from the canonical map.
	const badLanguage: Request = { lang: 'not-a-language' };
	// @ts-expect-error Notification types are a closed discriminator set.
	const badMode: Request = { notificationRecieveConfig: { note: { type: 'unknown' } } };
	void [empty, undefineds, mixed, result, absentList, badMute, badLanguage, badMode];
}
