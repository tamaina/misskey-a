/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { toPackedUserDetailed } from './user.schema.js';
import { AdminAccountsDeleteOperation } from './endpoints/admin/accounts/delete.js';
import { AdminAccountsFindByEmailOperation } from './endpoints/admin/accounts/find-by-email.js';
import { AdminDeleteAccountOperation } from './endpoints/admin/delete-account.js';
import { AdminUpdateProxyAccountOperation } from './endpoints/admin/update-proxy-account.js';
import { IOperation } from './endpoints/i.js';
import { IClaimAchievementOperation } from './endpoints/i/claim-achievement.js';
import { IDeleteAccountOperation } from './endpoints/i/delete-account.js';
import { IMoveOperation } from './endpoints/i/move.js';
import { IUpdateOperation } from './endpoints/i/update.js';
import { UsersOperation } from './endpoints/users.js';
import { UsersAchievementsOperation } from './endpoints/users/achievements.js';
import { UsersShowOperation } from './endpoints/users/show.js';
import { UsersUpdateMemoOperation } from './endpoints/users/update-memo.js';
import type { UsersOperations } from './api.router.js';
import type { NativeUserDetailed } from './serializers/native-user.js';
import type { MiLocalUser } from './models/User.js';

@Injectable()
export class UsersApplicationService implements UsersOperations<MiLocalUser> {
	constructor(
		private readonly adminAccountsDelete: AdminAccountsDeleteOperation,
		private readonly adminAccountsFindByEmail: AdminAccountsFindByEmailOperation,
		private readonly adminDeleteAccount: AdminDeleteAccountOperation,
		private readonly adminUpdateProxyAccount: AdminUpdateProxyAccountOperation,
		private readonly iOperation: IOperation,
		private readonly iClaimAchievement: IClaimAchievementOperation,
		private readonly iDeleteAccount: IDeleteAccountOperation,
		private readonly iMove: IMoveOperation,
		private readonly iUpdate: IUpdateOperation,
		private readonly usersOperation: UsersOperation,
		private readonly usersAchievements: UsersAchievementsOperation,
		private readonly usersShow: UsersShowOperation,
		private readonly usersUpdateMemo: UsersUpdateMemoOperation,
	) {}

	'admin/accounts/delete': UsersOperations<MiLocalUser>['admin/accounts/delete'] = async (input, actor, token, ip) => this.adminAccountsDelete.execute(input, actor, token, ip);
	'admin/accounts/find-by-email': UsersOperations<MiLocalUser>['admin/accounts/find-by-email'] = async (input, actor, token, ip) => toPackedUserDetailed(await this.adminAccountsFindByEmail.execute(input, actor, token, ip));
	'admin/delete-account': UsersOperations<MiLocalUser>['admin/delete-account'] = async (input, actor, token, ip) => this.adminDeleteAccount.execute(input, actor, token, ip);
	'admin/update-proxy-account': UsersOperations<MiLocalUser>['admin/update-proxy-account'] = async (input, actor, token, ip) => toPackedUserDetailed(await this.adminUpdateProxyAccount.execute(input, actor, token, ip));
	'i': UsersOperations<MiLocalUser>['i'] = async (input, actor, token, ip) => toPackedUserDetailed(await this.iOperation.execute(input, actor, token, ip));
	'i/claim-achievement': UsersOperations<MiLocalUser>['i/claim-achievement'] = async (input, actor, token, ip) => this.iClaimAchievement.execute(input, actor, token, ip);
	'i/delete-account': UsersOperations<MiLocalUser>['i/delete-account'] = async (input, actor, token, ip) => this.iDeleteAccount.execute(input, actor, token, ip);
	'i/move': UsersOperations<MiLocalUser>['i/move'] = async (input, actor, token, ip) => toPackedUserDetailed(await this.iMove.execute(input, actor, token, ip));
	'i/update': UsersOperations<MiLocalUser>['i/update'] = async (input, actor, token, ip) => toPackedUserDetailed(await this.iUpdate.execute(input, actor, token, ip));
	'users': UsersOperations<MiLocalUser>['users'] = async (input, actor, token, ip) => (await this.usersOperation.execute(input, actor, token, ip)).map(user => toPackedUserDetailed(user));
	'users/achievements': UsersOperations<MiLocalUser>['users/achievements'] = async (input, actor, token, ip) => this.usersAchievements.execute(input, actor, token, ip);
	'users/show': UsersOperations<MiLocalUser>['users/show'] = async (input, actor, token, ip) => this.packShow(await this.usersShow.execute(input, actor, token, ip));
	'users/update-memo': UsersOperations<MiLocalUser>['users/update-memo'] = async (input, actor, token, ip) => this.usersUpdateMemo.execute(input, actor, token, ip);

	private packShow(value: NativeUserDetailed | NativeUserDetailed[]) {
		return Array.isArray(value) ? value.map(user => toPackedUserDetailed(user)) : toPackedUserDetailed(value);
	}
}
