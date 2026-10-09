/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesTimelineContract } from './timeline.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { TimelinesContext } from '../../operations.js';

export function createNotesTimelineProcedure<Actor extends ApiActor>() {
	return implement(notesTimelineContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<TimelinesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'notes/timeline', requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.timelines.notesTimeline(input, context.principal));
}
