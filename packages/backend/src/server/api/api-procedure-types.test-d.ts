/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { createRouterClient } from '@orpc/server';
import * as v from 'valibot';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { ApiProcedureMetadata } from '@features/api/backend/transport/policy.types.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export function apiProcedureInference(context: ApiContext<ApiActor>) {
	const contract = oc.$meta({ requestName: 'type-proof', requireCredential: true } satisfies ApiProcedureMetadata).input(v.object({ name: v.string() })).output(v.strictObject({ name: v.string() }));
	const procedure = createApiProcedure<ApiActor>();
	// @ts-expect-error Policy names come from the portable packed role schema.
	const invalidPolicy: ApiProcedureMetadata = { requestName: 'type-proof', requiredRolePolicy: 'unknownRolePolicy' };
	// @ts-expect-error Implementations cannot override contract credential declarations.
	procedure(contract, { requireCredential: false });
	// @ts-expect-error Implementations cannot override contract token scopes.
	procedure(contract, { kind: 'other' });
	// @ts-expect-error Implementations cannot override contract role declarations.
	procedure(contract, { requiredRolePolicy: 'canManageAvatarDecorations' });
	void invalidPolicy;

	// @ts-expect-error Output inference rejects a number where the contract requires a string.
	procedure(contract).handler(() => ({ name: 1 }));
	procedure(contract).handler(({ input, context }) => {
		// @ts-expect-error Requiring credentials alone does not prove a non-null principal.
		context.principal.id.toUpperCase();
		return { name: input.name };
	});
	const authenticated = procedure(contract).use(requirePrincipal<ApiActor>()).handler(({ input, context }) => {
		const id: string = context.principal.id.toUpperCase();
		return { name: input.name + id };
	});
	const client = createRouterClient({ authenticated }, { context });
	// @ts-expect-error Input inference rejects a number where the contract requires a string.
	client.authenticated({ name: 1 });
	client.authenticated({ name: 'name' }).then(output => {
		// @ts-expect-error Client output remains a string after the procedure factory.
		const wrong: number = output.name;
		return wrong;
	});
}
