/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { statsContract } from './stats.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../api.implementation.js';
export function createStatsProcedure<Actor extends ApiActor>(deps: Pick<StatisticsDependencies, 'readNotes' | 'readUsers' | 'countReactions' | 'countInstances'>) {
	return implement(statsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: statsContract['~orpc'].meta.requestName }))
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
