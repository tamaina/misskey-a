// Compile-only fixture; never execute it.
import type { APIClient } from '../src/api.js';
import type { Endpoints, SwitchCaseResponseType } from '../src/api.types.js';
import type { ContractEndpoints } from '../src/contract.types.js';
import type { UsersShowRequest } from '../src/autogen/entities.js';
import type { UserDetailed } from '../src/autogen/models.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type { usersShowContract } from '../built/contracts/users/backend/endpoints/users/show.contract.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type Request = ContractEndpoints['users/show']['req'];
export type NativeNoAny = Assert<Equal<IsAny<InferContractRouterInputs<typeof usersShowContract>>, false>>;
export type NativeResponseNoAny = Assert<Equal<IsAny<InferContractRouterOutputs<typeof usersShowContract>>, false>>;
export type SdkNoAny = Assert<Equal<IsAny<Request>, false>>;
export type SdkRequestFromNative = Assert<Equal<Endpoints['users/show']['req'], Request>>;
export type ExistingDeclaredRequest = Assert<Equal<Request, UsersShowRequest>>;
export type OptionalHostUndefined = Assert<Equal<undefined extends Required<Request>['host'] ? true : false, true>>;
export type UncertainSelectorResponse = Assert<Equal<SwitchCaseResponseType<'users/show', Request>, UserDetailed | UserDetailed[]>>;
export type ScalarSelectorUnionResponse = Assert<Equal<SwitchCaseResponseType<'users/show', { userId: string } | { username: string; host?: string | null }>, UserDetailed>>;
export type NativeInactiveIds = Assert<Equal<InferContractRouterInputs<typeof usersShowContract>['userIds'], string[] | undefined>>;

export async function requestAndResponseFixtures(client: APIClient): Promise<void> {
	const id: Request = { userId: 'a', host: undefined };
	const ids: Request = { userIds: [], host: null };
	const name: Request = { username: '', host: 'example.test' };
	const scalarById: UserDetailed = await client.request('users/show', { userId: 'a' });
	const scalarByName: UserDetailed = await client.request('users/show', { username: 'alice', host: null });
	const list: UserDetailed[] = await client.request('users/show', { userIds: ['a', 'b'] });
	const emptyList: UserDetailed[] = await client.request('users/show', { userIds: [] });
	const overlappingList: UserDetailed[] = await client.request('users/show', { userId: 'a', userIds: ['a'] });
	// @ts-expect-error At least one selector remains required.
	const absent: Request = {};
	// @ts-expect-error List elements remain strings.
	const badIds: Request = { userIds: [1] };
	// @ts-expect-error Scalar ID remains string.
	const badId: Request = { userId: 42 };
	// @ts-expect-error Username remains string.
	const badName: Request = { username: 42 };
	// @ts-expect-error Host remains nullable string.
	const badHost: Request = { userId: 'a', host: 42 };
	// @ts-expect-error SDK response convenience keeps scalar requests scalar.
	const incorrectList: UserDetailed[] = await client.request('users/show', { userId: 'a' });
	// @ts-expect-error SDK response convenience keeps list requests arrays.
	const incorrectScalar: UserDetailed = await client.request('users/show', { userIds: ['a'] });
	void [id, ids, name, scalarById, scalarByName, list, emptyList, overlappingList, absent, badIds, badId, badName, badHost, incorrectList, incorrectScalar];
}
