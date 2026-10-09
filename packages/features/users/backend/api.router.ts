/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { usersContract } from './api.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from './models/User.js';
import { createAdminAccountsDeleteProcedure, type AdminAccountsDeleteDependencies } from './endpoints/admin/accounts/delete.js';
import { createAdminAccountsFindByEmailProcedure, type AdminAccountsFindByEmailDependencies } from './endpoints/admin/accounts/find-by-email.js';
import { createAdminDeleteAccountProcedure, type AdminDeleteAccountDependencies } from './endpoints/admin/delete-account.js';
import { createAdminUpdateProxyAccountProcedure, type AdminUpdateProxyAccountDependencies } from './endpoints/admin/update-proxy-account.js';
import { createIProcedure, type IDependencies } from './endpoints/i.js';
import { createIClaimAchievementProcedure, type IClaimAchievementDependencies } from './endpoints/i/claim-achievement.js';
import { createIDeleteAccountProcedure, type IDeleteAccountDependencies } from './endpoints/i/delete-account.js';
import { createIMoveProcedure, type IMoveDependencies } from './endpoints/i/move.js';
import { createIUpdateProcedure, type IUpdateDependencies } from './endpoints/i/update.js';
import { createUsersProcedure, type UsersDependencies } from './endpoints/users.js';
import { createUsersAchievementsProcedure, type UsersAchievementsDependencies } from './endpoints/users/achievements.js';
import { createUsersShowProcedure, type UsersShowDependencies } from './endpoints/users/show.js';
import { createUsersUpdateMemoProcedure, type UsersUpdateMemoDependencies } from './endpoints/users/update-memo.js';
export interface UsersRouterDependencies {
	'admin/accounts/delete': AdminAccountsDeleteDependencies;
	'admin/accounts/find-by-email': AdminAccountsFindByEmailDependencies;
	'admin/delete-account': AdminDeleteAccountDependencies;
	'admin/update-proxy-account': AdminUpdateProxyAccountDependencies;
	'i': IDependencies;
	'i/claim-achievement': IClaimAchievementDependencies;
	'i/delete-account': IDeleteAccountDependencies;
	'i/move': IMoveDependencies;
	'i/update': IUpdateDependencies;
	'users': UsersDependencies;
	'users/achievements': UsersAchievementsDependencies;
	'users/show': UsersShowDependencies;
	'users/update-memo': UsersUpdateMemoDependencies;
}
export function createUsersRouter(deps: UsersRouterDependencies) {
	return implement(usersContract).$context<ApiContext<MiLocalUser>>().router({
		'admin/accounts/delete': createAdminAccountsDeleteProcedure(deps['admin/accounts/delete']),
		'admin/accounts/find-by-email': createAdminAccountsFindByEmailProcedure(deps['admin/accounts/find-by-email']),
		'admin/delete-account': createAdminDeleteAccountProcedure(deps['admin/delete-account']),
		'admin/update-proxy-account': createAdminUpdateProxyAccountProcedure(deps['admin/update-proxy-account']),
		'i': createIProcedure(deps['i']),
		'i/claim-achievement': createIClaimAchievementProcedure(deps['i/claim-achievement']),
		'i/delete-account': createIDeleteAccountProcedure(deps['i/delete-account']),
		'i/move': createIMoveProcedure(deps['i/move']),
		'i/update': createIUpdateProcedure(deps['i/update']),
		'users': createUsersProcedure(deps['users']),
		'users/achievements': createUsersAchievementsProcedure(deps['users/achievements']),
		'users/show': createUsersShowProcedure(deps['users/show']),
		'users/update-memo': createUsersUpdateMemoProcedure(deps['users/update-memo']),
	});
}
