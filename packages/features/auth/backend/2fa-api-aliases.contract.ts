/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractProcedure } from '@orpc/contract';
import type { AnySchema, ErrorMap, Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

/** Portable aliases need their own request name/path; all schemas and policy flags stay shared. */
export function aliasTwoFactorContract<Input extends AnySchema, Output extends AnySchema, Errors extends ErrorMap, Metadata extends Meta & ApiProcedureMetadata, RequestName extends string>(
	contract: ContractProcedure<Input, Output, Errors, Metadata>, requestName: RequestName,
) {
	const definition = contract['~orpc'];
	const { requestName: legacyName, ...metadata } = definition.meta;
	if (!legacyName) throw new Error('A compatibility alias requires a legacy request name');
	return new ContractProcedure({
		...definition, meta: { ...metadata, requestName, compatibilityAliasOf: legacyName }, route: { ...definition.route, path: `/${requestName}` },
	});
}
