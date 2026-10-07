/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const voidUsersReportAbuseInput = v.object({
	"userId": misskeyId,
	"comment": jsonString({ "minLength": 1, "maxLength": 2048 }),
});
export const voidUsersReportAbuseOutput = v.void();
export const voidUsersReportAbuseDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/report-abuse", tags: ["users"] },
	voidUsersReportAbuseInput,
	voidUsersReportAbuseOutput,
);

export const voidEndpointDefinitions = {
	"users/report-abuse": voidUsersReportAbuseDefinition,
} as const;

export const voidEndpointContracts = {
	"users/report-abuse": voidUsersReportAbuseDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
