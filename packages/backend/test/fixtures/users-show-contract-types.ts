/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { Packed } from '@features/index/contract/packed.js';
import type { ContractEndpointInput } from '@features/api/backend/transport/contract-endpoint.js';
import type { usersShowInput, usersShowOutput, usersShowSelector } from '@features/users/contract/show-endpoint-definition.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type NativeInput = v.InferInput<typeof usersShowInput>;
type NativeOutput = v.InferOutput<typeof usersShowInput>;
type Legacy = ContractEndpointInput<typeof usersShowInput, 'legacy-declared'>;
export type TupleLength = Assert<Equal<typeof usersShowSelector.options['length'], 3>>;
export type FirstOption = Assert<Equal<v.InferInput<typeof usersShowSelector.options[0]>['userId'], string>>;
export type SecondOption = Assert<Equal<v.InferInput<typeof usersShowSelector.options[1]>['userIds'], string[]>>;
export type ThirdOption = Assert<Equal<v.InferInput<typeof usersShowSelector.options[2]>['username'], string>>;
export type NativeMode = Assert<Equal<ContractEndpointInput<typeof usersShowInput>, NativeOutput>>;
export type InactiveId = Assert<Equal<NativeOutput['userId'], unknown>>;
export type InactiveIds = Assert<Equal<NativeOutput['userIds'], unknown>>;
export type InactiveName = Assert<Equal<NativeOutput['username'], unknown>>;
export type Host = Assert<Equal<NativeOutput['host'], string | null | undefined>>;
export type NoInputAny = Assert<Equal<IsAny<NativeInput>, false>>;
export type NoParsedAny = Assert<Equal<IsAny<NativeOutput>, false>>;
export type NoOutputAny = Assert<Equal<IsAny<v.InferOutput<typeof usersShowOutput>>, false>>;
export type Response = Assert<Equal<v.InferOutput<typeof usersShowOutput>, Packed<'UserDetailed'> | Packed<'UserDetailed'>[]>>;
export type LegacyShape = Assert<Equal<Legacy,
	{ userId: string; host?: string | null | undefined }
	| { userIds: string[]; host?: string | null | undefined }
	| { username: string; host?: string | null | undefined }
>>;

export function unchangedStructuralNarrowing(native: NativeOutput, legacy: Legacy): void {
	if ('userIds' in native) {
		// @ts-expect-error Present inactive extras are still unknown in canonical native inference.
		const unsafe: string[] = native.userIds; void unsafe;
	}
	if ('username' in native) {
		// @ts-expect-error Native inference does not validate present inactive selector values.
		const unsafe: string = native.username; void unsafe;
	}
	if ('userIds' in legacy) { const ids: string[] = legacy.userIds; void ids; }
	if ('username' in legacy) { const name: string = legacy.username; void name; }
}
