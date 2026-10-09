/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adminAccountsDeleteContract, voidAdminAccountsDeleteInput } from './endpoints/admin/accounts/delete.contract.js';
import { adminAccountsFindByEmailContract, packedAdminAccountsFindByEmailInput } from './endpoints/admin/accounts/find-by-email.contract.js';
import { adminDeleteAccountContract, voidAdminDeleteAccountInput } from './endpoints/admin/delete-account.contract.js';
import { adminUpdateProxyAccountContract, portableAdminUpdateProxyAccountInput } from './endpoints/admin/update-proxy-account.contract.js';
import { iContract, packedIInput } from './endpoints/i.contract.js';
import { iClaimAchievementContract, constantIClaimAchievementInput } from './endpoints/i/claim-achievement.contract.js';
import { iDeleteAccountContract, voidIDeleteAccountInput } from './endpoints/i/delete-account.contract.js';
import { iMoveContract, inlineIMoveInput } from './endpoints/i/move.contract.js';
import { iUpdateContract, iUpdateInput } from './endpoints/i/update.contract.js';
import { usersContract as usersListContract, packedUsersInput } from './endpoints/users.contract.js';
import { usersAchievementsContract, referenceUsersAchievementsInput } from './endpoints/users/achievements.contract.js';
import { usersShowContract, usersShowInput } from './endpoints/users/show.contract.js';
import { usersUpdateMemoContract, voidUsersUpdateMemoInput } from './endpoints/users/update-memo.contract.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import type * as v from 'valibot';
export const usersContract = {
	'admin/accounts/delete': adminAccountsDeleteContract,
	'admin/accounts/find-by-email': adminAccountsFindByEmailContract,
	'admin/delete-account': adminDeleteAccountContract,
	'admin/update-proxy-account': adminUpdateProxyAccountContract,
	'i': iContract,
	'i/claim-achievement': iClaimAchievementContract,
	'i/delete-account': iDeleteAccountContract,
	'i/move': iMoveContract,
	'i/update': iUpdateContract,
	'users': usersListContract,
	'users/achievements': usersAchievementsContract,
	'users/show': usersShowContract,
	'users/update-memo': usersUpdateMemoContract,
};
export interface UsersInputs {
	'admin/accounts/delete': v.InferOutput<typeof voidAdminAccountsDeleteInput>;
	'admin/accounts/find-by-email': v.InferOutput<typeof packedAdminAccountsFindByEmailInput>;
	'admin/delete-account': v.InferOutput<typeof voidAdminDeleteAccountInput>;
	'admin/update-proxy-account': v.InferOutput<typeof portableAdminUpdateProxyAccountInput>;
	'i': v.InferOutput<typeof packedIInput>;
	'i/claim-achievement': v.InferOutput<typeof constantIClaimAchievementInput>;
	'i/delete-account': v.InferOutput<typeof voidIDeleteAccountInput>;
	'i/move': v.InferOutput<typeof inlineIMoveInput>;
	'i/update': v.InferOutput<typeof iUpdateInput>;
	'users': v.InferOutput<typeof packedUsersInput>;
	'users/achievements': v.InferOutput<typeof referenceUsersAchievementsInput>;
	'users/show': v.InferOutput<typeof usersShowInput>;
	'users/update-memo': v.InferOutput<typeof voidUsersUpdateMemoInput>;
}
export type UsersOutputs = InferContractRouterOutputs<typeof usersContract>;
