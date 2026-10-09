/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../relationships.contract.js';
import type { RelationshipsDependencies } from '../../api.implementation.js';
import ms from 'ms';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { relationshipsErrors } from '../relationships.errors.js';
export function createMuteCreateProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'getterService' | 'mutingsRepository' | 'userMutingService'>) {
	return implement(relationshipsContract["mute/create"], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({
		name: 'mute/create', requireCredential: true, prohibitMoved: true, kind: 'write:mutes', limit: {
			duration: ms('1hour'),
			max: 20,
		}
	})).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const muter = me;

			// 自分自身
			if (me.id === ps.userId) {
				throw apiError(relationshipsErrors['mute/create'].muteeIsYourself);
			}

			// Get mutee
			const mutee = await deps.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['mute/create'].noSuchUser);
				throw err;
			});

			// Check if already muting
			const exist = await deps.mutingsRepository.exists({
				where: {
					muterId: muter.id,
					muteeId: mutee.id,
				},
			});

			if (exist) {
				throw apiError(relationshipsErrors['mute/create'].alreadyMuting);
			}

			if (ps.expiresAt && ps.expiresAt <= Date.now()) {
				return;
			}

			await deps.userMutingService.mute(muter, mutee, ps.expiresAt ? new Date(ps.expiresAt) : null);
		});
}
