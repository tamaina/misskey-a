/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineAdminGetIndexStatsInput = v.looseObject({});
export const inlineAdminGetIndexStatsOutput = v.array(resultObject({
		"tablename": v.string(),
		"indexname": v.string(),
	}));
export const inlineAdminGetIndexStatsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/get-index-stats', tags: ["admin"] },
	inlineAdminGetIndexStatsInput,
	inlineAdminGetIndexStatsOutput,
);

export const inlineAdminGetTableStatsInput = v.looseObject({});
export const inlineAdminGetTableStatsOutput = v.pipe(v.record(v.string(), resultObject({
		"count": v.number(),
		"size": v.number(),
	})), v.metadata({ "example": { "migrations": { "count": 66, "size": 32768 } } }));
export const inlineAdminGetTableStatsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/get-table-stats', tags: ["admin"] },
	inlineAdminGetTableStatsInput,
	inlineAdminGetTableStatsOutput,
);

export const inlineEndpointDefinitions = {
	"admin/get-index-stats": inlineAdminGetIndexStatsDefinition,
	"admin/get-table-stats": inlineAdminGetTableStatsDefinition,
} as const;

export const inlineEndpointContracts = {
	"admin/get-index-stats": inlineAdminGetIndexStatsDefinition.contract,
	"admin/get-table-stats": inlineAdminGetTableStatsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
