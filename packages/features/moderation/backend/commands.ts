/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { toLegacyJsonSchema, featureProcedure } from '../../api/backend/index.js';
import {
	moderationCommandErrors,
	moderationCommandInputs,
	moderationCommandsContract,
} from '../contract/index.js';

export interface ModerationContext<Actor extends { id: string }> {
	actor: Actor;
}

export interface ModerationUser {
	id: string;
	username: string;
	host: string | null;
	avatarId: string | null;
	bannerId: string | null;
}

export interface ModerationUserProfile {
	moderationNote: string | null;
}

export interface ModerationAbuseReport {
	id: string;
}

export interface ModerationDependencies<
	User extends ModerationUser,
	Profile extends ModerationUserProfile,
	Report extends ModerationAbuseReport,
	Actor extends { id: string },
> {
	findUserById(id: string): Promise<User | null | undefined>;
	isModerator(user: User): Promise<boolean>;
	suspend(user: User, actor: Actor): Promise<unknown>;
	unsuspend(user: User, actor: Actor): Promise<unknown>;
	updateUser(id: string, values: {
		avatar?: null;
		avatarId?: null;
		avatarUrl?: null;
		avatarBlurhash?: null;
		banner?: null;
		bannerId?: null;
		bannerUrl?: null;
		bannerBlurhash?: null;
	}): Promise<unknown>;
	findUserProfileByUserIdOrFail(userId: string): Promise<Profile>;
	updateUserProfile(userId: string, values: { moderationNote: string }): Promise<unknown>;
	logUserAvatarUnset(actor: Actor, values: { userId: string; userUsername: string; userHost: string | null; fileId: string }): unknown;
	logUserBannerUnset(actor: Actor, values: { userId: string; userUsername: string; userHost: string | null; fileId: string }): unknown;
	logUserNoteUpdate(actor: Actor, values: { userId: string; userUsername: string; userHost: string | null; before: string | null; after: string }): unknown;
	findAbuseReportById(id: string): Promise<Report | null | undefined>;
	forwardAbuseReport(reportId: string, actor: Actor): Promise<unknown>;
	resolveAbuseReports(reports: { reportId: string; resolvedAs: 'accept' | 'reject' | null }[], actor: Actor): Promise<unknown>;
	updateAbuseReport(reportId: string, values: { moderationNote: string | undefined }, actor: Actor): Promise<unknown>;
	deleteAbuseReportNotificationRecipient(id: string, actor: Actor): Promise<unknown>;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor<Actor extends { id: string }>(context: ModerationContext<Actor> | null | undefined): Actor {
	if (context?.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted moderation actor is required');
	}

	// Keep the authenticated object intact: core services consume moderator details beyond its ID.
	return context.actor;
}

/** Create the nine void moderation commands from narrow ports supplied by the host composition root. */
export function createModerationCommands<
	User extends ModerationUser,
	Profile extends ModerationUserProfile,
	Report extends ModerationAbuseReport,
	Actor extends { id: string },
>(deps: ModerationDependencies<User, Profile, Report, Actor>) {
	const bind = featureProcedure<ModerationContext<Actor>>();

	return {
		'admin/suspend-user': bind(moderationCommandsContract['admin/suspend-user'], async ({ input, context }) => {
			const actor = requireActor(context);
			const user = await deps.findUserById(input.userId);

			if (user == null) throw new Error('user not found');
			if (await deps.isModerator(user)) throw new Error('cannot suspend moderator account');

			await deps.suspend(user, actor);
		}),
		'admin/unsuspend-user': bind(moderationCommandsContract['admin/unsuspend-user'], async ({ input, context }) => {
			const actor = requireActor(context);
			const user = await deps.findUserById(input.userId);

			if (user == null) throw new Error('user not found');

			await deps.unsuspend(user, actor);
		}),
		'admin/unset-user-avatar': bind(moderationCommandsContract['admin/unset-user-avatar'], async ({ input, context }) => {
			const actor = requireActor(context);
			const user = await deps.findUserById(input.userId);

			if (user == null) throw new Error('user not found');
			const avatarId = user.avatarId;
			if (avatarId == null) return;

			await deps.updateUser(user.id, {
				avatar: null,
				avatarId: null,
				avatarUrl: null,
				avatarBlurhash: null,
			});

			void deps.logUserAvatarUnset(actor, {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
				fileId: avatarId,
			});
		}),
		'admin/unset-user-banner': bind(moderationCommandsContract['admin/unset-user-banner'], async ({ input, context }) => {
			const actor = requireActor(context);
			const user = await deps.findUserById(input.userId);

			if (user == null) throw new Error('user not found');
			const bannerId = user.bannerId;
			if (bannerId == null) return;

			await deps.updateUser(user.id, {
				banner: null,
				bannerId: null,
				bannerUrl: null,
				bannerBlurhash: null,
			});

			void deps.logUserBannerUnset(actor, {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
				fileId: bannerId,
			});
		}),
		'admin/update-user-note': bind(moderationCommandsContract['admin/update-user-note'], async ({ input, context }) => {
			const actor = requireActor(context);
			const user = await deps.findUserById(input.userId);

			if (user == null) throw new Error('user not found');

			const currentProfile = await deps.findUserProfileByUserIdOrFail(user.id);
			await deps.updateUserProfile(user.id, { moderationNote: input.text });

			void deps.logUserNoteUpdate(actor, {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
				before: currentProfile.moderationNote,
				after: input.text,
			});
		}),
		'admin/forward-abuse-user-report': bind(moderationCommandsContract['admin/forward-abuse-user-report'], async ({ input, context }) => {
			const actor = requireActor(context);
			const report = await deps.findAbuseReportById(input.reportId);
			if (!report) throw deps.createError(moderationCommandErrors['admin/forward-abuse-user-report'].noSuchAbuseReport);

			await deps.forwardAbuseReport(report.id, actor);
		}),
		'admin/resolve-abuse-user-report': bind(moderationCommandsContract['admin/resolve-abuse-user-report'], async ({ input, context }) => {
			const actor = requireActor(context);
			const report = await deps.findAbuseReportById(input.reportId);
			if (!report) throw deps.createError(moderationCommandErrors['admin/resolve-abuse-user-report'].noSuchAbuseReport);

			await deps.resolveAbuseReports([{ reportId: report.id, resolvedAs: input.resolvedAs ?? null }], actor);
		}),
		'admin/update-abuse-user-report': bind(moderationCommandsContract['admin/update-abuse-user-report'], async ({ input, context }) => {
			const actor = requireActor(context);
			const report = await deps.findAbuseReportById(input.reportId);
			if (!report) throw deps.createError(moderationCommandErrors['admin/update-abuse-user-report'].noSuchAbuseReport);

			await deps.updateAbuseReport(report.id, { moderationNote: input.moderationNote }, actor);
		}),
		'admin/abuse-report/notification-recipient/delete': bind(moderationCommandsContract['admin/abuse-report/notification-recipient/delete'], async ({ input, context }) => {
			const actor = requireActor(context);
			await deps.deleteAbuseReportNotificationRecipient(input.id, actor);
		}),
	};
}

export type ModerationCommandsFeature<
	User extends ModerationUser,
	Profile extends ModerationUserProfile,
	Report extends ModerationAbuseReport,
	Actor extends { id: string },
> = ReturnType<typeof createModerationCommands<User, Profile, Report, Actor>>;

const legacyResolveAbuseReportInput = toLegacyJsonSchema(
	moderationCommandInputs['admin/resolve-abuse-user-report'],
	{ target: 'openapi-3.0' },
);
const resolvedAsProjection = legacyResolveAbuseReportInput.properties?.resolvedAs;
if (resolvedAsProjection == null || typeof resolvedAsProjection !== 'object' || Array.isArray(resolvedAsProjection)) {
	throw new Error('The resolve-abuse-user-report schema must project its resolvedAs property');
}
// The legacy AJV schema lists null in enum as well as nullable:true. OpenAPI's nullable wrapper
// does not add null to an enum, so restore that equivalent legacy projection after conversion.
const legacyResolveAbuseReportCompatibilityInput: JsonSchema = {
	...legacyResolveAbuseReportInput,
	properties: {
		...legacyResolveAbuseReportInput.properties,
		resolvedAs: {
			...resolvedAsProjection,
			enum: resolvedAsProjection.enum?.includes(null)
				? resolvedAsProjection.enum
				: [...(resolvedAsProjection.enum ?? []), null],
		},
	},
};

export const legacyModerationCommandSchemas: Record<keyof typeof moderationCommandInputs, { input: JsonSchema }> = {
	'admin/suspend-user': { input: toLegacyJsonSchema(moderationCommandInputs['admin/suspend-user'], { target: 'openapi-3.0' }) },
	'admin/unsuspend-user': { input: toLegacyJsonSchema(moderationCommandInputs['admin/unsuspend-user'], { target: 'openapi-3.0' }) },
	'admin/unset-user-avatar': { input: toLegacyJsonSchema(moderationCommandInputs['admin/unset-user-avatar'], { target: 'openapi-3.0' }) },
	'admin/unset-user-banner': { input: toLegacyJsonSchema(moderationCommandInputs['admin/unset-user-banner'], { target: 'openapi-3.0' }) },
	'admin/update-user-note': { input: toLegacyJsonSchema(moderationCommandInputs['admin/update-user-note'], { target: 'openapi-3.0' }) },
	'admin/forward-abuse-user-report': { input: toLegacyJsonSchema(moderationCommandInputs['admin/forward-abuse-user-report'], { target: 'openapi-3.0' }) },
	'admin/resolve-abuse-user-report': { input: legacyResolveAbuseReportCompatibilityInput },
	'admin/update-abuse-user-report': { input: toLegacyJsonSchema(moderationCommandInputs['admin/update-abuse-user-report'], { target: 'openapi-3.0' }) },
	'admin/abuse-report/notification-recipient/delete': { input: toLegacyJsonSchema(moderationCommandInputs['admin/abuse-report/notification-recipient/delete'], { target: 'openapi-3.0' }) },
};

export { moderationCommandErrors } from '../contract/index.js';
