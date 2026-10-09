/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedNotificationSettings } from '@features/users/backend/notification-settings.schema.js';
import { toRoleDto } from '@features/roles/backend/role.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
import { toPackedJsonObject } from '@features/users/backend/json-value.schema.js';
export function createAdminShowUserProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'usersRepository' | 'userProfilesRepository' | 'roleService' | 'signinsRepository' | 'roleEntityService' | 'idService'>) {
	return createApiProcedure<Actor>()(moderationContract.adminShowUser).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const [user, profile] = await Promise.all([
				deps.usersRepository.findOneBy({ id: ps.userId }),
				deps.userProfilesRepository.findOneBy({ userId: ps.userId }),
			]);
			if (user == null || profile == null) {
				throw new Error('user not found');
			}
			const isModerator = await deps.roleService.isModerator(user);
			const isSilenced = !(await deps.roleService.getUserPolicies(user.id)).canPublicNote;
			const _me = await deps.usersRepository.findOneByOrFail({ id: me.id });
			if (!await deps.roleService.isAdministrator(_me) && await deps.roleService.isAdministrator(user)) {
				throw new Error('cannot show info of admin');
			}
			const signins = await deps.signinsRepository.findBy({ userId: user.id });
			const roleAssigns = await deps.roleService.getUserAssigns(user.id);
			const roles = await deps.roleService.getUserRoles(user.id);
			return {
				email: profile.email,
				emailVerified: profile.emailVerified,
				followedMessage: profile.followedMessage,
				autoAcceptFollowed: profile.autoAcceptFollowed,
				noCrawle: profile.noCrawle,
				preventAiLearning: profile.preventAiLearning,
				alwaysMarkNsfw: profile.alwaysMarkNsfw,
				autoSensitive: profile.autoSensitive,
				carefulBot: profile.carefulBot,
				injectFeaturedNote: profile.injectFeaturedNote,
				receiveAnnouncementEmail: profile.receiveAnnouncementEmail,
				mutedWords: profile.mutedWords,
				mutedInstances: profile.mutedInstances,
				notificationRecieveConfig: toPackedNotificationSettings(profile.notificationRecieveConfig),
				isModerator: isModerator,
				isSilenced: isSilenced,
				isSuspended: user.isSuspended,
				isHibernated: user.isHibernated,
				lastActiveDate: user.lastActiveDate ? user.lastActiveDate.toISOString() : null,
				moderationNote: profile.moderationNote ?? '',
				signins: signins.map(({ id, userId, ip, headers, success }) => ({ id, userId, ip, headers: toPackedJsonObject(headers), success })),
				policies: await deps.roleService.getUserPolicies(user.id),
				roles: (await deps.roleEntityService.packMany(roles, me)).map(toRoleDto),
				roleAssigns: roleAssigns.map(a => ({
					createdAt: deps.idService.parse(a.id).date.toISOString(),
					expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
					roleId: a.roleId,
				})),
			};
		});
}
