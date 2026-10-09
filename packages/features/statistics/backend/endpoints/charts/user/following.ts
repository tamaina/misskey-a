/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartPerUserFollowingContract, chartPerUserFollowingGetContract } from './following.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../../api.implementation.js';
export function createPerUserFollowingProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userFollowing']) {
	return createApiProcedure<Actor>()(chartPerUserFollowingContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}
export function createPerUserFollowingGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userFollowing']) {
	return createApiProcedure<Actor>()(chartPerUserFollowingGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['userFollowing']['getChart']>>) {
	return { local: { followings: { total: value.local.followings.total.map(item => item), inc: value.local.followings.inc.map(item => item), dec: value.local.followings.dec.map(item => item) }, followers: { total: value.local.followers.total.map(item => item), inc: value.local.followers.inc.map(item => item), dec: value.local.followers.dec.map(item => item) } }, remote: { followings: { total: value.remote.followings.total.map(item => item), inc: value.remote.followings.inc.map(item => item), dec: value.remote.followings.dec.map(item => item) }, followers: { total: value.remote.followers.total.map(item => item), inc: value.remote.followers.inc.map(item => item), dec: value.remote.followers.dec.map(item => item) } } };
}
