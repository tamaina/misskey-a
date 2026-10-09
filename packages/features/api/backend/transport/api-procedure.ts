/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AnySchema, ContractProcedure, ErrorMap, Meta } from '@orpc/contract';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from './context.js';
import { authentication, apiPolicy } from './middleware.js';
import type { ApiPolicy } from './middleware.js';

/** Return the native builder so middleware and handler inference remain oRPC-owned. */
export function createApiProcedure<Actor extends ApiActor>() {
	return <Input extends AnySchema, Output extends AnySchema, Errors extends ErrorMap, Metadata extends Meta & { requestName: string }>(
		contract: ContractProcedure<Input, Output, Errors, Metadata>,
		policy: Omit<ApiPolicy, 'name'> = {},
	) => implement(contract, {
		initialInputValidationIndex: Number.POSITIVE_INFINITY,
		initialOutputValidationIndex: Number.NaN,
	}).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ ...policy, name: contract['~orpc'].meta.requestName }));
}
