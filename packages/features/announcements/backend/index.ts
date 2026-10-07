/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '@features/api/contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { announcementCommandErrors, announcementCommandInputs, announcementCommandsContract } from '../contract/index.js';

export interface AnnouncementCommandsContext<Actor extends { id: string }> {
	actor: Actor;
}

/** Exact update payload sent to the legacy service, including undefined optionals. */
export interface AnnouncementUpdateValues {
	updatedAt: Date;
	title: string | undefined;
	text: string | undefined;
	imageUrl: string | null;
	display: 'normal' | 'banner' | 'dialog' | undefined;
	icon: 'info' | 'warning' | 'error' | 'success' | undefined;
	forExistingUsers: boolean | undefined;
	silence: boolean | undefined;
	needConfirmationToRead: boolean | undefined;
	isActive: boolean | undefined;
}

/** Narrow service boundary for the three announcement command endpoints. */
export interface AnnouncementCommandsDependencies<Announcement, Actor extends { id: string }> {
	findById(id: string): Promise<Announcement | null | undefined>;
	update(announcement: Announcement, values: AnnouncementUpdateValues, actor: Actor): Promise<unknown>;
	delete(announcement: Announcement, actor: Actor): Promise<unknown>;
	read(actor: Actor, announcementId: string): Promise<unknown>;
	now(): Date;
	createError(definition: ApiErrorDefinition): Error;
}

function requireAnnouncementActor<Actor extends { id: string }>(context: AnnouncementCommandsContext<Actor> | null | undefined): Actor {
	if (context == null || context.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('An authenticated announcement actor is required');
	}

	return context.actor;
}

/** Build announcement writes with explicit route-specific missing-row errors. */
export function createAnnouncementCommands<Announcement, Actor extends { id: string }>(deps: AnnouncementCommandsDependencies<Announcement, Actor>) {
	const clientContext = (context: AnnouncementCommandsContext<Actor>) => context;

	const update = createProcedureClient(implement(announcementCommandsContract['admin/announcements/update'])
		.$context<AnnouncementCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireAnnouncementActor(context);
			const announcement = await deps.findById(input.id);
			if (announcement == null) throw deps.createError(announcementCommandErrors['admin/announcements/update'].noSuchAnnouncement);

			await deps.update(announcement, {
				updatedAt: deps.now(),
				title: input.title,
				text: input.text,
				/* Preserve the legacy `|| null` behavior: empty and absent URLs clear the image. */
				imageUrl: input.imageUrl || null,
				display: input.display,
				icon: input.icon,
				forExistingUsers: input.forExistingUsers,
				silence: input.silence,
				needConfirmationToRead: input.needConfirmationToRead,
				isActive: input.isActive,
			}, actor);
		}), { context: clientContext });

	const deleteAnnouncement = createProcedureClient(implement(announcementCommandsContract['admin/announcements/delete'])
		.$context<AnnouncementCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireAnnouncementActor(context);
			const announcement = await deps.findById(input.id);
			if (announcement == null) throw deps.createError(announcementCommandErrors['admin/announcements/delete'].noSuchAnnouncement);

			await deps.delete(announcement, actor);
		}), { context: clientContext });

	const read = createProcedureClient(implement(announcementCommandsContract['i/read-announcement'])
		.$context<AnnouncementCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireAnnouncementActor(context);
			await deps.read(actor, input.announcementId);
		}), { context: clientContext });

	return {
		'admin/announcements/update': update,
		'admin/announcements/delete': deleteAnnouncement,
		'i/read-announcement': read,
	};
}

export type AnnouncementCommandsFeature<Announcement, Actor extends { id: string }> = ReturnType<typeof createAnnouncementCommands<Announcement, Actor>>;

export const legacyAnnouncementCommandSchemas: Record<keyof typeof announcementCommandInputs, { input: JsonSchema }> = {
	'admin/announcements/update': { input: toLegacyJsonSchema(announcementCommandInputs['admin/announcements/update'], { target: 'openapi-3.0' }) },
	'admin/announcements/delete': { input: toLegacyJsonSchema(announcementCommandInputs['admin/announcements/delete'], { target: 'openapi-3.0' }) },
	'i/read-announcement': { input: toLegacyJsonSchema(announcementCommandInputs['i/read-announcement'], { target: 'openapi-3.0' }) },
};
