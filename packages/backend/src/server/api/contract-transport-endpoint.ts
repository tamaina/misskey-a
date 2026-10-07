/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AnySchema, ContractProcedure, ErrorMap, InferSchemaOutput, Meta } from '@orpc/contract';
import type { Schema } from '@/misc/json-schema.js';
import { Endpoint } from './endpoint-base.js';
import type { EndpointExecutor } from './endpoint-base.js';
import type { IEndpointMeta } from './endpoints.js';

/**
 * Derive forwarding callback types from the native contract without projecting it.
 * The existing HTTP schema and AJV transport keep validation, defaults and identity.
 * Callers pair audited schemas: the witness does not execute native transforms or defaults.
 */
export function createContractTransportEndpoint<
	TransportMeta extends IEndpointMeta,
	Input extends AnySchema,
	Output extends AnySchema,
	Errors extends ErrorMap,
	Metadata extends Meta,
>(
	meta: TransportMeta,
	paramDef: Schema,
	_contract: ContractProcedure<Input, Output, Errors, Metadata>,
	handler: EndpointExecutor<TransportMeta, NoInfer<InferSchemaOutput<Input>>, NoInfer<InferSchemaOutput<Output>>>,
): Endpoint<TransportMeta, InferSchemaOutput<Input>, InferSchemaOutput<Output>> {
	return new Endpoint<TransportMeta, InferSchemaOutput<Input>, InferSchemaOutput<Output>>(meta, paramDef, handler);
}
