/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectParams } from '../../api/contract/index.js';

export const statsResult = v.object({
	notesCount: v.number(),
	originalNotesCount: v.number(),
	usersCount: v.number(),
	originalUsersCount: v.number(),
	reactionsCount: v.number(),
	instances: v.number(),
	driveUsageLocal: v.number(),
	driveUsageRemote: v.number(),
});

export const statisticsContract = {
	stats: oc.route({ method: 'POST', path: '/stats', tags: ['meta'] })
		.input(v.optional(objectParams, {}))
		.output(statsResult),
};

type Inputs = InferContractRouterInputs<typeof statisticsContract>;
type Outputs = InferContractRouterOutputs<typeof statisticsContract>;
export type StatisticsEndpoints = {
	[K in keyof typeof statisticsContract]: { req: Inputs[K]; res: Outputs[K] };
};
