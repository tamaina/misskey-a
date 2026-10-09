/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import { Injectable } from '@nestjs/common';
import { apiError } from '../../api/backend/transport/orpc-error.js';
import { sqlLikeEscape } from '../../persistence/backend/utility/sql-like-escape.js';
import { toPackedJsonObject } from '../../users/backend/json-value.schema.js';
import { moderationErrors } from './api.errors.js';
import type * as v from 'valibot';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';
import type { MiUser } from '../../users/backend/models/User.js';
import type { MiRole } from '../../roles/backend/models/Role.js';
import type { moderationInputs, moderationOutputs } from './api.schema.js';
type Inputs = { [K in keyof typeof moderationInputs]: v.InferOutput<typeof moderationInputs[K]> };
type Outputs = { [K in keyof typeof moderationOutputs]: v.InferOutput<typeof moderationOutputs[K]> };
export interface ModerationOperations<Actor extends ApiActor> {
	adminAbuseReportNotificationRecipientCreate(input: Inputs['adminAbuseReportNotificationRecipientCreate'], actor: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientCreate']>;
	adminAbuseReportNotificationRecipientDelete(input: Inputs['adminAbuseReportNotificationRecipientDelete'], actor: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientDelete']>;
	adminAbuseReportNotificationRecipientList(input: Inputs['adminAbuseReportNotificationRecipientList'], actor: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientList']>;
	adminAbuseReportNotificationRecipientShow(input: Inputs['adminAbuseReportNotificationRecipientShow'], actor: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientShow']>;
	adminAbuseReportNotificationRecipientUpdate(input: Inputs['adminAbuseReportNotificationRecipientUpdate'], actor: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientUpdate']>;
	adminAbuseUserReports(input: Inputs['adminAbuseUserReports'], actor: Actor): Promise<Outputs['adminAbuseUserReports']>;
	adminForwardAbuseUserReport(input: Inputs['adminForwardAbuseUserReport'], actor: Actor): Promise<Outputs['adminForwardAbuseUserReport']>;
	adminGetUserIps(input: Inputs['adminGetUserIps'], actor: Actor): Promise<Outputs['adminGetUserIps']>;
	adminResolveAbuseUserReport(input: Inputs['adminResolveAbuseUserReport'], actor: Actor): Promise<Outputs['adminResolveAbuseUserReport']>;
	adminShowModerationLogs(input: Inputs['adminShowModerationLogs'], actor: Actor): Promise<Outputs['adminShowModerationLogs']>;
	adminShowUser(input: Inputs['adminShowUser'], actor: Actor): Promise<Outputs['adminShowUser']>;
	adminShowUsers(input: Inputs['adminShowUsers'], actor: Actor): Promise<Outputs['adminShowUsers']>;
	adminSuspendUser(input: Inputs['adminSuspendUser'], actor: Actor): Promise<Outputs['adminSuspendUser']>;
	adminUnsetUserAvatar(input: Inputs['adminUnsetUserAvatar'], actor: Actor): Promise<Outputs['adminUnsetUserAvatar']>;
	adminUnsetUserBanner(input: Inputs['adminUnsetUserBanner'], actor: Actor): Promise<Outputs['adminUnsetUserBanner']>;
	adminUnsuspendUser(input: Inputs['adminUnsuspendUser'], actor: Actor): Promise<Outputs['adminUnsuspendUser']>;
	adminUpdateAbuseUserReport(input: Inputs['adminUpdateAbuseUserReport'], actor: Actor): Promise<Outputs['adminUpdateAbuseUserReport']>;
	adminUpdateUserNote(input: Inputs['adminUpdateUserNote'], actor: Actor): Promise<Outputs['adminUpdateUserNote']>;
	usersReportAbuse(input: Inputs['usersReportAbuse'], actor: Actor): Promise<Outputs['usersReportAbuse']>;
}
import type { UsersRepository, UserProfilesRepository, SigninsRepository, AbuseUserReportsRepository, UserIpsRepository, ModerationLogsRepository, MiAbuseUserReport, MiAbuseReportNotificationRecipient, MiModerationLog } from '../../persistence/backend/repositories/models.js';
import type { GetterService } from '../../api/backend/transport/GetterService.js';
import type { AbuseReportService } from './services/AbuseReportService.js';
import type { AbuseReportNotificationService } from './services/AbuseReportNotificationService.js';
export interface ModerationApiDependencies<Actor extends ApiActor> {
	usersRepository: Pick<UsersRepository, 'findOneBy' | 'findOneByOrFail' | 'createQueryBuilder' | 'update'>;
	userProfilesRepository: Pick<UserProfilesRepository, 'findOneBy' | 'findOneByOrFail' | 'update'>;
	signinsRepository: Pick<SigninsRepository, 'findBy'>;
	abuseUserReportsRepository: Pick<AbuseUserReportsRepository, 'findOneBy' | 'createQueryBuilder'>;
	userIpsRepository: Pick<UserIpsRepository, 'find'>;
	moderationLogsRepository: Pick<ModerationLogsRepository, 'createQueryBuilder'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	idService: Pick<IdService, 'parse'>;
	roleService: Pick<RoleService, 'isModerator' | 'isAdministrator' | 'getUserPolicies' | 'getUserAssigns' | 'getUserRoles' | 'getAdministratorIds' | 'getModeratorIds'>;
	roleEntityService: { packMany(roles: MiRole[], actor: Actor): Promise<Outputs['adminShowUser']['roles']> };
	userEntityService: { packMany(users: MiUser[], actor: Actor, options: { schema: 'UserDetailed' }): Promise<Outputs['adminShowUsers']> };
	abuseReportNotificationRecipientEntityService: {
		pack(row: MiAbuseReportNotificationRecipient): Promise<Outputs['adminAbuseReportNotificationRecipientShow']>;
		packMany(rows: MiAbuseReportNotificationRecipient[]): Promise<Outputs['adminAbuseReportNotificationRecipientList']>;
	};
	abuseUserReportEntityService: { packMany(rows: MiAbuseUserReport[]): Promise<Outputs['adminAbuseUserReports']> };
	moderationLogEntityService: { packMany(rows: MiModerationLog[]): Promise<Outputs['adminShowModerationLogs']> };
	abuseReportNotificationService: {
		fetchRecipients: AbuseReportNotificationService['fetchRecipients'];
		createRecipient(params: Parameters<AbuseReportNotificationService['createRecipient']>[0], actor: Actor): Promise<MiAbuseReportNotificationRecipient>;
		updateRecipient(params: Parameters<AbuseReportNotificationService['updateRecipient']>[0], actor: Actor): Promise<MiAbuseReportNotificationRecipient>;
		deleteRecipient(id: string, actor: Actor): Promise<void>;
	};
	abuseReportService: {
		report: AbuseReportService['report'];
		forward(id: string, actor: Actor): Promise<void>;
		resolve(params: Parameters<AbuseReportService['resolve']>[0], actor: Actor): ReturnType<AbuseReportService['resolve']>;
		update(id: string, params: Parameters<AbuseReportService['update']>[1], actor: Actor): Promise<void>;
	};
	getterService: Pick<GetterService, 'getUser'>;
	userSuspendService: { suspend(user: MiUser, actor: Actor): Promise<void>; unsuspend(user: MiUser, actor: Actor): Promise<void> };
	moderationLogService: Pick<ModerationLogService, 'log'>;
}

@Injectable()
export class ModerationApplicationService<Actor extends ApiActor> implements ModerationOperations<Actor> {
	constructor(private readonly deps: ModerationApiDependencies<Actor>) {}
	public async adminAbuseReportNotificationRecipientCreate(ps: Inputs['adminAbuseReportNotificationRecipientCreate'], me: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientCreate']> {
		if (ps.method === 'email') {
			const userProfile = await this.deps.userProfilesRepository.findOneBy({ userId: ps.userId });
			if (!ps.userId || !userProfile) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientCreate.correlationCheckEmail);
			}

			if (!userProfile.email || !userProfile.emailVerified) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientCreate.emailAddressNotSet);
			}
		}

		if (ps.method === 'webhook' && !ps.systemWebhookId) {
			throw apiError(moderationErrors.adminAbuseReportNotificationRecipientCreate.correlationCheckWebhook);
		}

		const userId = ps.method === 'email' ? ps.userId : null;
		const systemWebhookId = ps.method === 'webhook' ? ps.systemWebhookId : null;
		const result = await this.deps.abuseReportNotificationService.createRecipient(
			{
				isActive: ps.isActive,
				name: ps.name,
				method: ps.method,
				userId: userId ?? null,
				systemWebhookId: systemWebhookId ?? null,
			},
			me,
		);

		return this.deps.abuseReportNotificationRecipientEntityService.pack(result);
	}
	public async adminAbuseReportNotificationRecipientDelete(ps: Inputs['adminAbuseReportNotificationRecipientDelete'], me: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientDelete']> {
		await this.deps.abuseReportNotificationService.deleteRecipient(ps.id, me);
	}
	public async adminAbuseReportNotificationRecipientList(ps: Inputs['adminAbuseReportNotificationRecipientList'], me: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientList']> {
		const recipients = await this.deps.abuseReportNotificationService.fetchRecipients({ method: ps.method });
		return this.deps.abuseReportNotificationRecipientEntityService.packMany(recipients);
	}
	public async adminAbuseReportNotificationRecipientShow(ps: Inputs['adminAbuseReportNotificationRecipientShow'], me: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientShow']> {
		const recipients = await this.deps.abuseReportNotificationService.fetchRecipients({ ids: [ps.id] });
		if (recipients.length === 0) {
			throw apiError(moderationErrors.adminAbuseReportNotificationRecipientShow.noSuchRecipient);
		}

		return this.deps.abuseReportNotificationRecipientEntityService.pack(recipients[0]);
	}
	public async adminAbuseReportNotificationRecipientUpdate(ps: Inputs['adminAbuseReportNotificationRecipientUpdate'], me: Actor): Promise<Outputs['adminAbuseReportNotificationRecipientUpdate']> {
		if (ps.method === 'email') {
			const userProfile = await this.deps.userProfilesRepository.findOneBy({ userId: ps.userId });
			if (!ps.userId || !userProfile) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientUpdate.correlationCheckEmail);
			}

			if (!userProfile.email || !userProfile.emailVerified) {
				throw apiError(moderationErrors.adminAbuseReportNotificationRecipientUpdate.emailAddressNotSet);
			}
		}

