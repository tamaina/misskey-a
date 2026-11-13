// Compile-only test-d fixture; never execute it.
import type { ContractEndpoints } from '../src/contract.types.js';
import type { InferContractRouterInputs } from '@orpc/contract';
import type { emojisContract } from '../built/contracts/emojis/backend/api.definition.js';
import type { notesSearchByTagContract, usersSearchByUsernameAndHostContract } from '../built/contracts/discovery/backend/endpoints/discovery.contract.js';
import type { UsersFollowersContract, UsersFollowingContract } from '../built/contracts/relationships/backend/endpoints/relationships.contract.js';

type Assert<T extends true> = T;
type Equal<A,B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;

type Native0 = InferContractRouterInputs<typeof emojisContract['update']>;
export type Sdk0 = Assert<Equal<ContractEndpoints["admin/emoji/update"]['req'], Native0>>;
export type Option0_fileId = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["fileId"] ? true : false, true>>;
export type Option0_category = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["category"] ? true : false, true>>;
export type Option0_aliases = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["aliases"] ? true : false, true>>;
export type Option0_license = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["license"] ? true : false, true>>;
export type Option0_isSensitive = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["isSensitive"] ? true : false, true>>;
export type Option0_localOnly = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["localOnly"] ? true : false, true>>;
export type Option0_roleIdsThatCanBeUsedThisEmojiAsReaction = Assert<Equal<undefined extends Required<ContractEndpoints["admin/emoji/update"]['req']>["roleIdsThatCanBeUsedThisEmojiAsReaction"] ? true : false, true>>;

type Native1 = InferContractRouterInputs<typeof notesSearchByTagContract>;
export type Sdk1 = Assert<Equal<ContractEndpoints["notes/search-by-tag"]['req'], Native1>>;
export type Option1_reply = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["reply"] ? true : false, true>>;
export type Option1_renote = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["renote"] ? true : false, true>>;
export type Option1_withFiles = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["withFiles"] ? true : false, true>>;
export type Option1_poll = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["poll"] ? true : false, true>>;
export type Option1_sinceId = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["sinceId"] ? true : false, true>>;
export type Option1_untilId = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["untilId"] ? true : false, true>>;
export type Option1_sinceDate = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["sinceDate"] ? true : false, true>>;
export type Option1_untilDate = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["untilDate"] ? true : false, true>>;
export type Option1_limit = Assert<Equal<undefined extends Required<ContractEndpoints["notes/search-by-tag"]['req']>["limit"] ? true : false, true>>;

type Native2 = InferContractRouterInputs<typeof UsersFollowersContract>;
export type Sdk2 = Assert<Equal<ContractEndpoints["users/followers"]['req'], Native2>>;
export type Option2_sinceId = Assert<Equal<undefined extends Required<ContractEndpoints["users/followers"]['req']>["sinceId"] ? true : false, true>>;
export type Option2_untilId = Assert<Equal<undefined extends Required<ContractEndpoints["users/followers"]['req']>["untilId"] ? true : false, true>>;
export type Option2_sinceDate = Assert<Equal<undefined extends Required<ContractEndpoints["users/followers"]['req']>["sinceDate"] ? true : false, true>>;
export type Option2_untilDate = Assert<Equal<undefined extends Required<ContractEndpoints["users/followers"]['req']>["untilDate"] ? true : false, true>>;
export type Option2_limit = Assert<Equal<undefined extends Required<ContractEndpoints["users/followers"]['req']>["limit"] ? true : false, true>>;

type Native3 = InferContractRouterInputs<typeof UsersFollowingContract>;
export type Sdk3 = Assert<Equal<ContractEndpoints["users/following"]['req'], Native3>>;
export type Option3_sinceId = Assert<Equal<undefined extends Required<ContractEndpoints["users/following"]['req']>["sinceId"] ? true : false, true>>;
export type Option3_untilId = Assert<Equal<undefined extends Required<ContractEndpoints["users/following"]['req']>["untilId"] ? true : false, true>>;
export type Option3_sinceDate = Assert<Equal<undefined extends Required<ContractEndpoints["users/following"]['req']>["sinceDate"] ? true : false, true>>;
export type Option3_untilDate = Assert<Equal<undefined extends Required<ContractEndpoints["users/following"]['req']>["untilDate"] ? true : false, true>>;
export type Option3_limit = Assert<Equal<undefined extends Required<ContractEndpoints["users/following"]['req']>["limit"] ? true : false, true>>;
export type Option3_birthday = Assert<Equal<undefined extends Required<ContractEndpoints["users/following"]['req']>["birthday"] ? true : false, true>>;

type Native4 = InferContractRouterInputs<typeof usersSearchByUsernameAndHostContract>;
export type Sdk4 = Assert<Equal<ContractEndpoints["users/search-by-username-and-host"]['req'], Native4>>;
export type Option4_limit = Assert<Equal<undefined extends Required<ContractEndpoints["users/search-by-username-and-host"]['req']>["limit"] ? true : false, true>>;
export type Option4_detail = Assert<Equal<undefined extends Required<ContractEndpoints["users/search-by-username-and-host"]['req']>["detail"] ? true : false, true>>;

export function requestFixtures(): void {
	const follower: ContractEndpoints['users/followers']['req'] = { userId: 'a', limit: undefined, sinceId: undefined };
	const tag: ContractEndpoints['notes/search-by-tag']['req'] = { tag: 'a', reply: undefined, limit: undefined };
	// @ts-expect-error A named follower selector must supply host.
	const missingHost: ContractEndpoints['users/followers']['req'] = { username: 'alice' };
	// @ts-expect-error At least one required tag/query selector remains necessary.
	const missingTag: ContractEndpoints['notes/search-by-tag']['req'] = {};
	void [follower, tag, missingHost, missingTag];
}

export type NoAny0 = Assert<Equal<IsAny<ContractEndpoints["admin/emoji/update"]['req']>, false>>;

export type NoAny1 = Assert<Equal<IsAny<ContractEndpoints["notes/search-by-tag"]['req']>, false>>;

export type NoAny2 = Assert<Equal<IsAny<ContractEndpoints["users/followers"]['req']>, false>>;

export type NoAny3 = Assert<Equal<IsAny<ContractEndpoints["users/following"]['req']>, false>>;

export type NoAny4 = Assert<Equal<IsAny<ContractEndpoints["users/search-by-username-and-host"]['req']>, false>>;
