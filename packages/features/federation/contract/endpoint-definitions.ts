/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { resultObject } from '../../api/contract/result-object.js';

export const inlineAdminRelaysAddInput = v.looseObject({
	"inbox": v.string(),
});
export const inlineAdminRelaysAddOutput = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"inbox": v.pipe(v.string(), v.metadata({ "format": "url" })),
	"status": v.pipe(v.picklist(["requesting", "accepted", "rejected"]), v.metadata({ "default": "requesting" })),
});
export const inlineAdminRelaysAddDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/relays/add', tags: ["admin"] },
	inlineAdminRelaysAddInput,
	inlineAdminRelaysAddOutput,
);

export const inlineAdminRelaysListInput = v.looseObject({});
export const inlineAdminRelaysListOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"inbox": v.pipe(v.string(), v.metadata({ "format": "url" })),
		"status": v.pipe(v.picklist(["requesting", "accepted", "rejected"]), v.metadata({ "default": "requesting" })),
	}));
export const inlineAdminRelaysListDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/relays/list', tags: ["admin"] },
	inlineAdminRelaysListInput,
	inlineAdminRelaysListOutput,
);

export const inlineApGetInput = v.looseObject({
	"uri": v.string(),
});
export const inlineApGetOutput = resultObject({});
export const inlineApGetDefinition = defineEndpointContract(
	{ method: 'POST', path: '/ap/get', tags: ["federation"] },
	inlineApGetInput,
	inlineApGetOutput,
);

export const inlineEndpointDefinitions = {
	"admin/relays/add": inlineAdminRelaysAddDefinition,
	"admin/relays/list": inlineAdminRelaysListDefinition,
	"ap/get": inlineApGetDefinition,
} as const;

export const inlineEndpointContracts = {
	"admin/relays/add": inlineAdminRelaysAddDefinition.contract,
	"admin/relays/list": inlineAdminRelaysListDefinition.contract,
	"ap/get": inlineApGetDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