		if (ps.method === 'webhook' && !ps.systemWebhookId) {
			throw apiError(moderationErrors.adminAbuseReportNotificationRecipientUpdate.correlationCheckWebhook);
		}

		const userId = ps.method === 'email' ? ps.userId : null;
		const systemWebhookId = ps.method === 'webhook' ? ps.systemWebhookId : null;
		const result = await this.deps.abuseReportNotificationService.updateRecipient(
			{
				id: ps.id,
				isActive: ps.isActive,
				name: ps.name,
				method: ps.method,
				userId: userId ?? null,
				systemWebhookId: systemWebhookId ?? null,
			},
			me,
		);

		return this.deps.abuseReportNotificationRecipientEntityService.pack(result);
	}
	public async adminAbuseUserReports(ps: Inputs['adminAbuseUserReports'], me: Actor): Promise<Outputs['adminAbuseUserReports']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.abuseUserReportsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

		switch (ps.state) {
			case 'resolved': query.andWhere('report.resolved = TRUE'); break;
			case 'unresolved': query.andWhere('report.resolved = FALSE'); break;
		}

		switch (ps.reporterOrigin) {
			case 'local': query.andWhere('report.reporterHost IS NULL'); break;
			case 'remote': query.andWhere('report.reporterHost IS NOT NULL'); break;
		}

		switch (ps.targetUserOrigin) {
			case 'local': query.andWhere('report.targetUserHost IS NULL'); break;
			case 'remote': query.andWhere('report.targetUserHost IS NOT NULL'); break;
		}

		const reports = await query.limit(ps.limit).getMany();

		return await this.deps.abuseUserReportEntityService.packMany(reports);
	}
	public async adminForwardAbuseUserReport(ps: Inputs['adminForwardAbuseUserReport'], me: Actor): Promise<Outputs['adminForwardAbuseUserReport']> {
		const report = await this.deps.abuseUserReportsRepository.findOneBy({ id: ps.reportId });
		if (!report) throw apiError(moderationErrors.adminForwardAbuseUserReport.noSuchAbuseReport);
		await this.deps.abuseReportService.forward(report.id, me);
	}
	public async adminGetUserIps(ps: Inputs['adminGetUserIps'], me: Actor): Promise<Outputs['adminGetUserIps']> {
		const ips = await this.deps.userIpsRepository.find({
			where: { userId: ps.userId },
			order: { id: 'DESC' },
			take: 30,
		});

		return ips.map(x => ({
			ip: x.ip,
			createdAt: x.createdAt.toISOString(),
		}));
	}
	public async adminResolveAbuseUserReport(ps: Inputs['adminResolveAbuseUserReport'], me: Actor): Promise<Outputs['adminResolveAbuseUserReport']> {
		const report = await this.deps.abuseUserReportsRepository.findOneBy({ id: ps.reportId });
		if (!report) throw apiError(moderationErrors.adminResolveAbuseUserReport.noSuchAbuseReport);
		await this.deps.abuseReportService.resolve([{ reportId: report.id, resolvedAs: ps.resolvedAs ?? null }], me);
	}
	public async adminShowModerationLogs(ps: Inputs['adminShowModerationLogs'], me: Actor): Promise<Outputs['adminShowModerationLogs']> {
		const query = this.deps.queryService.makePaginationQuery(this.deps.moderationLogsRepository.createQueryBuilder('log'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

		if (ps.type != null) {
			query.andWhere('log.type = :type', { type: ps.type });
		}

		if (ps.userId != null) {
			query.andWhere('log.userId = :userId', { userId: ps.userId });
		}

		if (ps.search != null) {
			const escapedSearch = sqlLikeEscape(ps.search);
			query.andWhere('log.info::text ILIKE :search', { search: `%${escapedSearch}%` });
		}

		const logs = await query.limit(ps.limit).getMany();

		return await this.deps.moderationLogEntityService.packMany(logs);
	}
	public async adminShowUser(ps: Inputs['adminShowUser'], me: Actor): Promise<Outputs['adminShowUser']> {
		const [user, profile] = await Promise.all([
			this.deps.usersRepository.findOneBy({ id: ps.userId }),
			this.deps.userProfilesRepository.findOneBy({ userId: ps.userId }),
		]);

		if (user == null || profile == null) {
			throw new Error('user not found');
		}

		const isModerator = await this.deps.roleService.isModerator(user);
		const isSilenced = !(await this.deps.roleService.getUserPolicies(user.id)).canPublicNote;

		const _me = await this.deps.usersRepository.findOneByOrFail({ id: me.id });
		if (!await this.deps.roleService.isAdministrator(_me) && await this.deps.roleService.isAdministrator(user)) {
			throw new Error('cannot show info of admin');
		}

		const signins = await this.deps.signinsRepository.findBy({ userId: user.id });

		const roleAssigns = await this.deps.roleService.getUserAssigns(user.id);
		const roles = await this.deps.roleService.getUserRoles(user.id);

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
			notificationRecieveConfig: profile.notificationRecieveConfig,
			isModerator: isModerator,
			isSilenced: isSilenced,
			isSuspended: user.isSuspended,
			isHibernated: user.isHibernated,
			lastActiveDate: user.lastActiveDate ? user.lastActiveDate.toISOString() : null,
			moderationNote: profile.moderationNote ?? '',
			signins: signins.map(({ id, userId, ip, headers, success }) => ({ id, userId, ip, headers: toPackedJsonObject(headers), success })),
			policies: await this.deps.roleService.getUserPolicies(user.id),
			roles: await this.deps.roleEntityService.packMany(roles, me),
			roleAssigns: roleAssigns.map(a => ({
				createdAt: this.deps.idService.parse(a.id).date.toISOString(),
				expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
				roleId: a.roleId,
			})),
		};
	}
	public async adminShowUsers(ps: Inputs['adminShowUsers'], me: Actor): Promise<Outputs['adminShowUsers']> {
		const query = this.deps.usersRepository.createQueryBuilder('user');

		switch (ps.state) {
			case 'available': query.where('user.isSuspended = FALSE'); break;
			case 'alive': query.where('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
			case 'suspended': query.where('user.isSuspended = TRUE'); break;
			case 'admin': {
				const adminIds = await this.deps.roleService.getAdministratorIds();
				if (adminIds.length === 0) return [];
				query.where('user.id IN (:...adminIds)', { adminIds: adminIds });
				break;
			}
			case 'moderator': {
				const moderatorIds = await this.deps.roleService.getModeratorIds({ includeAdmins: false });
				if (moderatorIds.length === 0) return [];
				query.where('user.id IN (:...moderatorIds)', { moderatorIds: moderatorIds });
				break;
			}
			case 'adminOrModerator': {
				const adminOrModeratorIds = await this.deps.roleService.getModeratorIds({ includeAdmins: true });
				if (adminOrModeratorIds.length === 0) return [];
				query.where('user.id IN (:...adminOrModeratorIds)', { adminOrModeratorIds: adminOrModeratorIds });
				break;
			}
		}

		switch (ps.origin) {
			case 'local': query.andWhere('user.host IS NULL'); break;
			case 'remote': query.andWhere('user.host IS NOT NULL'); break;
		}

		if (ps.username) {
			query.andWhere('user.usernameLower like :username', { username: sqlLikeEscape(ps.username.toLowerCase()) + '%' });
		}

		if (ps.hostname) {
			query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
		}

		switch (ps.sort) {
			case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
			case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
			case '+createdAt': query.orderBy('user.id', 'DESC'); break;
			case '-createdAt': query.orderBy('user.id', 'ASC'); break;
			case '+updatedAt': query.orderBy('user.updatedAt', 'DESC', 'NULLS LAST'); break;
			case '-updatedAt': query.orderBy('user.updatedAt', 'ASC', 'NULLS FIRST'); break;
			case '+lastActiveDate': query.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST'); break;
			case '-lastActiveDate': query.orderBy('user.lastActiveDate', 'ASC', 'NULLS FIRST'); break;
			default: query.orderBy('user.id', 'ASC'); break;
		}

		query.limit(ps.limit);
		query.offset(ps.offset);

		const users = await query.getMany();

		return await this.deps.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
	}
	public async adminSuspendUser(ps: Inputs['adminSuspendUser'], me: Actor): Promise<Outputs['adminSuspendUser']> {
		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) throw new Error('user not found');
		if (await this.deps.roleService.isModerator(user)) throw new Error('cannot suspend moderator account');
		await this.deps.userSuspendService.suspend(user, me);
	}
	public async adminUnsetUserAvatar(ps: Inputs['adminUnsetUserAvatar'], me: Actor): Promise<Outputs['adminUnsetUserAvatar']> {
		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) throw new Error('user not found');
		const fileId = user.avatarId;
		if (fileId == null) return;
		await this.deps.usersRepository.update(user.id, { avatar: null, avatarId: null, avatarUrl: null, avatarBlurhash: null });
		void this.deps.moderationLogService.log(me, 'unsetUserAvatar', { userId: user.id, userUsername: user.username, userHost: user.host, fileId });
	}
	public async adminUnsetUserBanner(ps: Inputs['adminUnsetUserBanner'], me: Actor): Promise<Outputs['adminUnsetUserBanner']> {
		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) throw new Error('user not found');
		const fileId = user.bannerId;
		if (fileId == null) return;
		await this.deps.usersRepository.update(user.id, { banner: null, bannerId: null, bannerUrl: null, bannerBlurhash: null });
		void this.deps.moderationLogService.log(me, 'unsetUserBanner', { userId: user.id, userUsername: user.username, userHost: user.host, fileId });
	}
	public async adminUnsuspendUser(ps: Inputs['adminUnsuspendUser'], me: Actor): Promise<Outputs['adminUnsuspendUser']> {
		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) throw new Error('user not found');
		await this.deps.userSuspendService.unsuspend(user, me);
	}
	public async adminUpdateAbuseUserReport(ps: Inputs['adminUpdateAbuseUserReport'], me: Actor): Promise<Outputs['adminUpdateAbuseUserReport']> {
		const report = await this.deps.abuseUserReportsRepository.findOneBy({ id: ps.reportId });
		if (!report) throw apiError(moderationErrors.adminUpdateAbuseUserReport.noSuchAbuseReport);
		await this.deps.abuseReportService.update(report.id, { moderationNote: ps.moderationNote }, me);
	}
	public async adminUpdateUserNote(ps: Inputs['adminUpdateUserNote'], me: Actor): Promise<Outputs['adminUpdateUserNote']> {
		const user = await this.deps.usersRepository.findOneBy({ id: ps.userId });
		if (user == null) throw new Error('user not found');
		const profile = await this.deps.userProfilesRepository.findOneByOrFail({ userId: user.id });
		await this.deps.userProfilesRepository.update({ userId: user.id }, { moderationNote: ps.text });
		void this.deps.moderationLogService.log(me, 'updateUserNote', { userId: user.id, userUsername: user.username, userHost: user.host, before: profile.moderationNote, after: ps.text });
	}
	public async usersReportAbuse(ps: Inputs['usersReportAbuse'], me: Actor): Promise<Outputs['usersReportAbuse']> {
		// Lookup user
		const targetUser = await this.deps.getterService.getUser(ps.userId).catch(err => {
			if (typeof err === 'object' && err !== null && 'id' in err && err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(moderationErrors.usersReportAbuse.noSuchUser);
			throw err;
		});

		if (targetUser.id === me.id) {
			throw apiError(moderationErrors.usersReportAbuse.cannotReportYourself);
		}

		if (await this.deps.roleService.isAdministrator(targetUser)) {
			throw apiError(moderationErrors.usersReportAbuse.cannotReportAdmin);
		}

		await this.deps.abuseReportService.report([{
			targetUserId: targetUser.id,
			targetUserHost: targetUser.host,
			reporterId: me.id,
			reporterHost: null,
			comment: ps.comment,
		}]);
	}
}
export function createModerationOperations<Actor extends ApiActor>(deps: ModerationApiDependencies<Actor>): ModerationOperations<Actor> { return new ModerationApplicationService(deps); }
