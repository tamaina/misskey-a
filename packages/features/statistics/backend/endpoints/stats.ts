/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { statsContract } from './stats.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../api.implementation.js';
export function createStatsProcedure<Actor extends ApiActor>(deps: Pick<StatisticsDependencies, 'readNotes' | 'readUsers' | 'countReactions' | 'countInstances'>) {
	return createApiProcedure<Actor>()(statsContract)
		.handler(async () => {
			const notes = await deps.readNotes();
			const users = await deps.readUsers();
			const [reactionsCount, instances] = await Promise.all([deps.countReactions(), deps.countInstances()]);
			return {
				notesCount: notes.local + notes.remote, originalNotesCount: notes.local,
				usersCount: users.local + users.remote, originalUsersCount: users.local,
				reactionsCount, instances, driveUsageLocal: 0, driveUsageRemote: 0
			};
		});
}
