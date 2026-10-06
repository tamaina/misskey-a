/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { Context, ProcedureHandler } from '@orpc/server';
import type { AnySchema, ContractProcedure, ErrorMap, InferSchemaInput, InferSchemaOutput, Meta } from '@orpc/contract';

/** Bind a contract to a handler while preserving its inferred input, output and context. */
export function featureProcedure<FeatureContext extends Context>() {
	return <Input extends AnySchema, Output extends AnySchema, Errors extends ErrorMap, Metadata extends Meta>(
		contract: ContractProcedure<Input, Output, Errors, Metadata>,
		handler: ProcedureHandler<FeatureContext, InferSchemaOutput<Input>, InferSchemaInput<Output>, Errors, Metadata>,
	) => createProcedureClient(implement(contract)
		.$context<FeatureContext>()
		.handler(handler), { context: (context: FeatureContext) => context });
}
