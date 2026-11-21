// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { Endpoints } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { RelationshipsInputs, RelationshipsOutputs } from '../built/contracts/relationships/backend/endpoints/relationships.contract.js';
import type { BirthdaySelector } from '../built/contracts/relationships/backend/endpoints/birthday.schema.js';
import type { PackedJsonValue } from '../built/contracts/users/backend/json-value.schema.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Request = ContractEndpoints['users/get-following-users-by-birthday']['req'];
export type NativeNoAny = Assert<Equal<IsAny<RelationshipsInputs['users/get-following-users-by-birthday']>, false>>;
export type NativeResponseNoAny = Assert<Equal<IsAny<RelationshipsOutputs['users/get-following-users-by-birthday']>, false>>;
export type SdkRequestFromNative = Assert<Equal<Endpoints['users/get-following-users-by-birthday']['req'], Request>>;
export type OptionalLimit = Assert<Equal<Request['limit'], number | undefined>>;
export type OptionalOffset = Assert<Equal<Request['offset'], number | undefined>>;
export type ExactBirthdaySelector = Assert<Equal<Request['birthday'], BirthdaySelector>>;
export type ExtraBranchesRemainJson = Assert<Equal<Extract<Request['birthday'], { month: number; day: number }>['begin'], PackedJsonValue | undefined>>;
export async function requestAndResponseFixtures(client: APIClient): Promise<void> {
	const date: Request = { birthday: { month: 2, day: 31 }, offset: -1, limit: undefined };
	const range: Request = { birthday: { begin: { month: 12, day: 31 }, end: { month: 1, day: 1 } } };
	const inactiveExtras: Request = { birthday: { month: 1, day: 2, begin: null, end: null } };
	const result: RelationshipsOutputs['users/get-following-users-by-birthday'] = await client.request('users/get-following-users-by-birthday', date);
	// @ts-expect-error Birthday is required.
	const missing: Request = {};
	// @ts-expect-error Neither object branch is complete.
	const incomplete: Request = { birthday: { month: 1 } };
	// @ts-expect-error The date branch requires numeric month/day.
	const wrongType: Request = { birthday: { month: '1', day: 2 } };
	void [date, range, inactiveExtras, result, missing, incomplete, wrongType];
}
