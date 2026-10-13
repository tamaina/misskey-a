/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractProcedure } from '@orpc/contract';
import type { AnySchema, ErrorMap, Meta } from '@orpc/contract';
import { DecoratedProcedure } from '@orpc/server';
import type { Context } from '@orpc/server';
import type { ApiProcedureMetadata } from '@features/api/backend/transport/policy.types.js';

/** Portable aliases need their own request name/path; all schemas and policy flags stay shared. */
export function aliasTwoFactorContract<Input extends AnySchema, Output extends AnySchema, Errors extends ErrorMap, Metadata extends Meta & ApiProcedureMetadata>(
	contract: ContractProcedure<Input, Output, Errors, Metadata>, requestName: string,
) {
	const definition = contract['~orpc'];
	const { requestName: _legacyName, ...metadata } = definition.meta;
	return new ContractProcedure({
		...definition, meta: { ...metadata, requestName }, route: { ...definition.route, path: `/${requestName}` },
	});
}

/** Cloning the definition preserves the already captured legacy policy/rate bucket.
 * Do not rebuild createApiProcedure from the alias metadata, or split the quota. */
export function aliasTwoFactorProcedure<Initial extends Context, Current extends Context, Input extends AnySchema, Output extends AnySchema, Errors extends ErrorMap, Metadata extends Meta & ApiProcedureMetadata>(
	procedure: DecoratedProcedure<Initial, Current, Input, Output, Errors, Metadata>, requestName: string,
) {
	const definition = procedure['~orpc'];
	const { requestName: _legacyName, ...metadata } = definition.meta;
	return new DecoratedProcedure({
		...definition, meta: { ...metadata, requestName }, route: { ...definition.route, path: `/${requestName}` },
	});
}
