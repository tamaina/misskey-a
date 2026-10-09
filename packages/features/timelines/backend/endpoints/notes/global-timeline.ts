/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { notesGlobalTimelineContract } from './global-timeline.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { TimelinesContext } from '../../operations.js';

export function createNotesGlobalTimelineProcedure<Actor extends ApiActor>() {
	return implement(notesGlobalTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<TimelinesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'notes/global-timeline' }))
		.handler(({ input, context }) => context.operations.timelines.notesGlobalTimeline(input, context.principal));
}
