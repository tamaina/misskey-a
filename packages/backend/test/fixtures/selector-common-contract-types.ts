/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ContractEndpointInput } from '../../src/server/api/contract-endpoint.js';
import type { allOfAdminEmojiUpdateInput } from '../../../features/emojis/contract/selector-common-endpoint-definitions.js';
import type { allOfNotesSearchByTagInput, allOfUsersSearchByUsernameAndHostInput } from '../../../features/discovery/contract/selector-common-endpoint-definitions.js';
import type { allOfUsersFollowersInput, allOfUsersFollowingInput } from '../../../features/relationships/contract/selector-common-endpoint-definitions.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export type Native0 = Assert<Equal<ContractEndpointInput<typeof allOfAdminEmojiUpdateInput>, v.InferOutput<typeof allOfAdminEmojiUpdateInput>>>;
export type Unknown0 = Assert<Equal<v.InferOutput<typeof allOfAdminEmojiUpdateInput>["id"], unknown>>;
export type Default1Reply = Assert<Equal<undefined extends v.InferOutput<typeof allOfNotesSearchByTagInput>["reply"] ? true : false, false>>;
export type Default1Renote = Assert<Equal<undefined extends v.InferOutput<typeof allOfNotesSearchByTagInput>["renote"] ? true : false, false>>;
export type Default1WithFiles = Assert<Equal<undefined extends v.InferOutput<typeof allOfNotesSearchByTagInput>["withFiles"] ? true : false, false>>;
export type Default1Poll = Assert<Equal<undefined extends v.InferOutput<typeof allOfNotesSearchByTagInput>["poll"] ? true : false, false>>;
export type Default1Limit = Assert<Equal<undefined extends v.InferOutput<typeof allOfNotesSearchByTagInput>["limit"] ? true : false, false>>;
export type Native1 = Assert<Equal<ContractEndpointInput<typeof allOfNotesSearchByTagInput>, v.InferOutput<typeof allOfNotesSearchByTagInput>>>;
export type Unknown1 = Assert<Equal<v.InferOutput<typeof allOfNotesSearchByTagInput>["tag"], unknown>>;
export type Default2Limit = Assert<Equal<undefined extends v.InferOutput<typeof allOfUsersFollowersInput>["limit"] ? true : false, false>>;
export type Native2 = Assert<Equal<ContractEndpointInput<typeof allOfUsersFollowersInput>, v.InferOutput<typeof allOfUsersFollowersInput>>>;
export type Unknown2 = Assert<Equal<v.InferOutput<typeof allOfUsersFollowersInput>["userId"], unknown>>;
export type Default3Limit = Assert<Equal<undefined extends v.InferOutput<typeof allOfUsersFollowingInput>["limit"] ? true : false, false>>;
export type Native3 = Assert<Equal<ContractEndpointInput<typeof allOfUsersFollowingInput>, v.InferOutput<typeof allOfUsersFollowingInput>>>;
export type Unknown3 = Assert<Equal<v.InferOutput<typeof allOfUsersFollowingInput>["userId"], unknown>>;
export type Default4Limit = Assert<Equal<undefined extends v.InferOutput<typeof allOfUsersSearchByUsernameAndHostInput>["limit"] ? true : false, false>>;
export type Default4Detail = Assert<Equal<undefined extends v.InferOutput<typeof allOfUsersSearchByUsernameAndHostInput>["detail"] ? true : false, false>>;
export type Native4 = Assert<Equal<ContractEndpointInput<typeof allOfUsersSearchByUsernameAndHostInput>, v.InferOutput<typeof allOfUsersSearchByUsernameAndHostInput>>>;
export type Unknown4 = Assert<Equal<v.InferOutput<typeof allOfUsersSearchByUsernameAndHostInput>["username"], unknown>>;

export function presenceFixture(value: v.InferOutput<typeof allOfUsersFollowersInput>, legacy: ContractEndpointInput<typeof allOfUsersFollowersInput, 'legacy-declared'>): void {
	if ('userId' in value) {
		// @ts-expect-error Inactive selector values remain unknown in native inference.
		const unsafe: string = value.userId; void unsafe;
	}
	if ('userId' in legacy) { const id: string = legacy.userId; void id; }
	const limit: number = value.limit; void limit;
}
