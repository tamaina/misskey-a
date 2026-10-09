/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import { onlineUsersCountContract } from './endpoints/get-online-users-count.contract.js';

export interface OnlineUsersCountDependencies {
	countSince(cutoff: Date): Promise<number>;
	thresholdMs: number;
}

/** Count users active after a fresh, injectable time cutoff for each request. */
export function createGetOnlineUsersCount(deps: OnlineUsersCountDependencies, now: () => number = Date.now) {
	return createProcedureClient(implement(onlineUsersCountContract).handler(async () => ({
		count: await deps.countSince(new Date(now() - deps.thresholdMs)),
	})));
}
