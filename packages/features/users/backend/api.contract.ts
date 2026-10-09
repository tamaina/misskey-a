/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { adminAccountsDeleteContract } from './endpoints/admin/accounts/delete.contract.js';
import { adminAccountsFindByEmailContract } from './endpoints/admin/accounts/find-by-email.contract.js';
import { adminDeleteAccountContract } from './endpoints/admin/delete-account.contract.js';
import { adminUpdateProxyAccountContract } from './endpoints/admin/update-proxy-account.contract.js';
import { iContract } from './endpoints/i.contract.js';
import { iClaimAchievementContract } from './endpoints/i/claim-achievement.contract.js';
import { iDeleteAccountContract } from './endpoints/i/delete-account.contract.js';
import { iMoveContract } from './endpoints/i/move.contract.js';
import { iUpdateContract } from './endpoints/i/update.contract.js';
import { usersContract as usersListContract } from './endpoints/users.contract.js';
import { usersAchievementsContract } from './endpoints/users/achievements.contract.js';
import { usersShowContract } from './endpoints/users/show.contract.js';
import { usersUpdateMemoContract } from './endpoints/users/update-memo.contract.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
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
	'admin/accounts/delete': InferSchemaOutput<NonNullable<typeof adminAccountsDeleteContract['~orpc']['inputSchema']>>;
	'admin/accounts/find-by-email': InferSchemaOutput<NonNullable<typeof adminAccountsFindByEmailContract['~orpc']['inputSchema']>>;
	'admin/delete-account': InferSchemaOutput<NonNullable<typeof adminDeleteAccountContract['~orpc']['inputSchema']>>;
	'admin/update-proxy-account': InferSchemaOutput<NonNullable<typeof adminUpdateProxyAccountContract['~orpc']['inputSchema']>>;
	'i': InferSchemaOutput<NonNullable<typeof iContract['~orpc']['inputSchema']>>;
	'i/claim-achievement': InferSchemaOutput<NonNullable<typeof iClaimAchievementContract['~orpc']['inputSchema']>>;
	'i/delete-account': InferSchemaOutput<NonNullable<typeof iDeleteAccountContract['~orpc']['inputSchema']>>;
	'i/move': InferSchemaOutput<NonNullable<typeof iMoveContract['~orpc']['inputSchema']>>;
	'i/update': InferSchemaOutput<NonNullable<typeof iUpdateContract['~orpc']['inputSchema']>>;
	'users': InferSchemaOutput<NonNullable<typeof usersListContract['~orpc']['inputSchema']>>;
	'users/achievements': InferSchemaOutput<NonNullable<typeof usersAchievementsContract['~orpc']['inputSchema']>>;
	'users/show': InferSchemaOutput<NonNullable<typeof usersShowContract['~orpc']['inputSchema']>>;
	'users/update-memo': InferSchemaOutput<NonNullable<typeof usersUpdateMemoContract['~orpc']['inputSchema']>>;
}
export type UsersOutputs = InferContractRouterOutputs<typeof usersContract>;
