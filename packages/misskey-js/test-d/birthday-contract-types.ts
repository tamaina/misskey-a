// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { BirthdayEndpoints } from '../built/contracts/relationships/contract/birthday-endpoint-definitions.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Request = ContractEndpoints['users/get-following-users-by-birthday']['req'];
export type NativeNoAny = Assert<Equal<IsAny<BirthdayEndpoints['users/get-following-users-by-birthday']['req']>, false>>;
export type NativeResponseNoAny = Assert<Equal<IsAny<BirthdayEndpoints['users/get-following-users-by-birthday']['res']>, false>>;
export type SdkRequestFromNative = Assert<Equal<Endpoints['users/get-following-users-by-birthday']['req'], Request>>;
export type OptionalLimit = Assert<Equal<Request['limit'], number | undefined>>;
export type OptionalOffset = Assert<Equal<Request['offset'], number | undefined>>;
export type ExtraBranchesRemainUnknown = Assert<Equal<Request['birthday']['begin'], unknown>>;
export async function requestAndResponseFixtures(client: APIClient): Promise<void> {
	const date: Request = { birthday: { month: 2, day: 31 }, offset: -1, limit: undefined };
	const range: Request = { birthday: { begin: { month: 12, day: 31 }, end: { month: 1, day: 1 } } };
	const inactiveExtras: Request = { birthday: { month: 1, day: 2, begin: null, end: null } };
	const result: BirthdayEndpoints['users/get-following-users-by-birthday']['res'] = await client.request('users/get-following-users-by-birthday', date);
	// @ts-expect-error Birthday is required.
	const missing: Request = {};
	// @ts-expect-error Neither object branch is complete.
	const incomplete: Request = { birthday: { month: 1 } };
	// @ts-expect-error The date branch requires numeric month/day.
	const wrongType: Request = { birthday: { month: '1', day: 2 } };
	void [date, range, inactiveExtras, result, missing, incomplete, wrongType];
}
