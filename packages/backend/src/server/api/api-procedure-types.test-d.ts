/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { createRouterClient } from '@orpc/server';
import * as v from 'valibot';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export function apiProcedureInference(context: ApiContext<ApiActor>) {
	const contract = oc.$meta({ requestName: 'type-proof' }).input(v.object({ name: v.string() })).output(v.strictObject({ name: v.string() }));
	const procedure = createApiProcedure<ApiActor>();

	// @ts-expect-error Output inference rejects a number where the contract requires a string.
	procedure(contract).handler(() => ({ name: 1 }));
	procedure(contract, { requireCredential: true }).handler(({ input, context }) => {
		// @ts-expect-error Requiring credentials alone does not prove a non-null principal.
		context.principal.id.toUpperCase();
		return { name: input.name };
	});
	const authenticated = procedure(contract, { requireCredential: true }).use(requirePrincipal<ApiActor>()).handler(({ input, context }) => {
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
