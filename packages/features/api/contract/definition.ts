/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { Route } from '@orpc/contract';
import type * as v from 'valibot';

/** Keep portable schemas and their oRPC contract together as one definition. */
export function defineEndpointContract<Input extends v.GenericSchema, Output extends v.GenericSchema>(
	route: Route,
	input: Input,
	output: Output,
) {
	return { input, output, contract: oc.route(route).input(input).output(output) } as const;
}

/** Wire defaults to logical input for every existing JSON definition. */
export type EndpointContractDefinition<
	Input extends v.GenericSchema,
	Output extends v.GenericSchema,
	WireInput extends v.GenericSchema = Input,
> = {
	readonly input: Input;
	readonly output: Output;
	readonly contract: ReturnType<typeof defineEndpointContract<WireInput, Output>>['contract'];
} & (
	| { readonly transport?: undefined; readonly wireInput?: never }
	| { readonly transport: 'multipart/form-data'; readonly wireInput: WireInput }
);
