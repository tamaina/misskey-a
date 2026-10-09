/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AnySchema, ContractProcedure, ErrorMap, Meta } from '@orpc/contract';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from './context.js';
import { authentication, apiPolicy } from './middleware.js';
import type { ApiProcedureMetadata } from './policy.types.js';

/** Return the native builder so middleware and handler inference remain oRPC-owned. */
export function createApiProcedure<Actor extends ApiActor>() {
	return <Input extends AnySchema, Output extends AnySchema, Errors extends ErrorMap, Metadata extends Meta & ApiProcedureMetadata>(
		contract: ContractProcedure<Input, Output, Errors, Metadata>,
	) => {
		const metadata = contract['~orpc'].meta;
		const name = metadata.requestName ?? contract['~orpc'].route.path?.replace(/^\//, '');
		if (!name) throw new Error('API procedure must declare a request name or HTTP path');
		return implement(contract, {
			initialInputValidationIndex: Number.POSITIVE_INFINITY,
			initialOutputValidationIndex: Number.NaN,
		}).$context<ApiContext<Actor>>()
			.use(authentication<Actor>())
			.use(apiPolicy<Actor>({
				name,
				requireCredential: metadata.requireCredential,
				requiredRolePolicy: metadata.requiredRolePolicy,
				kind: metadata.kind,
				secure: metadata.secure,
				requireModerator: metadata.requireModerator,
				requireAdmin: metadata.requireAdmin,
				prohibitMoved: metadata.prohibitMoved,
				limit: metadata.limit,
			}));
	};
}
